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
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/[0.08] border border-gray-200/60 p-1 gap-0.5">
      {/* Earlier toggle */}
      <button
        onClick={onToggleEarlier}
        title="Earlier Openings"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl font-body text-xs font-semibold transition-all duration-200 ${
          showEarlier
            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/60'
        }`}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        {earlierCount > 0 && (
          <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold leading-none px-1 ${
            showEarlier ? 'bg-amber-500 text-white' : 'bg-gray-200/80 text-gray-500'
          }`}>
            {earlierCount}
          </span>
        )}
        <span className="hidden md:inline">Earlier</span>
      </button>

      <div className="w-px h-4 bg-gray-200/80 flex-shrink-0" />

      {/* Unassigned toggle */}
      <button
        onClick={onToggleUnassigned}
        title="Unassigned Jobs"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl font-body text-xs font-semibold transition-all duration-200 ${
          showUnassigned
            ? 'bg-red-50 text-red-600 ring-1 ring-red-200/80'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/60'
        }`}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
        {unassignedCount > 0 && (
          <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold leading-none px-1 ${
            showUnassigned ? 'bg-red-500 text-white' : 'bg-gray-200/80 text-gray-500'
          }`}>
            {unassignedCount}
          </span>
        )}
        <span className="hidden md:inline">Unassigned</span>
      </button>

      <div className="w-px h-4 bg-gray-200/80 flex-shrink-0" />

      {/* Stop numbers toggle */}
      <button
        onClick={onToggleStopNumbers}
        title="Stop Numbers"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl font-body text-xs font-semibold transition-all duration-200 ${
          showStopNumbers
            ? 'bg-sky-50 text-sky-600 ring-1 ring-sky-200/80'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/60'
        }`}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1C6.13 1 3 4.13 3 8c0 5.25 7 11 7 11s7-5.75 7-11c0-3.87-3.13-7-7-7zm0 2a5 5 0 015 5c0 3.34-3.58 7.35-5 8.77C8.58 15.35 5 11.34 5 8a5 5 0 015-5z" />
          <text x="10" y="10.5" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fontWeight="800" fontFamily="system-ui, sans-serif">#</text>
        </svg>
        <span className="hidden md:inline">Stops</span>
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
