import PropTypes from 'prop-types'
import { useMobileViewMode } from '../contexts/ViewModeContext'

function MobileTopBar({ onMenuOpen }) {
  const { mobileViewMode, setMobileViewMode } = useMobileViewMode()

  const isCalendar = mobileViewMode === 'calendar'

  return (
    <header className="md:hidden bg-charcoal text-text-light px-3 py-2.5 flex items-center fixed top-0 left-0 right-0 z-50">
      {/* Logo — left anchor */}
      <div className="font-body text-xl text-accent uppercase tracking-wider font-bold flex-shrink-0">
        SE
      </div>

      {/* Segmented toggle — icon only */}
      <div className="flex-1 flex justify-center px-3">
        <div className="relative flex bg-white/[0.06] rounded-xl p-[3px] border border-white/[0.04]">
          {/* Sliding pill */}
          <div
            className="absolute top-[3px] bottom-[3px] rounded-[10px] bg-accent transition-all duration-300"
            style={{
              left: isCalendar ? '3px' : 'calc(50% + 0.5px)',
              width: 'calc(50% - 3.5px)',
              transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          />

          <button
            onClick={() => setMobileViewMode('calendar')}
            className={`relative z-10 flex items-center justify-center gap-1.5 px-4 py-[7px] rounded-[10px] transition-colors duration-200 ${
              isCalendar ? 'text-white' : 'text-white/30'
            }`}
            aria-label="Schedule view"
          >
            <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-body text-[11px] font-semibold">Cal</span>
          </button>

          <button
            onClick={() => setMobileViewMode('map')}
            className={`relative z-10 flex items-center justify-center gap-1.5 px-4 py-[7px] rounded-[10px] transition-colors duration-200 ${
              !isCalendar ? 'text-white' : 'text-white/30'
            }`}
            aria-label="Map view"
          >
            <svg className="w-[16px] h-[16px]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="font-body text-[11px] font-semibold">Map</span>
          </button>
        </div>
      </div>

      {/* Hamburger — right anchor */}
      <button
        onClick={onMenuOpen}
        className="w-7 h-7 flex flex-col items-center justify-center gap-[5px] flex-shrink-0"
        aria-label="Open menu"
      >
        <span className="w-[18px] h-[1.5px] bg-white/70 rounded-full"></span>
        <span className="w-[18px] h-[1.5px] bg-white/70 rounded-full"></span>
        <span className="w-[18px] h-[1.5px] bg-white/70 rounded-full"></span>
      </button>
    </header>
  )
}

MobileTopBar.propTypes = {
  onMenuOpen: PropTypes.func.isRequired
}

export default MobileTopBar
