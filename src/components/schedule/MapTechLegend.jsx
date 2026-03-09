import PropTypes from 'prop-types'

function MiniPin({ color }) {
  return (
    <svg width="12" height="18" viewBox="0 0 24 36" className="flex-shrink-0">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill={color} stroke="white" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="4.5" fill="white"/>
    </svg>
  )
}

MiniPin.propTypes = {
  color: PropTypes.string.isRequired,
}

function GlowingMiniPin({ color, glowColor }) {
  return (
    <div className="relative flex-shrink-0 w-3 h-[18px]">
      <div
        className="absolute top-1/2 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5 rounded-full animate-pulse"
        style={{ background: `radial-gradient(circle, ${glowColor}88 0%, ${glowColor}00 70%)` }}
      />
      <svg width="12" height="18" viewBox="0 0 24 36" className="relative">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill={color} stroke="white" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="4.5" fill="white"/>
      </svg>
    </div>
  )
}

GlowingMiniPin.propTypes = {
  color: PropTypes.string.isRequired,
  glowColor: PropTypes.string.isRequired,
}

export default function MapTechLegend({ members, showUnassigned, showEarlier }) {
  return (
    <div className="absolute bottom-6 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2.5 font-body">
      <div className="flex flex-col gap-1.5">
        {members.map(member => (
          <div key={member.id} className="flex items-center gap-2 text-xs text-gray-700">
            <MiniPin color={member.color} />
            <span className="font-medium">{member.name}</span>
          </div>
        ))}
        {(showUnassigned || showEarlier) && (
          <div className="border-t border-gray-200 pt-1.5 mt-0.5 flex flex-col gap-1.5">
            {showUnassigned && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <GlowingMiniPin color="#EF4444" glowColor="#EF4444" />
                <span className="font-medium">Unassigned</span>
              </div>
            )}
            {showEarlier && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <GlowingMiniPin color="#F59E0B" glowColor="#F59E0B" />
                <span className="font-medium">Earlier Opening</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

MapTechLegend.propTypes = {
  members: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  })).isRequired,
  showUnassigned: PropTypes.bool.isRequired,
  showEarlier: PropTypes.bool.isRequired,
}
