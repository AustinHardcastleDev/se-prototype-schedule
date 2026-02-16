import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useDraggable, useDroppable, useDndContext } from '@dnd-kit/core'
import { getEventTypes, getEventTypeByKey } from '../../utils/dataAccess'

// Draggable wrapper for holding pin cards
function DraggableHoldingCard({ event, children }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `holding-${event.id}`,
    data: { event, source: 'holding-pin' },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none',
      }}
    >
      {children}
    </div>
  )
}

DraggableHoldingCard.propTypes = {
  event: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
}

export default function DesktopFloatingPanel({ onEventTypeSelect, roleFilter, onRoleFilterChange, events = [], onEventClick, earlierHighlightMode = false, onEarlierHighlightToggle }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isUnassignedOpen, setIsUnassignedOpen] = useState(false)
  const eventTypes = getEventTypes()

  const earlierOpeningEvents = events.filter(e => e.earlierOpening === true)
  const unassignedEvents = events.filter(e => e.assigneeId === null)

  const handleEventTypeClick = (eventType) => {
    setIsCreateOpen(false)
    onEventTypeSelect(eventType)
  }

  const handleBackdropClick = () => {
    setIsCreateOpen(false)
    setIsUnassignedOpen(false)
  }

  const handleHoldingCardClick = (event) => {
    setIsUnassignedOpen(false)
    if (onEventClick) onEventClick(event)
  }

  // Close expanded panels when a holding pin drag starts so user can see the grid
  const { active } = useDndContext()
  const isDraggingFromHoldingPin = active?.data?.current?.source === 'holding-pin'
  const isAnyDragActive = !!active

  useEffect(() => {
    if (isDraggingFromHoldingPin) {
      setIsUnassignedOpen(false)
    }
  }, [isDraggingFromHoldingPin])

  // Make Unassigned pill a droppable target for calendar events
  const { setNodeRef: setUnassignedDropRef, isOver: isOverUnassigned } = useDroppable({
    id: 'holding-pin-unassigned',
    data: { target: 'unassigned' },
  })

  const anyOpen = isCreateOpen || isUnassignedOpen

  // Format time for display
  const formatTime = (timeStr) => {
    const [hour, minute] = timeStr.split(':').map(Number)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  // Format date for compact display
  const formatDateShort = (dateStr) => {
    const [, month, day] = dateStr.split('-')
    return `${parseInt(month)}/${parseInt(day)}`
  }

  return (
    <>
      {/* Backdrop overlay when any menu is open */}
      {anyOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleBackdropClick}
        />
      )}

      {/* Floating Bottom Bar - Desktop Only */}
      <div className="hidden md:flex fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 items-center gap-3">
        {/* Earlier Opening Toggle */}
        {earlierOpeningEvents.length > 0 && (
          <button
            onClick={() => {
              if (onEarlierHighlightToggle) onEarlierHighlightToggle()
              setIsUnassignedOpen(false)
              setIsCreateOpen(false)
            }}
            className={`flex items-center gap-2 bg-charcoal/95 backdrop-blur-sm border rounded-full px-3 py-2 shadow-2xl hover:brightness-110 transition-all ${
              earlierHighlightMode ? 'ring-2 ring-amber-400 border-amber-400/50 bg-amber-400/10' : 'border-secondary'
            }`}
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="font-body text-xs text-white font-semibold whitespace-nowrap">Earlier</span>
            <span className={`font-body text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${
              earlierHighlightMode ? 'text-charcoal bg-amber-400' : 'text-charcoal bg-amber-400'
            }`}>
              {earlierOpeningEvents.length}
            </span>
          </button>
        )}

        {/* Center Panel */}
        <div className="flex items-center gap-2 bg-charcoal/95 backdrop-blur-sm border border-secondary rounded-full px-3 py-2 shadow-2xl">
          {/* Role Filter Pills */}
          <div className="flex items-center gap-1 mr-1">
            {[
              { value: 'all', label: 'All' },
              { value: 'tech', label: 'Tech' },
              { value: 'sales', label: 'Sales' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => onRoleFilterChange(filter.value)}
                className={`px-3 py-1.5 rounded-full font-body text-xs font-semibold transition-all ${
                  roleFilter === filter.value
                    ? 'bg-accent text-white'
                    : 'bg-secondary text-muted hover:text-text-light hover:brightness-110'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-secondary" />

          {/* Create Event Button */}
          <div className="relative ml-1">
            {/* Event Type Menu - shown above button */}
            {isCreateOpen && (
              <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 animate-fadeIn">
                {eventTypes.map((eventType) => (
                  <button
                    key={eventType.key}
                    onClick={() => handleEventTypeClick(eventType)}
                    className="flex items-center gap-3 bg-white rounded-full px-4 py-2.5 shadow-lg hover:brightness-95 transition-all whitespace-nowrap"
                    style={{ minWidth: '200px' }}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: eventType.color }}
                    />
                    <span className="text-sm font-body text-text-dark font-semibold">
                      {eventType.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setIsCreateOpen(!isCreateOpen)
                setIsUnassignedOpen(false)
              }}
              className={`w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white hover:brightness-110 transition-all ${
                isCreateOpen ? 'rotate-45 scale-110' : 'rotate-0 scale-100'
              }`}
              aria-label={isCreateOpen ? 'Close menu' : 'Create event'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Unassigned Jobs */}
        {(unassignedEvents.length > 0 || isAnyDragActive) && (
          <div className="relative">
            {/* Expanded card list */}
            {isUnassignedOpen && unassignedEvents.length > 0 && (
              <div className="absolute bottom-full mb-3 left-0 flex flex-col gap-2 animate-fadeIn" style={{ width: '280px' }}>
                {unassignedEvents.map((event) => {
                  const evtType = getEventTypeByKey(event.type)
                  return (
                    <DraggableHoldingCard key={event.id} event={event}>
                      <button
                        onClick={() => handleHoldingCardClick(event)}
                        className="bg-charcoal/95 backdrop-blur-sm border border-secondary rounded-xl px-4 py-3 hover:brightness-125 transition-all text-left shadow-lg w-full"
                        style={{}}
                      >
                        <div className="text-sm font-body text-text-light font-semibold truncate">{event.title}</div>
                        <div className="text-xs font-body text-muted mt-0.5">
                          {formatDateShort(event.date)} &middot; {formatTime(event.startTime)}
                        </div>
                        <div className="text-xs font-body text-rose-400 font-semibold mt-0.5">Unassigned</div>
                        {event.notes && (
                          <div className="flex items-start gap-1 mt-1.5">
                            <svg className="w-2.5 h-2.5 text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                              <rect x="9" y="3" width="6" height="4" rx="1"/>
                            </svg>
                            <span className="text-xs font-body text-blue-400 line-clamp-2">{event.notes}</span>
                          </div>
                        )}
                      </button>
                    </DraggableHoldingCard>
                  )
                })}
              </div>
            )}

            {/* Pill button - also a drop target */}
            <button
              ref={setUnassignedDropRef}
              onClick={() => {
                setIsUnassignedOpen(!isUnassignedOpen)
                setIsCreateOpen(false)
              }}
              className={`flex items-center gap-2 bg-charcoal/95 backdrop-blur-sm border rounded-full shadow-2xl hover:brightness-110 transition-all duration-300 ease-out ${
                isOverUnassigned
                  ? 'ring-2 ring-rose-400 scale-125 brightness-125 border-rose-400 px-5 py-3'
                  : isAnyDragActive
                    ? 'ring-2 ring-rose-400/60 scale-110 border-rose-400/60 px-4 py-2.5'
                    : isUnassignedOpen
                      ? 'ring-1 ring-rose-400/50 border-secondary px-3 py-2'
                      : 'border-secondary px-3 py-2'
              }`}
            >
              <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span className="font-body text-xs text-white font-semibold whitespace-nowrap">Unassigned</span>
              <span className="font-body text-xs text-charcoal bg-rose-400 rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unassignedEvents.length}
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}

DesktopFloatingPanel.propTypes = {
  onEventTypeSelect: PropTypes.func.isRequired,
  roleFilter: PropTypes.oneOf(['all', 'tech', 'sales']).isRequired,
  onRoleFilterChange: PropTypes.func.isRequired,
  events: PropTypes.array,
  onEventClick: PropTypes.func,
  earlierHighlightMode: PropTypes.bool,
  onEarlierHighlightToggle: PropTypes.func,
}
