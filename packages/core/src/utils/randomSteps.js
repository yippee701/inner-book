/**
 * 从文案池中随机选取 n 条（用于加载步骤展示）
 * @param {string[]} pool
 * @param {number} n
 * @returns {string[]}
 */
export function pickRandomSteps(pool, n = 3) {
  if (!Array.isArray(pool) || pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, pool.length));
}
