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

export default function DesktopMapView({ selectedDate, events, onEventUpdate, roleFilter = 'all' }) {
  const [showUnassigned, setShowUnassigned] = useState(true)
  const [showEarlier, setShowEarlier] = useState(true)
  const [showStopNumbers, setShowStopNumbers] = useState(true)
  const [selectedPinEvent, setSelectedPinEvent] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const allMembers = getAllMembers()
  const techMembers = allMembers.filter(m => m.role === 'tech' || m.role === 'sales')
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const { assignedGeoEvents, unassignedGeoEvents, earlierGeoEvents } = useMemo(() => {
    const geoDateEvents = events.filter(e => e.date === dateStr && e.lat != null)
    return {
      assignedGeoEvents: geoDateEvents.filter(e => e.assigneeId != null),
      unassignedGeoEvents: events.filter(e => e.assigneeId === null && e.lat != null),
      earlierGeoEvents: events.filter(e => e.earlierOpening === true && e.lat != null && e.date > dateStr),
    }
  }, [events, dateStr])

  // Filter assigned events by role
  const filteredAssignedGeoEvents = useMemo(() => {
    if (roleFilter === 'all') return assignedGeoEvents
    return assignedGeoEvents.filter(e => {
      const member = getMemberById(e.assigneeId)
      return member?.role === roleFilter
    })
  }, [assignedGeoEvents, roleFilter])

  // Compute per-tech stop ordering: group assigned events by tech, sort by startTime
  const stopNumberMap = useMemo(() => {
    const map = new Map()
    const byTech = new Map()
    for (const event of filteredAssignedGeoEvents) {
      if (!byTech.has(event.assigneeId)) byTech.set(event.assigneeId, [])
      byTech.get(event.assigneeId).push(event)
    }
    for (const techEvents of byTech.values()) {
      techEvents.sort((a, b) => a.startTime.localeCompare(b.startTime))
      techEvents.forEach((event, i) => map.set(event.id, i + 1))
    }
    return map
  }, [filteredAssignedGeoEvents])

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
        {filteredAssignedGeoEvents.map(event => {
          const member = getMemberById(event.assigneeId)
          return (
            <MapPin
              key={event.id}
              event={event}
              color={member?.color || '#1A1A1A'}
              stopNumber={showStopNumbers ? stopNumberMap.get(event.id) : undefined}
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
        showStopNumbers={showStopNumbers}
        onToggleStopNumbers={() => setShowStopNumbers(prev => !prev)}
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
  roleFilter: PropTypes.oneOf(['all', 'tech', 'sales']),
}
