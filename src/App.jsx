import { useEffect } from 'react'
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { isLoggedIn } from './utils/user'
import Homepage from './pages/Homepage'
import Chat from './pages/chat/Chat'
import ChatHistory from './pages/chat/ChatHistory'
import ProfilePage from './pages/settings/profile/profile'
import LoginPage from './pages/settings/user/login'
import RegisterPage from './pages/settings/user/register'
import ReportLoading from './pages/report/ReportLoading'
import ReportResult from './pages/report/Result'
import ShareLanding from './pages/share/shareLanding'
import { ToastProvider } from './components/Toast'
import { ReportProvider } from './contexts/ReportContext'
import { CloudbaseProvider } from './contexts/cloudbaseContext'
import { trackVisitEvent } from './utils/track'
import './index.css'

/** 进入应用时上报一次全局访问 */
function VisitAppTracker({ children }) {
  useEffect(() => {
    trackVisitEvent('visit_app')
  }, [])
  return children
}

const LOCAL_REPORTS_KEY = 'pendingReports'

/** 未登录时若本地有未解锁报告，则跳转到该报告页 */
function RedirectToUnlockedReport() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isLoggedIn()) return
    // 仅在首页或 chat 页才跳转到未解锁报告页
    const path = location.pathname || '/'
    if (path !== '/' && path !== '/chat') return
    try {
      const raw = localStorage.getItem(LOCAL_REPORTS_KEY)
      if (!raw) return
      const list = JSON.parse(raw)
      const locked = list.find(
        (r) => r.status === 'completed' && (r.lock === 1 || r.lock === true)
      )
      if (!locked?.reportId) return
      const mode = locked.mode || 'discover-self'
      navigate(`/report-result?reportId=${locked.reportId}&mode=${mode}`, { replace: true })
    } catch {
      // ignore
    }
  }, [navigate, location.pathname])

  return null
}

function App() {
  return (
    <CloudbaseProvider>
      <VisitAppTracker>
        <ToastProvider>
          <ReportProvider>
            <Router>
              <RedirectToUnlockedReport />
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat-history" element={<ChatHistory />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/report-loading" element={<ReportLoading />} />
                <Route path="/report-result" element={<ReportResult />} />
                <Route path="/share" element={<ShareLanding />} />
              </Routes>
            </Router>
          </ReportProvider>
        </ToastProvider>
      </VisitAppTracker>
    </CloudbaseProvider>
  )
}

export default App
