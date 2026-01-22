/**
 * Profile API - 用户资料和报告历史相关接口
 */

import { getCurrentUsername } from '../utils/user';

// 是否使用 Mock 数据
const IS_MOCK_MODE = true;

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:80';

// ========== Mock 数据 ==========

/**
 * Mock 裂变进度数据
 */
const MOCK_FISSION_DATA = {
  currentInvites: 0,
  targetInvites: 2,
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
];

// ========== Mock API 实现 ==========

/**
 * Mock: 重新开启对话
 */
async function mockRestartConversation(_conversationId) {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { success: true, newConversationId: `conv_new_${Date.now()}` };
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

export async function getUserExtraInfo(rdb) {
  const username = getCurrentUsername();
  if (!username) {
    return {};
  }
  const { data, error } = await rdb.from("user_info").select('level, remainingReport, currentInvites').eq('username', username);

  if (error) {
    console.error('获取用户信息失败:', error);
    return {};
  }

  return data[0] || {};

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

export async function getReports(rdb) {
  const username = getCurrentUsername();
  if (!username) {
    return [];
  }

  const { data, error } = await rdb.from("report").select('title, createdAt, status, objectId').eq('username', username);
  if (error) {
    console.error('获取对话历史失败:', error);
    return [];
  }

  return data || [];
}
