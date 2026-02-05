import { useRef, useCallback, useEffect } from 'react';
import { trackStayTime } from '../utils/track';

/**
 * 通用停留时长统计 Hook
 * - 可用于页面停留（auto: true，挂载开始、卸载上报）
 * - 可用于任意操作时长（手动 start/end）
 *
 * 关闭浏览器/标签页时：会监听 beforeunload/pagehide 尝试上报。因上报为异步请求，
 * 页面被销毁后请求可能未完成，不保证 100% 送达；正常离开页面（路由跳转）会走卸载，可可靠上报。
 *
 * @param {string} key - 上报事件 key，如 'chat_duration'、'share_report_image'
 * @param {object} options
 * @param {boolean} options.auto - 是否自动统计：true 时从挂载开始计时，卸载时上报
 * @param {object} options.data - 上报时携带的额外字段（如 mode、reportId）
 * @returns {{ start: () => void, end: () => void }} start 开始计时，end 结束并上报
 */
export function useStayTime(key, options = {}) {
  const { auto = false, data = {} } = options;
  const startTimeRef = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const end = useCallback(() => {
    if (startTimeRef.current == null) return;
    const durationMs = Date.now() - startTimeRef.current;
    const durationSeconds = Math.round(durationMs / 1000);
    trackStayTime(key, durationSeconds, { ...dataRef.current });
    startTimeRef.current = null;
  }, [key]);

  // 自动模式：挂载开始计时，卸载或关闭页面时上报
  useEffect(() => {
    if (!auto) return;
    start();

    // 用户关闭标签页/浏览器/刷新时，React 卸载可能不执行，通过页面卸载事件补报
    const handlePageUnload = () => {
      end();
    };
    window.addEventListener('beforeunload', handlePageUnload);
    window.addEventListener('pagehide', handlePageUnload);

    return () => {
      window.removeEventListener('beforeunload', handlePageUnload);
      window.removeEventListener('pagehide', handlePageUnload);
      end();
    };
  }, [auto, start, end]);

  return { start, end };
}
