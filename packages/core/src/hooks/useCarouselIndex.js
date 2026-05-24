import { useState, useEffect } from 'react';

/**
 * 轮播当前下标（如首页文案轮播）
 * @param {number} length - 项数量
 * @param {number} intervalMs - 切换间隔（毫秒）
 * @returns {number} currentIndex
 */
export function useCarouselIndex(length, intervalMs = 4000) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (length <= 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [length, intervalMs]);

  return currentIndex;
}
