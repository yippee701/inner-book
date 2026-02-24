/**
 * @know-yourself/core - 跨端共享业务逻辑
 *
 * 在使用前，各端需先通过 registerAdapters() 注入平台适配器。
 */

// ===== 适配器注册 =====
export { registerAdapter, registerAdapters, getAdapter } from './adapters/index.js';

// ===== Constants =====
export { CLOUDBASE_ENV, USER_INFO_LOCAL_STORAGE_KEY, CREDENTIALS_LOCAL_STORAGE_KEY } from './constants/global.js';
export { CHAT_MODES, MODE_CONFIG, getModeLabel, getDefaultMode, isValidMode, getModeFromSearchParams, getModeFromParams } from './constants/modes.js';
export { REPORT_STATUS } from './constants/reportStatus.js';
export { DISCOVER_SELF_WELCOME_MESSAGE, UNDERSTAND_OTHERS_WELCOME_MESSAGE, getWelcomeMessage } from './constants/welcome-message.js';
export { CAROUSEL_TEXTS } from './constants/carousel.js';
export { STEPS_POOL_DEFAULT, STEPS_POOL_FIRST_ROUND } from './constants/loadingSteps.js';

// ===== Utils =====
export { generateReportTitle, extractReportSubTitle, cleanReportContent, generateReportId, getModeFromUrl } from './utils/chat.js';
export { getCurrentUsername, getCurrentUserId, isLoggedIn, getCurrentUserToken } from './utils/user.js';
export { request } from './utils/request.js';
export { setAuthRef, getAuthRef } from './utils/authRef.js';
export { setToastRef, getToastRef } from './utils/toastRef.js';
export { setCloudbaseApp, trackVisitEvent, trackClickEvent, trackStayTime, trackConversationRound, trackErrorEvent, trackEvent, initTracking } from './utils/track.js';
export { startChatPrefetch, getChatPrefetchResult, clearChatPrefetch } from './utils/chatPrefetch.js';
export { pickRandomSteps } from './utils/randomSteps.js';
export { markdownToHtml } from './utils/markdown.js';
export { getPendingReports, getPendingReportByMode, PENDING_REPORTS_KEY } from './utils/pendingReportsStorage.js';

// ===== API =====
export { sendMessage, sendMessageWithTypewriter, chatWarmup, typewriterEffect, isMockMode } from './api/chat.js';
export { verifyInviteCode, getReportDetail, saveMessages, getMessages } from './api/report.js';
export { getUserExtraInfo, restartConversation, getReports, updateReportTitle, updateUserNickname, checkCanStartChat } from './api/profile.js';

// ===== Hooks =====
export { useChat } from './hooks/useChat.js';
export { useStayTime } from './hooks/useStayTime.js';
export { useCarouselIndex } from './hooks/useCarouselIndex.js';
export { useLoadingSteps } from './hooks/useLoadingSteps.js';
