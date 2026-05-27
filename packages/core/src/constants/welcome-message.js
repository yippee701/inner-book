import { CHAT_MODES } from './modes.js';

export const DISCOVER_SELF_WELCOME_MESSAGE = `你好！我是 Dora。
这次我们要做的，是把你那些“我以为很普通”的本能，翻译成一份《天赋使用说明书》。
接下来大约 10 轮，每次我只问一个问题，你慢慢答就好。
天赋永远不会过期，我们只是要找到你的底层天赋。
`;

export const REDUCE_INNER_FRICTION_WELCOME_MESSAGE = `你好！我是 Dora。
《内耗备忘录》不是用来劝你“想开点”的，而是帮你把反复消耗你的念头、事实和恐惧拆开看。
接下来大约 10 轮，每次我只问一个问题，我们会先降温，再找到可以行动的支点。
`;

export const LIFE_CHOICE_WELCOME_MESSAGE = `你好！我是 Dora。
《决策推演报告》会帮你把选择、代价、恐惧和真正想要的东西摆到桌面上。
接下来大约 10 轮，每次只处理一个问题。我们不追求完美选项，只找最尊重你本心、最少后悔的走法。
`;

export const UNDERSTAND_OTHERS_WELCOME_MESSAGE = `你好！我是 Dora。
《人类洞察笔记》会帮你从一个人的言行细节里，看见他的价值观、底层动机和相处边界。
接下来大约 10 轮，每次我只问一个问题。你提供越具体的片段，我们越能看清那个人。
`;

export const UNDERSTAND_CHILD_WELCOME_MESSAGE = `你好！我是 Dora，很高兴陪你一起读懂孩子。
《给父母的信》会帮你从日常细节、情绪反应和相处片段中，看见孩子真正想传达的需要。
接下来大约 10 轮，每次我只问一个问题，我们尽量把评价还原成事实。
`;

export const UNDERSTAND_LOVER_WELCOME_MESSAGE = `你好！我是 Dora。
《爱人白皮书》会帮你更清楚地理解伴侣的性格底色、亲密关系模式和你们之间的互动循环。
接下来大约 10 轮，每次我只问一个问题。我们会同时看见对方，也看见这段关系里的你。
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
