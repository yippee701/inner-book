import { useState, useEffect } from 'react';
import { pickRandomSteps } from '../utils/randomSteps.js';
import { STEPS_POOL_DEFAULT, STEPS_POOL_FIRST_ROUND } from '../constants/loadingSteps.js';

const STEP_INTERVAL_MS = 3000;

/**
 * 加载步骤文案与当前步骤下标（用于对话加载中展示）
 * @param {boolean} isFirstRound - 是否首轮
 * @param {number} count - 取几条
 * @returns {{ steps: string[], stepIndex: number }}
 */
export function useLoadingSteps(isFirstRound, count = 3) {
  const pool = isFirstRound ? STEPS_POOL_FIRST_ROUND : STEPS_POOL_DEFAULT;
  const [steps] = useState(() => pickRandomSteps(pool, count));
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (stepIndex >= steps.length - 1) return;
    const t = setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }, STEP_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [stepIndex, steps.length]);

  return { steps, stepIndex };
}
