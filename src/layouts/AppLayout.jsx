import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileTopBar from './MobileTopBar'
import HamburgerDrawer from './HamburgerDrawer'

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Top Bar */}
      <MobileTopBar onMenuOpen={() => setDrawerOpen(true)} />

      {/* Mobile Hamburger Drawer */}
      <HamburgerDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main Content Area - white background */}
      <main className="flex-1 flex flex-col md:ml-64 pt-14 md:pt-0 min-h-0 overflow-hidden bg-white">
        <Outlet />
      </main>
    </div>
  )
}
