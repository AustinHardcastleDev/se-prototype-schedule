import { NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import { getAllMembers } from '../utils/dataAccess'

function HamburgerDrawer({ isOpen, onClose }) {
  // Get current user (first team member) for display
  const currentUser = getAllMembers()[0]

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        ></div>
      )}

      {/* Slide-out drawer */}
      <aside
        className={`md:hidden fixed right-0 top-0 h-screen w-64 bg-charcoal text-text-light z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        {/* Close button */}
        <div className="p-4 flex justify-end">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-text-light hover:text-accent transition-colors"
            aria-label="Close menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Logo */}
        <div className="px-6 pb-6 border-b border-secondary">
          <div className="font-heading text-2xl text-accent uppercase tracking-wider">
            SE Schedule
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/"
            onClick={onClose}
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
            onClick={onClose}
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
            onClick={onClose}
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

        {/* Search bar */}
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
    </>
  )
}

HamburgerDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default HamburgerDrawer
