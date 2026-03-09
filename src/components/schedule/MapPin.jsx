import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import PropTypes from 'prop-types'

function createTeardropIcon(color, glowType = null, stopNumber = null) {
  const centerContent = stopNumber != null
    ? `<circle cx="12" cy="12" r="6.5" fill="white"/><text x="12" y="12.5" text-anchor="middle" dominant-baseline="central" fill="${color}" font-size="9" font-weight="800" font-family="system-ui, sans-serif">${stopNumber}</text>`
    : '<circle cx="12" cy="12" r="4.5" fill="white"/>'

  const svg = `
    <svg width="30" height="45" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      ${centerContent}
    </svg>
  `

  let glowHtml = ''
  if (glowType) {
    const glowClass = glowType === 'earlier' ? 'map-pin-glow-amber' : 'map-pin-glow-red'
    glowHtml = `<div class="map-pin-glow ${glowClass}"></div>`
  }

  return L.divIcon({
    html: `<div class="map-pin-wrapper">${glowHtml}<div class="map-pin-teardrop">${svg}</div></div>`,
    className: 'leaflet-map-pin',
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    tooltipAnchor: [0, -45],
  })
}

export default function MapPin({ event, color = '#1A1A1A', glowType = null, stopNumber, onClick }) {
  const icon = createTeardropIcon(color, glowType, stopNumber)

  return (
    <Marker
      position={[event.lat, event.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(event),
      }}
    >
      <Tooltip direction="top" offset={[0, 0]}>
        <div className="font-body text-xs">
          <div className="font-semibold">{event.title}</div>
          <div className="text-gray-500">{event.startTime} - {event.endTime}</div>
        </div>
      </Tooltip>
    </Marker>
  )
}

MapPin.propTypes = {
  event: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
  }).isRequired,
  color: PropTypes.string,
  glowType: PropTypes.oneOf(['earlier', 'unassigned', null]),
  stopNumber: PropTypes.number,
  onClick: PropTypes.func,
}
