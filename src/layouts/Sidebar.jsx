import { NavLink } from 'react-router-dom'
import { getAllMembers } from '../utils/dataAccess'
import SELogo from '../components/ui/SELogo'

export default function Sidebar() {
  const currentUser = getAllMembers()[0]

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-charcoal text-text-light fixed left-0 top-0 h-screen">
      {/* Logo at top */}
      <div className="px-4 pt-5 pb-4">
        <SELogo />
      </div>

      {/* Create New button */}
      <div className="px-4 pb-3">
        <button className="w-full flex items-center justify-between px-4 py-3 rounded-full font-body text-text-light hover:brightness-110 transition-all" style={{ backgroundColor: '#444' }}>
          <span className="uppercase text-xs font-semibold tracking-wide">Create New</span>
          <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Search bar - immediately below create */}
      <div className="px-4 pb-5">
        <button className="w-full flex items-center gap-2 px-4 py-3 rounded-full font-body text-text-light hover:brightness-110 transition-all" style={{ backgroundColor: '#444' }}>
          <span className="uppercase text-xs font-semibold tracking-wide">Search Store</span>
          <svg className="w-3.5 h-3.5 text-muted ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Separator line */}
      <div className="px-4 pb-4">
        <div className="border-t border-white/30" />
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 space-y-1">
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `block px-2 py-2.5 font-body text-base transition-colors ${
              isActive
                ? 'text-accent font-semibold'
                : 'text-text-light hover:text-accent'
            }`
          }
        >
          Admin
        </NavLink>
        <NavLink
          to="/directory"
          className={({ isActive }) =>
            `block px-2 py-2.5 font-body text-base transition-colors ${
              isActive
                ? 'text-accent font-semibold'
                : 'text-text-light hover:text-accent'
            }`
          }
        >
          Directory
        </NavLink>
        <NavLink
          to="/route-planner"
          className={({ isActive }) =>
            `block px-2 py-2.5 font-body text-base transition-colors ${
              isActive
                ? 'text-accent font-semibold'
                : 'text-text-light hover:text-accent'
            }`
          }
        >
          Route Planner
        </NavLink>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `block px-2 py-2.5 font-body text-base transition-colors ${
              isActive
                ? 'text-accent font-semibold'
                : 'text-text-light hover:text-accent'
            }`
          }
        >
          Schedule
        </NavLink>
        <div className="flex items-center justify-between px-2 py-2.5 font-body text-base text-text-light hover:text-accent cursor-pointer transition-colors">
          <span>Store</span>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </nav>

      {/* User avatar/name at bottom with separator */}
      <div className="mt-auto">
        <div className="mx-4 border-t border-muted/30" />
        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Gray avatar circle matching legacy style */}
            <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-body text-sm font-semibold leading-tight">Austin</div>
              <div className="font-body text-sm font-semibold leading-tight">Hardcastle</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
