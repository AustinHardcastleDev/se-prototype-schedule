import { format } from 'date-fns'
import PropTypes from 'prop-types'

function MobileTopBar({ onMenuOpen }) {
  const currentDate = new Date()
  const monthYear = format(currentDate, 'MMMM yyyy')

  return (
    <header className="md:hidden bg-charcoal text-text-light px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      {/* Logo on left */}
      <div className="font-heading text-xl text-accent uppercase tracking-wider">
        SE
      </div>

      {/* Current month/year in center */}
      <div className="font-heading text-lg uppercase tracking-wide">
        {monthYear}
      </div>

      {/* Hamburger icon on right */}
      <button
        onClick={onMenuOpen}
        className="w-8 h-8 flex flex-col items-center justify-center gap-1.5"
        aria-label="Open menu"
      >
        <span className="w-6 h-0.5 bg-text-light"></span>
        <span className="w-6 h-0.5 bg-text-light"></span>
        <span className="w-6 h-0.5 bg-text-light"></span>
      </button>
    </header>
  )
}

MobileTopBar.propTypes = {
  onMenuOpen: PropTypes.func.isRequired
}

export default MobileTopBar
