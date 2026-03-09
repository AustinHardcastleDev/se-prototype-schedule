import { useState, useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { format } from 'date-fns'
import PropTypes from 'prop-types'
import { getAllMembers, getMemberById } from '../../utils/dataAccess'
import MapPin from './MapPin'
import MapOverlayControls from './MapOverlayControls'
import MapTechLegend from './MapTechLegend'
import MapSidebar from './MapSidebar'

const DENVER_CENTER = [39.74, -104.99]
const DEFAULT_ZOOM = 12

export default function DesktopMapView({ selectedDate, events, onEventUpdate }) {
  const [showUnassigned, setShowUnassigned] = useState(true)
  const [showEarlier, setShowEarlier] = useState(true)
  const [selectedPinEvent, setSelectedPinEvent] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const allMembers = getAllMembers()
  const techMembers = allMembers.filter(m => m.role === 'tech' || m.role === 'sales')
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const { assignedGeoEvents, unassignedGeoEvents, earlierGeoEvents } = useMemo(() => {
    const geoDateEvents = events.filter(e => e.date === dateStr && e.lat != null)
    return {
      assignedGeoEvents: geoDateEvents.filter(e => e.assigneeId != null),
      unassignedGeoEvents: geoDateEvents.filter(e => e.assigneeId === null),
      // Earlier openings: any future event with earlierOpening flag (could be moved to today)
      earlierGeoEvents: events.filter(e => e.earlierOpening === true && e.lat != null && e.date > dateStr),
    }
  }, [events, dateStr])

  const handlePinClick = (event) => {
    setSelectedPinEvent(event)
    setIsSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
    setSelectedPinEvent(null)
  }

  const handleAssign = (event, techId, startTime, endTime) => {
    const updatedEvent = {
      ...event,
      assigneeId: techId,
      ...(startTime ? { startTime } : {}),
      ...(endTime ? { endTime } : {}),
      // Earlier openings: move to selected date and clear the flag
      ...(event.earlierOpening ? { earlierOpening: false, date: dateStr } : {}),
    }
    onEventUpdate(updatedEvent)
    // Update local state so sidebar reflects the new assignee
    setSelectedPinEvent(updatedEvent)
  }

  return (
    <div className="relative flex-1 min-h-0">
      <MapContainer
        center={DENVER_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ position: 'absolute', inset: 0 }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Assigned job pins - colored by tech */}
        {assignedGeoEvents.map(event => {
          const member = getMemberById(event.assigneeId)
          return (
            <MapPin
              key={event.id}
              event={event}
              color={member?.color || '#1A1A1A'}
              onClick={handlePinClick}
            />
          )
        })}

        {/* Unassigned job pins - red with glow */}
        {showUnassigned && unassignedGeoEvents.map(event => (
          <MapPin
            key={event.id}
            event={event}
            color="#EF4444"
            glowType="unassigned"
            onClick={handlePinClick}
          />
        ))}

        {/* Earlier opening pins - amber with glow */}
        {showEarlier && earlierGeoEvents.map(event => (
          <MapPin
            key={event.id}
            event={event}
            color="#F59E0B"
            glowType="earlier"
            onClick={handlePinClick}
          />
        ))}
      </MapContainer>

      {/* Overlay controls */}
      <MapOverlayControls
        showEarlier={showEarlier}
        onToggleEarlier={() => setShowEarlier(prev => !prev)}
        earlierCount={earlierGeoEvents.length}
        showUnassigned={showUnassigned}
        onToggleUnassigned={() => setShowUnassigned(prev => !prev)}
        unassignedCount={unassignedGeoEvents.length}
      />

      {/* Tech legend */}
      <MapTechLegend
        members={techMembers}
        showUnassigned={showUnassigned}
        showEarlier={showEarlier}
      />

      {/* Assignment sidebar */}
      <MapSidebar
        event={selectedPinEvent}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onAssign={handleAssign}
        onEventUpdate={onEventUpdate}
        events={events}
        selectedDate={selectedDate}
      />
    </div>
  )
}

DesktopMapView.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  events: PropTypes.array.isRequired,
  onEventUpdate: PropTypes.func.isRequired,
}
