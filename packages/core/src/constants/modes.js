/**
 * 对话模式枚举
 */
export const CHAT_MODES = {
  DISCOVER_SELF: 'discover-self',
  REDUCE_INNER_FRICTION: 'reduce-inner-friction',
  LIFE_CHOICE: 'life-choice',
  UNDERSTAND_OTHERS: 'understand-others',
  UNDERSTAND_CHILD: 'understand-child',
  UNDERSTAND_LOVER: 'understand-lover',
};

/**
 * 模式配置信息
 */
export const MODE_CONFIG = {
  [CHAT_MODES.DISCOVER_SELF]: {
    label: '发现天赋',
    description: '找到可迁移的底层天赋',
  },
  [CHAT_MODES.REDUCE_INNER_FRICTION]: {
    label: '消除内耗',
    description: '理清情绪与反复消耗的念头',
  },
  [CHAT_MODES.LIFE_CHOICE]: {
    label: '人生选择器',
    description: '推演选择、代价与下一步行动',
  },
  [CHAT_MODES.UNDERSTAND_OTHERS]: {
    label: '读懂好友同事',
    description: '看懂朋友、同事与合作对象',
  },
  [CHAT_MODES.UNDERSTAND_CHILD]: {
    label: '读懂孩子',
    description: '更好地理解孩子的内心与表达',
  },
  [CHAT_MODES.UNDERSTAND_LOVER]: {
    label: '读懂爱人',
    description: '理解伴侣在亲密关系里的模式',
  },
};

/**
 * 获取模式标签
 * @param {string} mode - 模式值
 * @returns {string} 模式标签
 */
export function getModeLabel(mode) {
  return MODE_CONFIG[mode]?.label || '未知模式';
}

/**
 * 获取默认模式
 * @returns {string} 默认模式
 */
export function getDefaultMode() {
  return CHAT_MODES.DISCOVER_SELF;
}

/**
 * 检查模式是否有效
 * @param {string} mode - 模式值
 * @returns {boolean} 是否有效
 */
export function isValidMode(mode) {
  return Object.values(CHAT_MODES).includes(mode);
}

/**
 * 从 URL 参数中获取模式
 * @param {URLSearchParams} searchParams - URL 搜索参数对象
 * @returns {string} 对话模式
 */
export function getModeFromSearchParams(searchParams) {
  const modeParam = searchParams.get('mode');
  return isValidMode(modeParam) ? modeParam : CHAT_MODES.DISCOVER_SELF;
}

/**
 * 从路由/查询参数对象获取模式（兼容小程序 router.params、H5 等）
 * @param {Record<string, string>} params - 如 { mode: 'understand-others' }
 * @returns {string} 对话模式
 */
export function getModeFromParams(params) {
  const mode = params?.mode;
  return isValidMode(mode) ? mode : CHAT_MODES.DISCOVER_SELF;
}
