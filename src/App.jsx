import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage'
import Chat from './pages/Chat'
import Result from './pages/Result'
import './index.css'

function App() {
  return (
    <Router basename="/know-yourself/">
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </Router>
  )
}

export default App
