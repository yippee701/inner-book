import { useEffect } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
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

function App() {
  return (
    <CloudbaseProvider>
      <VisitAppTracker>
        <ToastProvider>
          <ReportProvider>
            <Router>
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
