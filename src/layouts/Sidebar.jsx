import { NavLink } from 'react-router-dom'
import { getAllMembers } from '../utils/dataAccess'

export default function Sidebar() {
  // Get current user (first team member) for display
  const currentUser = getAllMembers()[0]

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-charcoal text-text-light fixed left-0 top-0 h-screen">
      {/* Logo placeholder at top */}
      <div className="p-6 border-b border-secondary">
        <div className="font-heading text-2xl text-accent uppercase tracking-wider">
          SE Schedule
        </div>
      </div>

      {/* Navigation links in middle */}
      <nav className="flex-1 p-4 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg font-body transition-colors ${
              isActive
                ? 'bg-accent text-white'
                : 'text-text-light hover:bg-secondary'
            }`
          }
        >
          Schedule
        </NavLink>
        <NavLink
          to="/team"
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg font-body transition-colors ${
              isActive
                ? 'bg-accent text-white'
                : 'text-text-light hover:bg-secondary'
            }`
          }
        >
          Team
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `block px-4 py-3 rounded-lg font-body transition-colors ${
              isActive
                ? 'bg-accent text-white'
                : 'text-text-light hover:bg-secondary'
            }`
          }
        >
          Reports
        </NavLink>
      </nav>

      {/* Search bar with dark fill and rounded shape */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-4 py-2 bg-secondary text-text-light rounded-full font-body placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* User avatar/name at bottom */}
      <div className="p-4 border-t border-secondary">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-body font-semibold text-sm"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.avatar}
          </div>
          <div className="flex-1">
            <div className="font-body text-sm font-semibold">{currentUser.name}</div>
            <div className="font-body text-xs text-muted capitalize">{currentUser.role}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
