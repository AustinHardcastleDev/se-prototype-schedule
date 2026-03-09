import PropTypes from 'prop-types'

export default function MapOverlayControls({
  showEarlier,
  onToggleEarlier,
  earlierCount,
  showUnassigned,
  onToggleUnassigned,
  unassignedCount,
  showStopNumbers,
  onToggleStopNumbers,
}) {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {/* Earlier toggle */}
      <button
        onClick={onToggleEarlier}
        className={`flex items-center gap-2 px-3 py-2 rounded-full font-body text-xs font-semibold backdrop-blur-sm transition-all duration-200 ${
          showEarlier
            ? 'bg-charcoal/90 text-white ring-1 ring-amber-400/50'
            : 'bg-charcoal/60 text-white/50 hover:bg-charcoal/80 hover:text-white/70'
        }`}
      >
        <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Earlier
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
          showEarlier ? 'bg-amber-400 text-charcoal' : 'bg-white/20 text-white/60'
        }`}>
          {earlierCount}
        </span>
      </button>

      {/* Unassigned toggle */}
      <button
        onClick={onToggleUnassigned}
        className={`flex items-center gap-2 px-3 py-2 rounded-full font-body text-xs font-semibold backdrop-blur-sm transition-all duration-200 ${
          showUnassigned
            ? 'bg-charcoal/90 text-white ring-1 ring-red-400/50'
            : 'bg-charcoal/60 text-white/50 hover:bg-charcoal/80 hover:text-white/70'
        }`}
      >
        <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
        Unassigned
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
          showUnassigned ? 'bg-red-500 text-white' : 'bg-white/20 text-white/60'
        }`}>
          {unassignedCount}
        </span>
      </button>

      {/* Stop numbers toggle */}
      <button
        onClick={onToggleStopNumbers}
        className={`flex items-center gap-2 px-3 py-2 rounded-full font-body text-xs font-semibold backdrop-blur-sm transition-all duration-200 ${
          showStopNumbers
            ? 'bg-charcoal/90 text-white ring-1 ring-sky-400/50'
            : 'bg-charcoal/60 text-white/50 hover:bg-charcoal/80 hover:text-white/70'
        }`}
      >
        <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h2v12H5M10 4h3a2 2 0 010 4h-3m0 0h3a2 2 0 010 4h-3m0-8v8" />
        </svg>
        Stop #
      </button>
    </div>
  )
}

MapOverlayControls.propTypes = {
  showEarlier: PropTypes.bool.isRequired,
  onToggleEarlier: PropTypes.func.isRequired,
  earlierCount: PropTypes.number.isRequired,
  showUnassigned: PropTypes.bool.isRequired,
  onToggleUnassigned: PropTypes.func.isRequired,
  unassignedCount: PropTypes.number.isRequired,
  showStopNumbers: PropTypes.bool.isRequired,
  onToggleStopNumbers: PropTypes.func.isRequired,
}
