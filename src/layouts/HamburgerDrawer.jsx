import { NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import SELogo from '../components/ui/SELogo'

function HamburgerDrawer({ isOpen, onClose }) {
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Logo */}
        <div className="px-6 pb-4">
          <SELogo />
        </div>

        {/* Search bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 px-3 py-2 border border-muted/40 rounded font-body text-sm">
            <span className="uppercase text-xs font-semibold tracking-wide text-text-light">Search</span>
            <svg className="w-3.5 h-3.5 text-muted ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 space-y-1">
          <NavLink
            to="/admin"
            onClick={onClose}
            className={({ isActive }) =>
              `block px-2 py-2 font-body text-sm transition-colors ${
                isActive ? 'text-accent font-semibold' : 'text-text-light hover:text-accent'
              }`
            }
          >
            Admin
          </NavLink>
          <NavLink
            to="/directory"
            onClick={onClose}
            className={({ isActive }) =>
              `block px-2 py-2 font-body text-sm transition-colors ${
                isActive ? 'text-accent font-semibold' : 'text-text-light hover:text-accent'
              }`
            }
          >
            Directory
          </NavLink>
          <NavLink
            to="/route-planner"
            onClick={onClose}
            className={({ isActive }) =>
              `block px-2 py-2 font-body text-sm transition-colors ${
                isActive ? 'text-accent font-semibold' : 'text-text-light hover:text-accent'
              }`
            }
          >
            Route Planner
          </NavLink>
          <NavLink
            to="/"
            end
            onClick={onClose}
            className={({ isActive }) =>
              `block px-2 py-2 font-body text-sm transition-colors ${
                isActive ? 'text-accent font-semibold' : 'text-text-light hover:text-accent'
              }`
            }
          >
            Schedule
          </NavLink>
          <div className="flex items-center justify-between px-2 py-2 font-body text-sm text-text-light hover:text-accent cursor-pointer transition-colors">
            <span>Store</span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </nav>

        {/* User avatar/name at bottom */}
        <div className="mt-auto">
          <div className="mx-4 border-t border-muted/30" />
          <div className="p-4">
            <div className="flex items-center gap-3">
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
    </>
  )
}

HamburgerDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default HamburgerDrawer
