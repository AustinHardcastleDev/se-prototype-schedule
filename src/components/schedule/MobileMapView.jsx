import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { format } from 'date-fns'
import PropTypes from 'prop-types'
import { getAllMembers, getMemberById, getEventTypeByKey } from '../../utils/dataAccess'
import MapPin from './MapPin'
import MapOverlayControls from './MapOverlayControls'
import SidebarTimeline from './SidebarTimeline'

const DENVER_CENTER = [39.74, -104.99]
const DEFAULT_ZOOM = 12

const SHEET_HIDDEN = 'hidden'
const SHEET_EXPANDED = 'expanded'
const EXPANDED_RATIO = 0.7

export default function MobileMapView({ selectedDate, events, onEventUpdate }) {
  const [showUnassigned, setShowUnassigned] = useState(true)
  const [showEarlier, setShowEarlier] = useState(true)
  const [showStopNumbers, setShowStopNumbers] = useState(true)

  // Bottom sheet state
  const [sheetState, setSheetState] = useState(SHEET_HIDDEN)
  const [selectedPinEvent, setSelectedPinEvent] = useState(null)
  const [selectedTechId, setSelectedTechId] = useState(null)
  const [ghostStartTime, setGhostStartTime] = useState(null)
  const [ghostEndTime, setGhostEndTime] = useState(null)
  const [isAssigned, setIsAssigned] = useState(false)
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false)

  // Drag state
  const [dragY, setDragY] = useState(null)
  const dragStartY = useRef(null)
  const dragStartTranslate = useRef(null)

  const members = getAllMembers().filter(m => m.role === 'tech' || m.role === 'sales')
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const formatTime = (timeStr) => {
    const [hour, minute] = timeStr.split(':').map(Number)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  // Event filtering — same logic as DesktopMapView
  const { assignedGeoEvents, unassignedGeoEvents, earlierGeoEvents } = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const geoDateEvents = events.filter(e => e.date === dateStr && e.lat != null)
    return {
      assignedGeoEvents: geoDateEvents.filter(e => e.assigneeId != null),
      unassignedGeoEvents: events.filter(e => e.assigneeId === null && e.lat != null && e.date >= todayStr),
      earlierGeoEvents: events.filter(e => e.earlierOpening === true && e.lat != null && e.date > dateStr),
    }
  }, [events, dateStr])

  // Stop number computation — same as DesktopMapView
  const stopNumberMap = useMemo(() => {
    const map = new Map()
    const byTech = new Map()
    for (const event of assignedGeoEvents) {
      if (!byTech.has(event.assigneeId)) byTech.set(event.assigneeId, [])
      byTech.get(event.assigneeId).push(event)
    }
    for (const techEvents of byTech.values()) {
      techEvents.sort((a, b) => a.startTime.localeCompare(b.startTime))
      techEvents.forEach((event, i) => map.set(event.id, i + 1))
    }
    return map
  }, [assignedGeoEvents])

  // Reset tech selection when a new pin is tapped
  useEffect(() => {
    setSelectedTechId(null)
    setIsAssigned(false)
    setGhostStartTime(null)
    setGhostEndTime(null)
    setIsTechDropdownOpen(false)
  }, [selectedPinEvent?.id])

  // Initialize ghost when tech changes
  useEffect(() => {
    if (selectedTechId && selectedPinEvent) {
      setGhostStartTime(selectedPinEvent.startTime)
      setGhostEndTime(selectedPinEvent.endTime)
      setIsAssigned(false)
    } else {
      setGhostStartTime(null)
      setGhostEndTime(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTechId])

  const handlePinClick = (event) => {
    setSelectedPinEvent(event)
    setSheetState(SHEET_EXPANDED)
  }

  const handleCloseSheet = useCallback(() => {
    setSheetState(SHEET_HIDDEN)
    setSelectedPinEvent(null)
  }, [])

  // Bottom sheet translate values
  const getTranslateY = useCallback(() => {
    if (sheetState === SHEET_HIDDEN) return '100%'
    return '0px'
  }, [sheetState])

  // Drag handlers for bottom sheet handle
  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY
    dragStartTranslate.current = sheetState === SHEET_EXPANDED ? 0 : window.innerHeight
  }

  const handleTouchMove = (e) => {
    if (dragStartY.current == null) return
    const delta = e.touches[0].clientY - dragStartY.current
    const newTranslate = Math.max(0, dragStartTranslate.current + delta)
    setDragY(newTranslate)
  }

  const handleTouchEnd = () => {
    if (dragStartY.current == null || dragY == null) {
      dragStartY.current = null
      return
    }
    const vh = window.innerHeight
    const sheetHeight = vh * EXPANDED_RATIO
    // Dismiss if dragged past 40% of the sheet height
    const dismissThreshold = sheetHeight * 0.4

    if (dragY < dismissThreshold) {
      setSheetState(SHEET_EXPANDED)
    } else {
      handleCloseSheet()
    }

    setDragY(null)
    dragStartY.current = null
    dragStartTranslate.current = null
  }

  // Tech assignment
  const selectedTechEvents = selectedTechId
    ? events.filter(e => e.assigneeId === selectedTechId && e.date === dateStr)
    : []

  const hasGhostConflict = ghostStartTime && ghostEndTime && selectedTechId && selectedTechEvents.some(ev =>
    ev.id !== selectedPinEvent?.id && ghostStartTime < ev.endTime && ghostEndTime > ev.startTime
  )

  const canAssign = selectedTechId && !hasGhostConflict && !isAssigned

  const handleAssign = () => {
    if (canAssign && ghostStartTime && ghostEndTime && selectedPinEvent) {
      const updatedEvent = {
        ...selectedPinEvent,
        assigneeId: selectedTechId,
        ...(ghostStartTime ? { startTime: ghostStartTime } : {}),
        ...(ghostEndTime ? { endTime: ghostEndTime } : {}),
        ...(selectedPinEvent.earlierOpening ? { earlierOpening: false, date: dateStr } : {}),
      }
      onEventUpdate(updatedEvent)
      setSelectedPinEvent(updatedEvent)
      setIsAssigned(true)
    }
  }

  const handleGhostTimeChange = (newStart, newEnd) => {
    setGhostStartTime(newStart)
    setGhostEndTime(newEnd)
  }

  if (!selectedPinEvent) {
    // no-op for variables used only in sheet
  }

  const eventType = selectedPinEvent ? getEventTypeByKey(selectedPinEvent.type) : null
  const isUnassigned = selectedPinEvent?.assigneeId === null
  const isEarlier = selectedPinEvent?.earlierOpening === true
  const currentAssignee = selectedPinEvent?.assigneeId
    ? members.find(m => m.id === selectedPinEvent.assigneeId)
    : null

  const sheetTranslateY = dragY != null ? `${dragY}px` : getTranslateY()

  return (
    <div className="relative flex-1 min-h-0">
      <MapContainer
        center={DENVER_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ position: 'absolute', inset: 0 }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Assigned pins */}
        {assignedGeoEvents.map(event => {
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

        {/* Unassigned pins */}
        {showUnassigned && unassignedGeoEvents.map(event => (
          <MapPin
            key={event.id}
            event={event}
            color="#EF4444"
            glowType="unassigned"
            onClick={handlePinClick}
          />
        ))}

        {/* Earlier opening pins */}
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

      {/* Bottom sheet backdrop */}
      {sheetState !== SHEET_HIDDEN && (
        <div
          className="fixed inset-0 z-[1000] bg-black/20"
          onClick={handleCloseSheet}
        />
      )}

      {/* Bottom sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[1001] bg-white rounded-t-2xl shadow-2xl flex flex-col"
        style={{
          height: `${EXPANDED_RATIO * 100}vh`,
          transform: `translateY(${sheetTranslateY})`,
          transition: dragY != null ? 'none' : 'transform 400ms cubic-bezier(0.32, 0.72, 0, 1)',
          borderTop: selectedPinEvent ? `3.5px solid ${eventType?.color || '#6B7280'}` : undefined,
        }}
      >
        {/* Drag handle */}
        <div
          className="flex-shrink-0 flex items-center justify-center py-3 cursor-grab"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {selectedPinEvent && (
          <>
            {/* Peek content — always visible */}
            <div className="px-4 pb-3 flex-shrink-0 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: eventType?.color || '#6B7280' }}
                />
                <span className="text-xs font-semibold text-gray-500 uppercase font-body">
                  {eventType?.label || selectedPinEvent.type}
                </span>
              </div>
              <h4 className="font-body text-base font-bold text-gray-900 mb-0.5">{selectedPinEvent.title}</h4>
              {selectedPinEvent.address && (
                <p className="font-body text-sm text-gray-500 mb-0.5">{selectedPinEvent.address}</p>
              )}
              {selectedPinEvent.startTime && (
                <p className="font-body text-sm text-gray-600">
                  {formatTime(selectedPinEvent.startTime)} – {formatTime(selectedPinEvent.endTime)}
                </p>
              )}

              {/* Status badges */}
              <div className="flex gap-2 mt-2">
                {isEarlier && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-body bg-amber-100 text-amber-700">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Earlier Opening
                  </span>
                )}
                {isUnassigned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-body bg-gray-100 text-gray-500">
                    Unassigned
                  </span>
                )}
                {currentAssignee && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-body text-white"
                    style={{ backgroundColor: currentAssignee.color }}
                  >
                    {currentAssignee.name}
                  </span>
                )}
              </div>
            </div>

            {/* Expanded content — scrollable */}
            {sheetState === SHEET_EXPANDED && (
              <div className="flex-1 overflow-y-auto min-h-0" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
                {/* Tech selector */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <label className="font-body text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                    Assign to
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTechDropdownOpen(prev => !prev)}
                      className="w-full flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 font-body text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors cursor-pointer text-left"
                    >
                      {selectedTechId ? (
                        <>
                          <svg width="12" height="18" viewBox="0 0 24 36" className="flex-shrink-0">
                            <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill={members.find(m => m.id === selectedTechId)?.color || '#6B7280'} stroke="white" strokeWidth="1.5"/>
                            <circle cx="12" cy="12" r="4.5" fill="white"/>
                          </svg>
                          <span className="truncate">
                            {members.find(m => m.id === selectedTechId)?.name}
                            {selectedPinEvent.assigneeId === selectedTechId ? ' (current)' : ''}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400 font-normal">Select a tech...</span>
                      )}
                    </button>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>

                    {isTechDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 max-h-60 overflow-y-auto">
                        {members.map(member => {
                          const memberJobCount = events.filter(
                            e => e.assigneeId === member.id && e.date === dateStr
                          ).length
                          const isCurrent = selectedPinEvent.assigneeId === member.id
                          const isSelected = selectedTechId === member.id
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => {
                                setSelectedTechId(member.id)
                                setIsTechDropdownOpen(false)
                                // Scroll to show the timeline after tech selection
                                setTimeout(() => {
                                  const timeline = document.querySelector('[data-sidebar-timeline]')
                                  if (timeline) {
                                    timeline.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                  }
                                }, 100)
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left font-body text-sm transition-colors ${
                                isSelected
                                  ? 'bg-accent/10 font-semibold text-gray-900'
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <svg width="12" height="18" viewBox="0 0 24 36" className="flex-shrink-0">
                                <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill={member.color} stroke="white" strokeWidth="1.5"/>
                                <circle cx="12" cy="12" r="4.5" fill="white"/>
                              </svg>
                              <span className="truncate flex-1">
                                {member.name}{isCurrent ? ' (current)' : ''}
                              </span>
                              <span className="text-xs text-gray-400 flex-shrink-0">{memberJobCount} jobs</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* SidebarTimeline */}
                {selectedTechId && (
                  <div className="border-b border-gray-100" data-sidebar-timeline>
                    <div className="px-4 pt-3 pb-1">
                      <h5 className="font-body text-xs font-bold text-gray-400 uppercase tracking-wide">
                        {members.find(m => m.id === selectedTechId)?.name}&apos;s Schedule
                      </h5>
                    </div>
                    <div className="px-2 pb-2">
                      <SidebarTimeline
                        techEvents={selectedTechEvents}
                        ghostEvent={selectedPinEvent}
                        ghostStartTime={ghostStartTime}
                        ghostEndTime={ghostEndTime}
                        onGhostTimeChange={handleGhostTimeChange}
                        onEventUpdate={onEventUpdate}
                        isAssigned={isAssigned}
                        selectedDate={dateStr}
                        techId={selectedTechId}
                        maxHeight={null}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sticky assign button — visible in expanded state */}
            {sheetState === SHEET_EXPANDED && (
              <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
                {hasGhostConflict && selectedTechId && (
                  <p className="font-body text-xs text-red-500 font-semibold mb-2 text-center">
                    Cannot assign — conflicts with existing event
                  </p>
                )}
                <button
                  onClick={handleAssign}
                  disabled={!canAssign}
                  className={`w-full py-2.5 rounded-lg font-body text-sm font-bold uppercase tracking-wide transition-all ${
                    isAssigned
                      ? 'bg-green-500 text-white cursor-default'
                      : canAssign
                        ? 'bg-accent text-white hover:bg-accent/90 shadow-sm'
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isAssigned ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Assigned
                    </span>
                  ) : selectedTechId === selectedPinEvent?.assigneeId ? 'Reschedule Job' : isUnassigned ? 'Assign Job' : 'Reassign Job'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

MobileMapView.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  events: PropTypes.array.isRequired,
  onEventUpdate: PropTypes.func.isRequired,
}
