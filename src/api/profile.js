/**
 * Profile API - 用户资料和对话历史相关接口
 */

// 是否使用 Mock 数据
const IS_MOCK_MODE = true; // import.meta.env.VITE_MOCK_MODE === 'true' || !import.meta.env.VITE_API_KEY;

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:80';

// ========== Mock 数据 ==========

/**
 * Mock 用户数据
 */
const MOCK_USER_DATA = {
  id: 'user_001',
  nickname: 'Alex_Reader',
  avatar: null, // null 表示使用默认头像
  level: '正式会员',
  remainingChats: 12,
};

/**
 * Mock 裂变进度数据
 */
const MOCK_FISSION_DATA = {
  currentInvites: 3,
  targetInvites: 4,
  rewardName: '职业规划对话',
};

/**
 * Mock 对话历史数据
 */
const MOCK_CONVERSATIONS = [
  {
    id: 'conv_001',
    title: '探索我的职业价值观',
    createdAt: '2025-05-18 10:15',
    status: 'generating', // generating | completed | expired
    storageType: null, // permanent | countdown | validUntil | null
    storageInfo: null,
  },
  {
    id: 'conv_002',
    title: '关于职场冲突的深度拆解',
    createdAt: '2025-05-15 14:32',
    status: 'completed',
    storageType: 'permanent',
    storageInfo: null,
  },
  {
    id: 'conv_003',
    title: '如何建立自信与边界感',
    createdAt: '2025-05-12 16:48',
    status: 'completed',
    storageType: 'countdown',
    storageInfo: {
      totalHours: 72,
      remainingHours: 24,
    },
  },
  {
    id: 'conv_004',
    title: '应对亲密关系中的矛盾',
    createdAt: '2025-05-10 09:45',
    status: 'completed',
    storageType: 'validUntil',
    storageInfo: {
      validUntil: '2026.05.10',
    },
  },
  {
    id: 'conv_005',
    title: '关于人际关系的困惑',
    createdAt: '2025-05-01 18:22',
    status: 'expired',
    storageType: null,
    storageInfo: null,
  },
];

// ========== Mock API 实现 ==========

/**
 * Mock: 获取用户信息
 */
async function mockGetUserProfile() {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { ...MOCK_USER_DATA };
}

/**
 * Mock: 获取对话历史列表
 */
async function mockGetConversations() {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...MOCK_CONVERSATIONS];
}

/**
 * Mock: 获取裂变进度
 */
async function mockGetFissionProgress() {
  await new Promise(resolve => setTimeout(resolve, 200));
  return { ...MOCK_FISSION_DATA };
}

/**
 * Mock: 重新开启对话
 */
async function mockRestartConversation(conversationId) {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { success: true, newConversationId: `conv_new_${Date.now()}` };
}

// ========== 真实 API 实现 ==========

/**
 * 真实 API: 获取用户信息
 */
async function fetchUserProfile() {
  const response = await fetch(`${API_BASE_URL}/api/profile`);
  if (!response.ok) throw new Error('获取用户信息失败');
  return response.json();
}

/**
 * 真实 API: 获取对话历史列表
 */
async function fetchConversations() {
  const response = await fetch(`${API_BASE_URL}/api/conversations`);
  if (!response.ok) throw new Error('获取对话历史失败');
  return response.json();
}

/**
 * 真实 API: 获取裂变进度
 */
async function fetchFissionProgress() {
  const response = await fetch(`${API_BASE_URL}/api/fission`);
  if (!response.ok) throw new Error('获取裂变进度失败');
  return response.json();
}

/**
 * 真实 API: 重新开启对话
 */
async function fetchRestartConversation(conversationId) {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/restart`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('重新开启对话失败');
  return response.json();
}

// ========== 导出的 API 函数 ==========

/**
 * 获取用户信息
 */
export async function getUserProfile() {
  if (IS_MOCK_MODE) {
    return mockGetUserProfile();
  }
  return fetchUserProfile();
}

/**
 * 获取对话历史列表
 */
export async function getConversations() {
  if (IS_MOCK_MODE) {
    return mockGetConversations();
  }
  return fetchConversations();
}

/**
 * 获取裂变进度
 */
export async function getFissionProgress() {
  if (IS_MOCK_MODE) {
    return mockGetFissionProgress();
  }
  return fetchFissionProgress();
}

/**
 * 重新开启对话
 */
export async function restartConversation(conversationId) {
  if (IS_MOCK_MODE) {
    return mockRestartConversation(conversationId);
  }
  return fetchRestartConversation(conversationId);
}

/**
 * 获取 Profile 页面所有数据（聚合接口）
 */
export async function getProfilePageData() {
  const [user, conversations, fission] = await Promise.all([
    getUserProfile(),
    getConversations(),
    getFissionProgress(),
  ]);
  
  return { user, conversations, fission };
}

