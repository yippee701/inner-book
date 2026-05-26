const cloudbase = require('@cloudbase/js-sdk');

const DEFAULT_ENV_ID = 'inner-book-0gdweqyu8ab70e46';
const DEFAULT_REGION = 'ap-shanghai';

let cachedToken = '';
let cachedExpiresAt = 0;
let cachedUserId = '';

function getEnvId() {
  return process.env.CLOUDBASE_ENV_ID || "inner-book-0gdweqyu8ab70e46";
}

function getRegion() {
  return process.env.CLOUDBASE_REGION || "ap-shanghai";
}

function getRemainingSeconds() {
  return Math.max(0, Math.floor((cachedExpiresAt - Date.now()) / 1000));
}

function getTokenExpiresAt(accessToken, fallbackExpiresIn) {
  const expiresIn = Number(fallbackExpiresIn) || 7200;
  try {
    const payloadBase64 = String(accessToken).split('.')[1];
    if (!payloadBase64) return Date.now() + expiresIn * 1000;

    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
    if (payload?.exp) {
      return payload.exp * 1000;
    }
  } catch (error) {
    console.warn('[cloudbase-anonymous-token] parse token exp failed:', error);
  }

  return Date.now() + expiresIn * 1000;
}

async function signInAnonymously() {
  const app = cloudbase.init({
    env: getEnvId(),
    region: getRegion(),
  });
  const auth = app.auth({ persistence: 'none' });
  const result = await auth.signInAnonymously({});
  if (result?.error) {
    throw new Error(result.error.message || 'CloudBase 匿名登录失败');
  }

  const session = result?.data?.session || {};
  const accessToken = session.access_token || (await auth.getAccessToken())?.accessToken;
  if (!accessToken) {
    throw new Error('CloudBase 匿名登录未返回 access_token');
  }

  cachedToken = accessToken;
  cachedExpiresAt = getTokenExpiresAt(accessToken, session.expires_in);
  cachedUserId = result?.data?.user?.id || session?.user?.id || '';

  return {
    access_token: cachedToken,
    expires_in: getRemainingSeconds(),
    token_type: session.token_type || 'Bearer',
    user_id: cachedUserId,
  };
}

exports.main = async (event = {}) => {
  try {
    const forceRefresh = event.force_refresh === true;
    if (!forceRefresh && cachedToken && Date.now() < cachedExpiresAt - 5 * 60 * 1000) {
      return {
        code: 0,
        access_token: cachedToken,
        expires_in: getRemainingSeconds(),
        token_type: 'Bearer',
        user_id: cachedUserId,
        cached: true,
      };
    }

    const token = await signInAnonymously();
    return {
      code: 0,
      ...token,
      cached: false,
    };
  } catch (error) {
    console.error('[cloudbase-anonymous-token] failed:', error);
    return {
      code: -1,
      message: error.message || '获取 CloudBase 匿名 access_token 失败',
    };
  }
};
