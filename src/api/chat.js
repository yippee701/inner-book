// Mock 数据导入 - 删除 mock 功能时，删除此行和 mockData.js 文件
import { mockSendMessage } from './mockData';

// 后端 API 配置
const API_CONFIG = {
  // Python 后端服务地址
  serverUrl: import.meta.env.VITE_SERVER_URL || 'http://localhost:80',
};

// Mock 模式：当显式设置 VITE_MOCK_MODE=true 时启用
export const IS_MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

// 首条欢迎消息（由 AI 生成的开场白）
export const WELCOME_MESSAGE = `欢迎你踏上这段自我探索的旅程。在接下来的时间里，我们将进行大约5轮的深度对话。每次我会提出一个问题，请你从记忆和感受中寻找答案。你回答后，我会给你一个简短的反馈，然后我们继续。

这个过程大约会占用你20分钟，但它的价值，是帮你找到那些被你忽视、甚至误认为是"缺点"的底层天赋。这些天赋是你的出厂设置，是你面对世界时最自然、最有力的方式。它们永远不会过期，我们只是要擦去上面的灰尘，看清它的全貌。

那么，我们开始吧。请放松，诚实地面对自己。`;

/**
 * 打字机效果 - 逐字显示文本
 * @param {string} text - 要显示的完整文本
 * @param {Function} onUpdate - 每次更新时的回调
 * @param {number} speed - 每个字符的延迟（毫秒）
 */
export function typewriterEffect(text, onUpdate, speed = 30) {
  return new Promise((resolve) => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      onUpdate(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        resolve(text);
      }
    }, speed);
  });
}

/**
 * 发送消息到后端 API（代理 LLM 请求）
 * @param {Array} messages - 对话历史 [{role: 'user'|'assistant', content: string}]
 * @param {Function} onStream - 流式输出回调（可选）
 * @returns {Promise<string>} AI 回复内容
 */
export async function sendMessage(messages, onStream = null) {
  // Mock 模式
  if (IS_MOCK_MODE) {
    console.log('[Mock Mode] 使用模拟数据，未调用真实 API');
    return mockSendMessage(messages, onStream);
  }

  try {
    const response = await fetch(`${API_CONFIG.serverUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: !!onStream,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API 请求失败: ${response.status}`);
    }

    // 流式输出
    if (onStream) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;
          
          const data = trimmedLine.slice(5).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onStream(fullContent);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }

      // 处理缓冲区剩余数据
      if (buffer.trim()) {
        const trimmedLine = buffer.trim();
        if (trimmedLine.startsWith('data:')) {
          const data = trimmedLine.slice(5).trim();
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onStream(fullContent);
              }
            } catch (e) {
              // 忽略
            }
          }
        }
      }

      return fullContent;
    }

    // 非流式输出
    const data = await response.json();
    const content = data.content || '抱歉，我暂时无法回应。';
    
    return content;

  } catch (error) {
    console.error('API 调用失败:', error);
    throw error;
  }
}

/**
 * 发送消息并使用打字机效果显示（备用方案）
 */
export async function sendMessageWithTypewriter(messages, onUpdate, typingSpeed = 25) {
  // Mock 模式
  if (IS_MOCK_MODE) {
    console.log('[Mock Mode] 使用模拟数据，未调用真实 API');
    return mockSendMessage(messages, onUpdate);
  }

  try {
    const response = await fetch(`${API_CONFIG.serverUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content || '抱歉，我暂时无法回应。';
    
    // 使用打字机效果逐字显示
    await typewriterEffect(content, onUpdate, typingSpeed);
    
    return content;

  } catch (error) {
    console.error('API 调用失败:', error);
    throw error;
  }
}
