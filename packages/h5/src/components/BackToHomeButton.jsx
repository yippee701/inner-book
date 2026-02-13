import { Link } from 'react-router-dom';

/**
 * 右上角「返回首页」按钮，样式与 profile 页一致
 * @param {object} props
 * @param {string} [props.className] - 额外 class
 * @param {string} [props.title] - title 提示文案
 */
export function BackToHomeButton({ className = '', title = '返回首页' }) {
  return (
    <Link
      to="/"
      className={`p-2 rounded-full transition-colors hover:bg-white/50 ${className}`.trim()}
      title={title}
    >
      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </Link>
  );
}

export default BackToHomeButton;
