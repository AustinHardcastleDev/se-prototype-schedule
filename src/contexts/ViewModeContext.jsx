import { createContext, useContext, useState } from 'react'

const ViewModeContext = createContext()

export function ViewModeProvider({ children }) {
  const [mobileViewMode, setMobileViewMode] = useState('calendar')
  return (
    <ViewModeContext.Provider value={{ mobileViewMode, setMobileViewMode }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useMobileViewMode() {
  const ctx = useContext(ViewModeContext)
  if (!ctx) throw new Error('useMobileViewMode must be used within ViewModeProvider')
  return ctx
}
