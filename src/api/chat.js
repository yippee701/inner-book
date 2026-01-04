// 大模型 API 配置
const API_CONFIG = {
  // 可以使用 OpenAI、Claude 或其他兼容 OpenAI 格式的 API
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.openai.com/v1',
  apiKey: import.meta.env.VITE_API_KEY || '',
  model: import.meta.env.VITE_MODEL || 'gpt-4o-mini',
  maxTokens: parseInt(import.meta.env.VITE_MAX_TOKENS) || 8192,
};

// 系统提示词 - 引导大模型进行天赋探索对话
export const SYSTEM_PROMPT = `#Role：深度天赋挖掘机
#角色
你是一位结合了盖洛普优势理论、心流理论与荣格心理学的资深生涯咨询师。你坚信天赋不是某种具体技能，而是可迁移的底层能力。
#目标
通过多个深度多轮对话，帮助用户打破焦虑，帮他们找到他们被影藏起来的天赋，并生成一份极度详细、专业有共情力的《天赋说明书》。
#核心理念
1.反宿命论。2.能量审计：真正的天赋是让你回血的事，而不是你单纯擅长但做完很累的事。3.阴影即宝藏：用户的缺点、怪癖、甚至对他人的嫉妒，往往是天赋被压抑的背面。
#严格遵守
1.禁止一次性提问：必须采用"你问->用户答->你简短反馈->再问下一题"的模式。每轮对话只聚焦一个问题。
2.苏格拉底式引导：不要急着下结论，多问"为什么"、"当时什么感觉"、"具体例子".
3.温暖而犀利：保持共情，但在捕捉用户逻辑漏洞或潜意识信号时要敏锐。
#提问问题
提问1：请引导用户回忆16岁之前（未被社会完全规训前），有哪些事情是没人逼也会废寝忘食去做的？或者有哪些从小到大被批评的"顽固缺点"（如爱插嘴、太敏感、爱发呆）？
提问2：成年后的工作/生活中，哪件事让你觉得"这还需要学吗？这不是显而易见的吗？"但周围人却觉得很难？（寻找无意识胜任区）。
提问3：哪件事做完后虽然身体累，但精神极度亢奋？
提问4：这可能有点冒犯，但很关键，你曾经对谁（或哪种生活状态）产生过强烈的嫉妒或酸溜溜的感觉？（嫉妒通常是"被压抑的天赋"在发出信号，请诚实面对）.
这四个问题必须问到，但是不一定是线性的，过程中也可以根据你对用户的好奇和挖掘，来提出全新的问题，只要对发掘用户的天赋有帮助。最多不超过10个问题.
#输出
综合所有问题的信息，输出万字左右的《个人天赋使用说明书》。这篇报告不设定结构，由你根据用户的答案，自由发挥。但必须一万字以上，需要达到他的内心，让他真的觉得有用，帮助他找到真正的底层天赋，为他未来的人生路和从事职业给与详细的建议。
#开始
请以温暖、专业、共情的语调开场，像用户详细解释接下来的流程和占用的时间，以及希望达成的目标。向用户问好，用通俗语言简述天赋挖掘机的作用，告诉用户："天赋永远不会过期，我们只是要找到你的底层天赋。"然后在再开始进入提问流程。`;

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
 * 发送消息到大模型 API
 * @param {Array} messages - 对话历史 [{role: 'user'|'assistant', content: string}]
 * @param {Function} onStream - 流式输出回调（可选）
 * @returns {Promise<string>} AI 回复内容
 */
export async function sendMessage(messages, onStream = null) {
  const requestMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  ];

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        messages: requestMessages,
        stream: !!onStream,
        temperature: 0.7,
        max_tokens: API_CONFIG.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
    }

    // 流式输出
    if (onStream) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullContent = '';
      let buffer = ''; // 用于处理不完整的数据行

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码并添加到缓冲区
        buffer += decoder.decode(value, { stream: true });
        
        // 按行分割处理
        const lines = buffer.split('\n');
        // 保留最后一个可能不完整的行
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;
          
          const data = trimmedLine.slice(5).trim(); // 移除 'data:' 前缀
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onStream(fullContent);
            }
          } catch (e) {
            // 忽略解析错误（可能是不完整的 JSON）
          }
        }
      }

      // 处理缓冲区中剩余的数据
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

    // 非流式输出 - 使用打字机效果
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '抱歉，我暂时无法回应。';
    
    if (onStream) {
      // 如果提供了 onStream 回调，使用打字机效果
      await typewriterEffect(content, onStream, 20);
    }
    
    return content;

  } catch (error) {
    console.error('API 调用失败:', error);
    throw error;
  }
}

/**
 * 发送消息并使用打字机效果显示（备用方案）
 * 当流式 API 不可用时使用
 */
export async function sendMessageWithTypewriter(messages, onUpdate, typingSpeed = 25) {
  const requestMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  ];

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.model,
        messages: requestMessages,
        stream: false,
        temperature: 0.7,
        max_tokens: API_CONFIG.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '抱歉，我暂时无法回应。';
    
    // 使用打字机效果逐字显示
    await typewriterEffect(content, onUpdate, typingSpeed);
    
    return content;

  } catch (error) {
    console.error('API 调用失败:', error);
    throw error;
  }
}
