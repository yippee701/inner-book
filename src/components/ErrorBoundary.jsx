import { Component } from 'react'
import { trackErrorEvent } from '../utils/trackError'

/**
 * React Error Boundary：捕获子组件树中的渲染错误，展示降级 UI 并可选上报
 */
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    trackErrorEvent('error_boundary', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, fallbackClassName } = this.props
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            onReload={this.handleReload}
          />
        )
      }
      return (
        <div
          className={
            fallbackClassName ||
            'flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 text-stone-800'
          }
        >
          <p className="mb-2 text-lg font-medium">出错了</p>
          <p className="mb-6 max-w-sm text-center text-sm text-stone-500">
            页面遇到问题，请重新加载后再试
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-lg bg-stone-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700"
          >
            重新加载页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
