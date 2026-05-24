// routes/openai.routers.js
const express = require('express');
const axios = require('axios');
const { 
  DISCOVER_SELF_SYSTEM_PROMPT, 
  UNDERSTAND_OTHERS_SYSTEM_PROMPT,
  UNDERSTAND_CHILD_SYSTEM_PROMPT,
  FINAL_REPORT_SYSTEM_SUFFIX,
} = require('../constants/prompts');

/** 用户+助手消息合计超过此条数时，强制进入终稿模式（13 轮往返约 26 条，超过即第 14 轮及以后） */
const FORCE_FINAL_REPORT_MESSAGE_THRESHOLD = 26;

const LAST_USER_FORCE_REPORT_HINT =
  '\n\n（对话已达轮次上限：请直接输出以 [Report] 开头的完整《Inner Book》，不要提问。）';

// 创建路由实例
const router = express.Router();

// OpenAI 基础配置（建议从环境变量读取，适配云托管配置）
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.lkeap.cloud.tencent.com/plan/v3';
const DEFAULT_TIMEOUT = parseInt(process.env.TIMEOUT || '90000'); // 90秒超时
const SSE_HEARTBEAT_INTERVAL_MS = parseInt(process.env.SSE_HEARTBEAT_INTERVAL_MS || '15000');

const createRequestTraceId = () =>
    `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const summarizeMessages = (messages = []) => messages.map((message, index) => ({
    index,
    role: message.role,
    contentType: typeof message.content,
    contentLength: typeof message.content === 'string' ? message.content.length : undefined,
}));

const readStreamPreview = (stream, maxLength = 2000) => new Promise((resolve) => {
    let data = '';
    let settled = false;

    const settle = () => {
        if (settled) return;
        settled = true;
        resolve(data.slice(0, maxLength));
    };

    stream.on('data', (chunk) => {
        data += chunk.toString();
        if (data.length >= maxLength) {
            stream.destroy();
            settle();
        }
    });
    stream.on('end', settle);
    stream.on('error', settle);
});

const buildChatCompletionsUrl = () => {
    if (process.env.OPENAI_CHAT_COMPLETIONS_URL) {
        return {
            url: process.env.OPENAI_CHAT_COMPLETIONS_URL,
            source: 'OPENAI_CHAT_COMPLETIONS_URL',
        };
    }

    const baseUrl = OPENAI_BASE_URL.replace(/\/+$/, '');
    const isChatCompletionsUrl = /\/chat\/completions$/.test(baseUrl);
    return {
        url: isChatCompletionsUrl ? baseUrl : `${baseUrl}/chat/completions`,
        source: isChatCompletionsUrl ? 'OPENAI_BASE_URL(full endpoint)' : 'OPENAI_BASE_URL(base)',
    };
};

/**
 * 通用的 OpenAI 请求转发处理函数
 */
const forwardOpenAIRequest = async (req, res) => {
    let traceId = createRequestTraceId();
    let upstreamAbortController = null;
    let clientDisconnected = false;
    let upstreamRequestLog = null;
    try {
        const AbortControllerCtor = global.AbortController;
        upstreamAbortController = AbortControllerCtor ? new AbortControllerCtor() : null;
        let streamStarted = false;
        let heartbeatTimer = null;

        const clearHeartbeat = () => {
            if (heartbeatTimer) {
                clearInterval(heartbeatTimer);
                heartbeatTimer = null;
            }
        };

        const abortUpstream = () => {
            if (upstreamAbortController && !upstreamAbortController.signal.aborted) {
                upstreamAbortController.abort();
            }
        };

        const ensureSSEStarted = () => {
            if (streamStarted || res.destroyed || res.writableEnded) {
                return;
            }

            streamStarted = true;
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders?.();

            res.write(': connected\n\n');

            heartbeatTimer = setInterval(() => {
                if (res.destroyed || res.writableEnded) {
                    clearHeartbeat();
                    return;
                }

                res.write(': heartbeat\n\n');
            }, SSE_HEARTBEAT_INTERVAL_MS);
        };

        // 1. 构建完整的 OpenAI API 地址
        const { url: forwardUrl, source: forwardUrlSource } = buildChatCompletionsUrl();
        // 2. 获取并验证 API Key
        let apiKey = process.env.OPENAI_API_KEY || '';
        if (!apiKey) {
            return res.status(401).json({
                error: {
                    message: '未提供 OpenAI API Key，请在请求头中添加 Authorization: Bearer <your-api-key>',
                    type: 'invalid_request_error'
                }
            });
        }

        // 3. 根据 mode 参数选择系统提示词
        if (!req.body?.mode) {
            return res.status(400).json({
                error: {
                    message: '未提供 mode 参数，请在请求头中添加 mode 参数',
                    type: 'invalid_request_error'
                }
            });
        }
        const mode = req.body.mode;
        let systemPrompt = '';
        switch (mode) {
            case 'discover-self':
                systemPrompt = DISCOVER_SELF_SYSTEM_PROMPT;
                break;
            case 'understand-others':
                systemPrompt = UNDERSTAND_OTHERS_SYSTEM_PROMPT;
                break;
            case 'understand-child':
                systemPrompt = UNDERSTAND_CHILD_SYSTEM_PROMPT;
                break;
        }
        
        // 构建完整的消息列表（包含系统提示词）
        const userMessages = req.body?.messages || [];
        const forceFinalReport = userMessages.length > FORCE_FINAL_REPORT_MESSAGE_THRESHOLD;
        if (forceFinalReport) {
            systemPrompt += FINAL_REPORT_SYSTEM_SUFFIX;
        }

        let mappedUserMessages = userMessages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        if (forceFinalReport && mappedUserMessages.length > 0) {
            const last = mappedUserMessages[mappedUserMessages.length - 1];
            if (last.role === 'user') {
                mappedUserMessages = [
                    ...mappedUserMessages.slice(0, -1),
                    { role: 'user', content: last.content + LAST_USER_FORCE_REPORT_HINT }
                ];
            }
        }

        const fullMessages = [
            { role: 'system', content: systemPrompt },
            ...mappedUserMessages
        ];
        
        // 4. 构建转发请求配置
        // 判断是否为流式请求（根据请求参数或响应头）
        const isStreamRequest = req.body?.stream === true;

        res.on('finish', () => {
            clearHeartbeat();
        });

        res.on('close', () => {
            clearHeartbeat();
            if (!res.writableEnded) {
                clientDisconnected = true;
                abortUpstream();
            }
        });

        req.on('aborted', () => {
            clientDisconnected = true;
            clearHeartbeat();
            abortUpstream();
        });

        if (isStreamRequest) {
            ensureSSEStarted();
        }
        
        const model = process.env.OPENAI_MODEL || 'gemini-3-flash-preview';

        upstreamRequestLog = {
            traceId,
            method: 'POST',
            url: forwardUrl,
            urlSource: forwardUrlSource,
            baseUrl: OPENAI_BASE_URL,
            model,
            mode,
            stream: isStreamRequest,
            timeout: DEFAULT_TIMEOUT,
            maxTokens: req.body?.max_tokens,
            userMessageCount: userMessages.length,
            fullMessageCount: fullMessages.length,
            forceFinalReport,
            messages: summarizeMessages(fullMessages),
            origin: req.headers.origin,
            host: req.headers.host,
        };
        console.info(`[forwardOpenAIRequest][${traceId}] upstream request:`, upstreamRequestLog);

        const axiosConfig = {
            method: 'POST',
            url: forwardUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            data: {
                model,
                messages: fullMessages,
                stream: isStreamRequest,
                max_tokens: req.body?.max_tokens,
            },
            timeout: DEFAULT_TIMEOUT,
            // 始终使用 stream 响应类型，以便根据响应头判断
            responseType: 'stream',
            // 流式响应禁用压缩
            decompress: false,
            ...(upstreamAbortController ? { signal: upstreamAbortController.signal } : {})
        };

        // 4. 发送请求到 OpenAI
        const response = await axios(axiosConfig);
        console.info(`[forwardOpenAIRequest][${traceId}] upstream response:`, {
            status: response.status,
            contentType: response.headers['content-type'],
        });

        if (clientDisconnected || res.destroyed || res.writableEnded) {
            response.data.destroy();
            return;
        }

        // 5. 检查响应头判断是否为流式响应
        const contentType = response.headers['content-type'] || '';
        const isStreamByHeader = contentType.includes('text/event-stream');
    
        // 6. 处理响应
        // 如果请求明确要求流式，或者响应头表明是流式，则按流式处理
        if (isStreamRequest || isStreamByHeader) {
            ensureSSEStarted();

            // 流式转发数据
            response.data.on('data', (chunk) => {
                if (clientDisconnected || res.destroyed || res.writableEnded) {
                    abortUpstream();
                    response.data.destroy();
                    return;
                }

                clearHeartbeat();
                res.write(chunk);
            });
            response.data.on('end', () => {
                clearHeartbeat();
                if (!res.destroyed && !res.writableEnded) {
                    res.end();
                }
            });
            response.data.on('error', (err) => {
                clearHeartbeat();
                console.error(`[forwardOpenAIRequest][${traceId}] upstream stream error:`, err);
                if (!res.destroyed && !res.writableEnded) {
                    res.end();
                }
            });

            // 客户端断开连接时清理资源
            req.on('close', () => {
                clearHeartbeat();
                response.data.destroy();
                if (!res.destroyed && !res.writableEnded) {
                    res.end();
                }
            });
        } else {
            // 普通 JSON 响应：需要从 stream 中读取并解析
            // 先读取第一个 chunk 检查格式，判断是否为流式响应
            let allData = '';
            let firstChunkReceived = false;
            let isStreamFormat = false;
            const bufferedChunks = [];
            
            const dataHandler = (chunk) => {
                const chunkStr = chunk.toString();
                
                // 检查第一个 chunk 是否为流式格式
                if (!firstChunkReceived) {
                    firstChunkReceived = true;
                    
                    // 检查是否为流式格式：SSE 格式 (data: {...}) 或 chunk 对象
                    if (chunkStr.includes('data: ') || 
                        chunkStr.includes('"object":"chat.completion.chunk"') ||
                        chunkStr.includes('"object": "chat.completion.chunk"')) {
                        isStreamFormat = true;
                        ensureSSEStarted();
                        
                        // 移除当前监听器，改用流式处理
                        response.data.removeListener('data', dataHandler);
                        
                        // 发送已缓冲的数据
                        bufferedChunks.forEach(c => res.write(c));
                        bufferedChunks.length = 0;
                        
                        // 发送当前 chunk
                        res.write(chunk);
                        
                        // 后续数据直接转发
                        response.data.on('data', (c) => res.write(c));
                        return;
                    } else {
                        // 不是流式，缓冲数据
                        bufferedChunks.push(chunk);
                        allData += chunkStr;
                    }
                } else {
                    // 后续 chunk
                    if (isStreamFormat) {
                        // 不应该到达这里，因为已经移除了监听器
                    } else {
                        bufferedChunks.push(chunk);
                        allData += chunkStr;
                    }
                }
            };
            
            response.data.on('data', dataHandler);
            
            response.data.on('end', () => {
                if (isStreamFormat) {
                    // 流式响应已在上面的 data 事件中处理
                    res.end();
                } else {
                    // 普通 JSON 响应处理
                    try {
                        const jsonData = JSON.parse(allData);
                        // 透传响应头
                        Object.entries(response.headers).forEach(([key, value]) => {
                            // 跳过会导致冲突的响应头
                            if (!['transfer-encoding', 'connection', 'content-encoding'].includes(key.toLowerCase())) {
                                res.setHeader(key, value);
                            }
                        });
                        if (!res.destroyed && !res.writableEnded) {
                            res.status(response.status).json(jsonData);
                        }
                    } catch (parseError) {
                        console.error(`[forwardOpenAIRequest][${traceId}] 解析 JSON 响应失败:`, parseError);
                        console.error(`[forwardOpenAIRequest][${traceId}] 响应数据:`, allData.slice(0, 500));
                        if (!res.destroyed && !res.writableEnded) {
                            res.status(500).json({
                                error: {
                                    message: '解析响应数据失败',
                                    type: 'parse_error'
                                }
                            });
                        }
                    }
                }
            });
            
            response.data.on('error', (err) => {
                console.error(`[forwardOpenAIRequest][${traceId}] 读取响应流错误:`, err);
                if (!isStreamFormat) {
                    if (!res.destroyed && !res.writableEnded) {
                        res.status(500).json({
                            error: {
                                message: '读取响应数据失败',
                                type: 'stream_error'
                            }
                        });
                    }
                } else if (!res.destroyed && !res.writableEnded) {
                    res.end();
                }
            });
            
            // 客户端断开连接时清理资源
            req.on('close', () => {
                response.data.destroy();
                if (isStreamFormat && !res.destroyed && !res.writableEnded) {
                    res.end();
                }
            });
        }

    } catch (error) {
        if (clientDisconnected || res.destroyed || res.writableEnded) {
            return;
        }

        // 统一错误处理
        const statusCode = error.response?.status || 500;
        let errorMessage = error.message || '转发 OpenAI 请求失败';
        
        let upstreamResponsePreview = '';

        // 尝试从 axios 错误中提取更详细的信息
        if (error.response) {
            // 如果是 stream，需要读取错误内容
            if (error.response.data && typeof error.response.data.on === 'function') {
                upstreamResponsePreview = await readStreamPreview(error.response.data);
                try {
                    const errorData = JSON.parse(upstreamResponsePreview);
                    errorMessage = errorData?.error?.message || errorMessage;
                } catch {
                    errorMessage = upstreamResponsePreview || `API 请求失败: ${statusCode}`;
                }
            } else if (typeof error.response.data === 'object') {
                // 是普通对象，尝试提取错误信息
                upstreamResponsePreview = JSON.stringify(error.response.data).slice(0, 2000);
                errorMessage = error.response.data?.error?.message || errorMessage;
            } else if (typeof error.response.data === 'string') {
                // 是字符串，尝试解析
                upstreamResponsePreview = error.response.data.slice(0, 2000);
                try {
                    const errorData = JSON.parse(error.response.data);
                    errorMessage = errorData?.error?.message || errorMessage;
                } catch {
                    errorMessage = error.response.data || errorMessage;
                }
            }
        }
        
        const errorData = {
            error: {
                message: errorMessage,
                type: 'forward_error',
                request_id: Date.now().toString()
            }
        };
        
        console.error(`[forwardOpenAIRequest][${traceId}] [${statusCode}] OpenAI 转发错误:`, errorMessage);
        console.error(`[forwardOpenAIRequest][${traceId}] 请求转发详情:`, upstreamRequestLog);
        console.error(`[forwardOpenAIRequest][${traceId}] 错误详情:`, {
            message: error.message,
            status: statusCode,
            upstreamStatus: error.response?.status,
            upstreamStatusText: error.response?.statusText,
            upstreamContentType: error.response?.headers?.['content-type'],
            upstreamResponsePreview,
        });
        
        res.status(statusCode).json(errorData);
    }
};

// 匹配所有 OpenAI 接口路径（支持 GET/POST 等所有方法）
router.all('/*', (req, res, next) => {
    Promise.resolve(forwardOpenAIRequest(req, res)).catch(next);
});

// 导出路由模块
module.exports = router;
