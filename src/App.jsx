import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import SchedulePage from './pages/SchedulePage'
import { ViewModeProvider } from './contexts/ViewModeContext'

function App() {
  return (
    <BrowserRouter>
      <ViewModeProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<SchedulePage />} />
            <Route path="team" element={<div className="p-8 font-body text-text-light">Team Page (placeholder)</div>} />
            <Route path="reports" element={<div className="p-8 font-body text-text-light">Reports Page (placeholder)</div>} />
          </Route>
        </Routes>
      </ViewModeProvider>
    </BrowserRouter>
  )
}

export default App
