import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage'
import Chat from './pages/Chat'
import Result from './pages/Result'
import ProfilePage from './pages/settings/profile'
import { ToastProvider } from './components/Toast'
import './index.css'

function App() {
  return (
    <ToastProvider>
      <Router basename="/know-yourself/">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/chat-to-know-yourself" element={<Chat />} />
          <Route path="/result" element={<Result />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App
