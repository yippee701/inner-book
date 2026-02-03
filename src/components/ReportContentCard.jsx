import XMarkdown from '@ant-design/x-markdown';
import markdownComponents from './reportMarkdown';

/**
 * 报告内容卡片 - 统一展示报告头部、引用区与 Markdown 内容
 * 供 Result 页与分享落地页复用
 */
function ReportContentCard({
  content,
  subTitle,
  modeLabel,
  className = '',
  style = {},
  contentClassName = 'text-dora',
}) {
  return (
    <div
      className={`rounded-3xl p-5 ${className}`.trim()}
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0,0,0,0.02)',
        ...style,
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 text-indigo-500 font-bold text-base">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          INNER BOOK
        </div>
        <div className="bg-purple-100 text-purple-700 text-xs px-3 py-1.5 rounded-full font-semibold">
          {modeLabel}
        </div>
      </div>

      {/* Quote Section */}
      <div className="text-center mb-2 text-dora">
        <svg className="w-8 h-8 text-purple-200 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <h1 className="text-2xl leading-relaxed text-indigo-500 mb-2">
          {subTitle}
        </h1>
        <div
          className="w-10 h-1 mx-auto rounded-full"
          style={{ background: 'linear-gradient(to right, #8B5CF6, #B794F6)' }}
        />
      </div>

      <XMarkdown
        className={contentClassName}
        components={markdownComponents}
        content={content}
      />
    </div>
  );
}

export default ReportContentCard;
