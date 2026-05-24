import { useRef, useCallback, useEffect } from 'react';
import { trackStayTime } from '../utils/track.js';
import { getAdapter } from '../adapters/index.js';

/**
 * 通用停留时长统计 Hook
 * - 可用于页面停留（auto: true，挂载开始、卸载上报）
 * - 可用于任意操作时长（手动 start/end）
 *
 * @param {string} key - 上报事件 key
 * @param {object} options
 * @param {boolean} options.auto - 是否自动统计
 * @param {object} options.data - 上报时携带的额外字段
 * @returns {{ start: () => void, end: () => void }}
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

  useEffect(() => {
    if (!auto) return;
    start();

    const platform = getAdapter('platform');
    const handlePageUnload = () => {
      end();
    };

    platform?.addEventListener('beforeunload', handlePageUnload);
    platform?.addEventListener('pagehide', handlePageUnload);

    return () => {
      platform?.removeEventListener('beforeunload', handlePageUnload);
      platform?.removeEventListener('pagehide', handlePageUnload);
      end();
    };
  }, [auto, start, end]);

  return { start, end };
}
