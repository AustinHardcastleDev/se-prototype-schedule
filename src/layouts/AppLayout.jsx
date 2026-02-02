import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileTopBar from './MobileTopBar'
import HamburgerDrawer from './HamburgerDrawer'

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Top Bar */}
      <MobileTopBar onMenuOpen={() => setDrawerOpen(true)} />

      {/* Mobile Hamburger Drawer */}
      <HamburgerDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main Content Area */}
      <main className="md:ml-64 pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
