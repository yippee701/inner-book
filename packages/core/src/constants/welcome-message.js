import { CHAT_MODES } from './modes.js';

// 挖掘自己 - 欢迎消息
export const DISCOVER_SELF_WELCOME_MESSAGE = `你好！我是 Dora。
很高兴看到你选择暂时放下外界，回过头来审视最真实的自己。
很多时候我们感到疲惫，是因为看不清潜意识里的"出厂设置"。
接下来的 10 轮对话，我会帮你从繁杂的情绪中精准提炼出你的核心性格底色。
对话结束时，你将获得一份独一无二的《心灵白皮书》——
它会帮你看清你从未觉察的优势与心理边界。
这不仅仅是一次对话，更是你重新掌控人生、停止内耗的开始。
`;

// 看懂他人 - 欢迎消息
export const UNDERSTAND_OTHERS_WELCOME_MESSAGE = `你好！我是 Dora，很高兴能在这里遇见你。
在一段关系里，最昂贵的代价就是"我以为我懂他"。
接下来的 10 轮逻辑拆解，是为了帮你穿透对方的言语伪装，直达他的核心动机。
对话结束，我会为你生成一份关于他的《人类洞察笔记》——
帮你预判他的行为逻辑，看清你们之间的博弈点，甚至掌握维系或止损的主动权。
别再凭直觉猜测了，让我们用理性的视角，看清那个人隐藏最深的灵魂底色。
`;

// 了解孩子 - 欢迎消息
export const UNDERSTAND_CHILD_WELCOME_MESSAGE = `你好！我是 Dora，很高兴陪你一起读懂孩子。
孩子很多时候不是不愿表达，而是还没有找到足够清楚的语言。
接下来的 10 轮对话，我会帮你从日常细节、情绪反应和相处片段中，看见孩子真正想传达的需要。
对话结束时，你将获得一份关于孩子的《给父母的信》——
它会帮你更温柔也更准确地理解孩子，找到更适合你们关系的回应方式。
`;

// 消除内耗 - 欢迎消息
export const REDUCE_INNER_FRICTION_WELCOME_MESSAGE = `你好！我是 Dora。
你不需要先把自己整理得很清楚，才配开始这场对话。
内耗最折磨人的地方，是它常常把事实、情绪和自责揉成一团。
接下来的 10 轮对话，我会一次只问一个问题，陪你把这团东西慢慢拆开。
对话结束时，你将获得一份《内耗备忘录》——
它会帮你看清真正消耗你的信念、情绪背后的需求，以及可以落地的一小步。
`;

// 人生选择器 - 欢迎消息
export const LIFE_CHOICE_WELCOME_MESSAGE = `你好！我是 Dora。
如果你正站在几个选项之间摇摆，先别急着逼自己立刻“选对”。
很多人生选择不是找完美答案，而是看清每条路要交换什么、失去什么、保住什么。
接下来的 10 轮对话，我会帮你盘清事实、代价、恐惧和真正想要的东西。
对话结束时，你将获得一份《决策推演报告》——
它会给你一个更尊重本心、也更能承担后果的选择方向。
`;

// 读懂爱人 - 欢迎消息
export const UNDERSTAND_LOVER_WELCOME_MESSAGE = `你好！我是 Dora。
亲密关系里，最难的常常不是不爱，而是两个人用不同方式保护自己、靠近对方。
这次对话不会把问题简单归到某一方身上，也不会替你审判谁对谁错。
接下来的 10 轮对话，我会从细节里帮你看见对方的性格底色、亲密模式，以及你们之间反复出现的互动循环。
对话结束时，你将获得一份《爱人白皮书》——
它会帮你更清醒地理解对方，也更稳地面对这段关系里的自己。
`;

export function getWelcomeMessage(mode) {
  switch (mode) {
    case CHAT_MODES.REDUCE_INNER_FRICTION:
      return REDUCE_INNER_FRICTION_WELCOME_MESSAGE;
    case CHAT_MODES.LIFE_CHOICE:
      return LIFE_CHOICE_WELCOME_MESSAGE;
    case CHAT_MODES.UNDERSTAND_OTHERS:
      return UNDERSTAND_OTHERS_WELCOME_MESSAGE;
    case CHAT_MODES.UNDERSTAND_CHILD:
      return UNDERSTAND_CHILD_WELCOME_MESSAGE;
    case CHAT_MODES.UNDERSTAND_LOVER:
      return UNDERSTAND_LOVER_WELCOME_MESSAGE;
    case CHAT_MODES.DISCOVER_SELF:
      return DISCOVER_SELF_WELCOME_MESSAGE;
    default:
      return DISCOVER_SELF_WELCOME_MESSAGE;
  }
}
