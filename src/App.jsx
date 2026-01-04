import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Page1 from './pages/Page1'
import Page2 from './pages/Page2'
import Page3 from './pages/Page3'
import './index.css'

function App() {
  return (
    <Router basename={import.meta.env.DEV ? '/' : '/know-yourself/'}>
      <Routes>
        <Route path="/" element={<Page1 />} />
        <Route path="/page1" element={<Page1 />} />
        <Route path="/page2" element={<Page2 />} />
        <Route path="/page3" element={<Page3 />} />
      </Routes>
    </Router>
  )
}

export default App
