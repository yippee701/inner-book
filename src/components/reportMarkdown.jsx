/**
 * 自定义 Markdown 组件 - 用于结构化展示报告
 * 注意：XMarkdown 的 components prop 接收 domNode 和 streamStatus，需要用 children 获取子元素
 */
const markdownComponents = {
  // 一级标题 - 主标题（通常是报告标题）
  h1: (
    { children }) => (
    <div className="text-center mb-2">
      <h1>
        {children}
      </h1>
    </div>
  ),

  // 二级标题 - 章节标题
  h2: ({ children }) => (
    <div className="mb-5 mt-10 first:mt-0">
      <h2 
        className="text-xl"
          style={{ 
          fontWeight: 700,
          color: '#1F2937',
        }}
      >
        {children}
      </h2>
    </div>
  ),

  // 三级标题 - 副标题
  h3: ({ children }) => (
    <p 
      className="text-base mb-4 -mt-3"
      style={{ color: '#666666' }}
        >
      {children}
        </p>
  ),

  // 四级标题 - 子章节
  h4: ({ children }) => (
    <p 
      className="text-sm mb-3 mt-6 pl-1"
      style={{ color: '#666666' }}
    >
      {children}
    </p>
  ),

  // 引用块 - 核心洞察框
  blockquote: ({ children }) => (
        <div 
      className="rounded-2xl p-5 mb-4"
      style={{
        background: 'linear-gradient(135deg, rgba(107, 107, 255, 0.08), rgba(139, 92, 246, 0.08))',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        backdropFilter: 'blur(10px)',
      }}
        >
      <div 
        className="text-base leading-relaxed"
        style={{ 
          color: '#1F2937',
          fontWeight: 500,
        }}
      >
        {children}
      </div>
    </div>
  ),

  // 段落
  p: ({ children }) => (
    <p 
      className="text-base leading-[1.7] mb-3"
      style={{ color: '#1F2937' }}
    >
      {children}
    </p>
  ),

  // 无序列表
  ul: ({ children }) => (
    <div className="mt-2 mb-4">
      {children}
    </div>
  ),

  // 列表项 - insight-box 包裹 + 发光圆点
  li: ({ children }) => (
    <div 
      className="rounded-2xl p-4 mb-4 last:mb-0"
      style={{
        background: 'linear-gradient(135deg, rgba(107, 107, 255, 0.08), rgba(139, 92, 246, 0.08))',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex gap-3 items-start">
        {/* 发光圆点 */}
        <div 
          className="flex-shrink-0 mt-1 w-4 h-4 rounded-full relative"
          style={{
            background: 'linear-gradient(135deg, #6B6BFF, #8B5CF6)',
            boxShadow: '0 0 8px rgba(107, 107, 255, 0.5)',
          }}
        >
          <div 
            className="absolute top-[3px] left-[3px] w-1 h-1 rounded-full"
              style={{ 
              background: 'rgba(255,255,255,0.8)',
              filter: 'blur(1px)',
              }}
          />
        </div>
        {/* 文字 */}
        <div 
          className="flex-1 text-base leading-[1.7]"
          style={{ color: '#1F2937' }}
            >
          {children}
        </div>
      </div>
    </div>
  ),

  // 有序列表
  ol: ({ children }) => (
    <div className="mt-2 mb-4">
      {children}
    </div>
  ),

  // 加粗文字
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: '#1F2937' }}>
      {children}
    </strong>
  ),

  // 斜体
  em: ({ children }) => (
    <em style={{ color: '#8B5CF6' }}>{children}</em>
  ),

  // 分割线
  hr: () => (
    <div 
      className="my-8 h-px"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
      }}
    />
  ),
};

export default markdownComponents;
