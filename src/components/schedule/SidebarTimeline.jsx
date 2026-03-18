import { useState, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import EventCard from './EventCard'
import { getEventTypeByKey } from '../../utils/dataAccess'

const SLOT_HEIGHT = 16 // pixels per 15-minute slot (matches DesktopTimeGrid)
const SLOTS_PER_HOUR = 4
const START_HOUR = 6 // 6 AM
const END_HOUR = 20 // 8 PM
const TOTAL_HOURS = END_HOUR - START_HOUR
const TOTAL_SLOTS = TOTAL_HOURS * SLOTS_PER_HOUR
const GRID_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT
const GUTTER_WIDTH = 40

// Convert "HH:MM" to pixel offset from grid top
const timeToOffset = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number)
  const slots = (h - START_HOUR) * SLOTS_PER_HOUR + m / 15
  return slots * SLOT_HEIGHT
}

// Convert pixel offset to "HH:MM" snapped to 15-min
const offsetToTime = (px) => {
  const slot = Math.round(px / SLOT_HEIGHT)
  const clamped = Math.max(0, Math.min(TOTAL_SLOTS, slot))
  const totalMin = clamped * 15
  const h = Math.floor(totalMin / 60) + START_HOUR
  const m = totalMin % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// Format "HH:MM" to "h:MM AM/PM"
const formatTime = (timeStr) => {
  const [hour, minute] = timeStr.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
}

// Check if two time ranges overlap
const timesOverlap = (s1, e1, s2, e2) => s1 < e2 && e1 > s2

export default function SidebarTimeline({
  techEvents,
  ghostEvent,
  ghostStartTime,
  ghostEndTime,
  onGhostTimeChange,
  onEventUpdate,
  isAssigned,
  selectedDate,
  techId,
  maxHeight = '420px',
}) {
  const scrollRef = useRef(null)
  const ghostRef = useRef(null)

  // Drag state for ghost card
  const [isDraggingGhost, setIsDraggingGhost] = useState(false)
  const ghostDragRef = useRef({ startY: 0, origTop: 0 })

  // Resize state for ghost card
  const [isResizingGhost, setIsResizingGhost] = useState(false)
  const ghostResizeRef = useRef({ startY: 0, origEnd: 0 })

  // Drag state for existing events
  const [draggingEventId, setDraggingEventId] = useState(null)
  const eventDragRef = useRef({ startY: 0, origTop: 0, duration: 0, eventId: null })

  // Resize state for existing events
  const [resizingEventId, setResizingEventId] = useState(null)
  const eventResizeRef = useRef({ startY: 0, origEnd: 0, eventId: null, startTime: '' })

  // Generate hour labels
  const timeLabels = []
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    const d = new Date()
    d.setHours(hour, 0, 0, 0)
    const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`
    timeLabels.push({ hour, label })
  }

  // Auto-scroll to center ghost card on mount
  useEffect(() => {
    if (scrollRef.current && ghostStartTime) {
      const ghostTop = timeToOffset(ghostStartTime)
      const containerHeight = scrollRef.current.clientHeight
      scrollRef.current.scrollTop = Math.max(0, ghostTop - containerHeight / 3)
    }
  }, [techId]) // Re-center when tech changes

  // Conflict detection: does ghost overlap any existing event?
  const hasConflict = ghostStartTime && ghostEndTime && techEvents.some(ev =>
    ev.id !== ghostEvent?.id && timesOverlap(ghostStartTime, ghostEndTime, ev.startTime, ev.endTime)
  )

  // Auto-scroll container when dragging near top/bottom edges
  // When maxHeight is null, the component itself doesn't scroll — find the nearest scrollable ancestor
  const autoScrollEdge = useCallback((clientY) => {
    let container = scrollRef.current
    if (!container) return
    // If this element isn't scrollable, walk up to find the scrollable ancestor
    if (container.scrollHeight <= container.clientHeight) {
      let el = container.parentElement
      while (el) {
        if (el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY !== 'visible') {
          container = el
          break
        }
        el = el.parentElement
      }
    }
    const rect = container.getBoundingClientRect()
    const edgeZone = 40
    const scrollSpeed = 6
    if (clientY < rect.top + edgeZone) {
      container.scrollTop -= scrollSpeed
    } else if (clientY > rect.bottom - edgeZone) {
      container.scrollTop += scrollSpeed
    }
  }, [])

  // --- Ghost card drag (vertical reposition) ---
  const handleGhostDragStart = useCallback((e) => {
    if (isAssigned || isResizingGhost) return
    // Ignore if started on resize handle
    if (e.target.closest('[data-resize-handle]')) return
    e.preventDefault()
    e.stopPropagation()

    const ghostTop = timeToOffset(ghostStartTime)
    ghostDragRef.current = { startY: e.clientY, origTop: ghostTop }
    setIsDraggingGhost(true)

    const handleMove = (ev) => {
      autoScrollEdge(ev.clientY)
      const deltaY = ev.clientY - ghostDragRef.current.startY
      const newTop = ghostDragRef.current.origTop + deltaY
      // Snap to slot
      const snappedStart = offsetToTime(newTop)
      // Preserve duration
      const [sh, sm] = ghostStartTime.split(':').map(Number)
      const [eh, em] = ghostEndTime.split(':').map(Number)
      const durMin = (eh * 60 + em) - (sh * 60 + sm)
      const [nsh, nsm] = snappedStart.split(':').map(Number)
      const endMin = nsh * 60 + nsm + durMin
      // Clamp end
      if (endMin > END_HOUR * 60) return
      if (nsh < START_HOUR) return
      const newEnd = `${Math.floor(endMin / 60).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`
      onGhostTimeChange(snappedStart, newEnd)
    }

    const handleUp = () => {
      setIsDraggingGhost(false)
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
  }, [ghostStartTime, ghostEndTime, isAssigned, isResizingGhost, onGhostTimeChange, autoScrollEdge])

  // --- Ghost card resize (bottom edge) ---
  const handleGhostResizeStart = useCallback((e) => {
    if (isAssigned) return
    e.preventDefault()
    e.stopPropagation()

    const endOffset = timeToOffset(ghostEndTime)
    ghostResizeRef.current = { startY: e.clientY, origEnd: endOffset }
    setIsResizingGhost(true)

    const handleMove = (ev) => {
      autoScrollEdge(ev.clientY)
      const deltaY = ev.clientY - ghostResizeRef.current.startY
      const newEndPx = ghostResizeRef.current.origEnd + deltaY
      const newEnd = offsetToTime(newEndPx)
      // Enforce min 15-min duration
      const [sh, sm] = ghostStartTime.split(':').map(Number)
      const [neh, nem] = newEnd.split(':').map(Number)
      if ((neh * 60 + nem) - (sh * 60 + sm) < 15) return
      if (neh > END_HOUR || (neh === END_HOUR && nem > 0)) return
      onGhostTimeChange(ghostStartTime, newEnd)
    }

    const handleUp = () => {
      setIsResizingGhost(false)
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
  }, [ghostStartTime, ghostEndTime, isAssigned, onGhostTimeChange, autoScrollEdge])

  // --- Existing event drag ---
  const handleEventDragStart = useCallback((ev, pointerEvent) => {
    pointerEvent.preventDefault()
    pointerEvent.stopPropagation()

    const origTop = timeToOffset(ev.startTime)
    const [sh, sm] = ev.startTime.split(':').map(Number)
    const [eh, em] = ev.endTime.split(':').map(Number)
    const duration = (eh * 60 + em) - (sh * 60 + sm)

    eventDragRef.current = { startY: pointerEvent.clientY, origTop, duration, eventId: ev.id }
    setDraggingEventId(ev.id)

    const handleMove = (e) => {
      autoScrollEdge(e.clientY)
      const deltaY = e.clientY - eventDragRef.current.startY
      const newTop = eventDragRef.current.origTop + deltaY
      const newStart = offsetToTime(newTop)
      const [nsh, nsm] = newStart.split(':').map(Number)
      const endMin = nsh * 60 + nsm + eventDragRef.current.duration
      if (endMin > END_HOUR * 60 || nsh < START_HOUR) return
      const newEnd = `${Math.floor(endMin / 60).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`

      onEventUpdate({ ...ev, startTime: newStart, endTime: newEnd })
    }

    const handleUp = () => {
      setDraggingEventId(null)
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
  }, [onEventUpdate, autoScrollEdge])

  // --- Existing event resize ---
  const handleEventResizeStart = useCallback((ev, pointerEvent) => {
    pointerEvent.preventDefault()
    pointerEvent.stopPropagation()

    const endOffset = timeToOffset(ev.endTime)
    eventResizeRef.current = { startY: pointerEvent.clientY, origEnd: endOffset, eventId: ev.id, startTime: ev.startTime }
    setResizingEventId(ev.id)

    const handleMove = (e) => {
      autoScrollEdge(e.clientY)
      const deltaY = e.clientY - eventResizeRef.current.startY
      const newEndPx = eventResizeRef.current.origEnd + deltaY
      const newEnd = offsetToTime(newEndPx)
      const [sh, sm] = eventResizeRef.current.startTime.split(':').map(Number)
      const [neh, nem] = newEnd.split(':').map(Number)
      if ((neh * 60 + nem) - (sh * 60 + sm) < 15) return
      if (neh > END_HOUR || (neh === END_HOUR && nem > 0)) return
      onEventUpdate({ ...ev, endTime: newEnd })
    }

    const handleUp = () => {
      setResizingEventId(null)
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
  }, [onEventUpdate, autoScrollEdge])

  // Ghost card pixel values
  const ghostTop = ghostStartTime ? timeToOffset(ghostStartTime) : 0
  const ghostBottom = ghostEndTime ? timeToOffset(ghostEndTime) : 0
  const ghostHeight = ghostBottom - ghostTop
  const ghostDurationMin = ghostStartTime && ghostEndTime
    ? (() => { const [sh,sm] = ghostStartTime.split(':').map(Number); const [eh,em] = ghostEndTime.split(':').map(Number); return (eh*60+em)-(sh*60+sm) })()
    : 0

  const eventType = ghostEvent ? getEventTypeByKey(ghostEvent.type) : null

  return (
    <div
      ref={scrollRef}
      className={maxHeight ? 'overflow-y-auto overflow-x-hidden' : ''}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <div className="relative" style={{ height: `${GRID_HEIGHT}px`, minWidth: '100%' }}>

        {/* Hour labels gutter */}
        <div
          className="absolute top-0 left-0 bottom-0 z-10"
          style={{ width: `${GUTTER_WIDTH}px` }}
        >
          {timeLabels.map((t, i) => {
            const top = i * SLOTS_PER_HOUR * SLOT_HEIGHT
            return (
              <div
                key={t.hour}
                className="absolute right-1 -translate-y-1.5 text-right"
                style={{ top: `${top}px`, width: `${GUTTER_WIDTH - 4}px` }}
              >
                <span className="text-[10px] font-body text-gray-400 uppercase leading-none">
                  {t.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Grid lines */}
        <div
          className="absolute top-0 bottom-0 right-0"
          style={{ left: `${GUTTER_WIDTH}px` }}
        >
          {timeLabels.map((t, i) => {
            const top = i * SLOTS_PER_HOUR * SLOT_HEIGHT
            return (
              <div key={t.hour}>
                <div
                  className="absolute left-0 right-0 border-t border-gray-200"
                  style={{ top: `${top}px` }}
                />
                {i < timeLabels.length - 1 && (
                  <>
                    <div className="absolute left-0 right-0 border-t border-gray-100" style={{ top: `${top + SLOT_HEIGHT}px` }} />
                    <div className="absolute left-0 right-0 border-t border-gray-100" style={{ top: `${top + SLOT_HEIGHT * 2}px` }} />
                    <div className="absolute left-0 right-0 border-t border-gray-100" style={{ top: `${top + SLOT_HEIGHT * 3}px` }} />
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Existing events */}
        {techEvents.filter(ev => ev.id !== ghostEvent?.id).map(ev => {
          const top = timeToOffset(ev.startTime)
          return (
            <div
              key={ev.id}
              className="absolute"
              style={{
                top: `${top}px`,
                left: `${GUTTER_WIDTH + 4}px`,
                right: '8px',
                cursor: 'grab',
                touchAction: 'none',
              }}
              onPointerDown={(e) => {
                // Don't start drag if clicking resize handle
                if (e.target.closest('[data-resize-handle]')) return
                handleEventDragStart(ev, e)
              }}
            >
              <EventCard
                event={ev}
                compact={true}
                disableInteraction={true}
                onResizeStart={(evt, pe) => handleEventResizeStart(evt, pe)}
              />
            </div>
          )
        })}

        {/* Ghost card */}
        {ghostEvent && ghostStartTime && ghostEndTime && (
          <div
            ref={ghostRef}
            className={`absolute transition-shadow ${
              isAssigned ? '' : 'cursor-grab'
            } ${isDraggingGhost ? 'cursor-grabbing z-30' : 'z-20'}`}
            style={{
              top: `${ghostTop}px`,
              left: `${GUTTER_WIDTH + 4}px`,
              right: '8px',
              height: `${ghostHeight}px`,
              minHeight: `${SLOT_HEIGHT}px`,
              touchAction: 'none',
            }}
            onPointerDown={!isAssigned ? handleGhostDragStart : undefined}
          >
            <div
              className={`relative h-full rounded-md overflow-hidden ${
                hasConflict
                  ? 'border-2 border-dashed border-red-400 bg-red-50'
                  : isAssigned
                    ? 'border-2 border-solid border-accent bg-accent/20'
                    : 'border-2 border-dashed border-accent bg-accent/8'
              }`}
              style={{
                // Subtle animated dash pattern for ghost state
                ...((!isAssigned && !hasConflict) ? {
                  backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(244, 122, 32, 0.04) 4px, rgba(244, 122, 32, 0.04) 8px)',
                } : {}),
              }}
            >
              {/* Left accent strip */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  hasConflict ? 'bg-red-400' : 'bg-accent'
                }`}
              />

              <div className={`pl-3 pr-2 ${ghostDurationMin <= 15 ? 'flex items-center h-full' : 'pt-1.5'}`}>
                {/* Title */}
                <div className={`text-xs font-body font-semibold truncate ${
                  hasConflict ? 'text-red-600' : 'text-accent'
                }`}>
                  {isAssigned && (
                    <svg className="w-3 h-3 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {ghostEvent.title}
                </div>

                {/* Time display */}
                {ghostDurationMin >= 30 && (
                  <div className={`text-[10px] font-body mt-0.5 ${
                    hasConflict ? 'text-red-400' : 'text-accent/70'
                  }`}>
                    {formatTime(ghostStartTime)} – {formatTime(ghostEndTime)}
                  </div>
                )}

                {/* Type label */}
                {ghostDurationMin >= 60 && eventType && (
                  <div className={`text-[10px] font-body mt-0.5 ${
                    hasConflict ? 'text-red-300' : 'text-accent/50'
                  }`}>
                    {eventType.label}
                  </div>
                )}

                {/* Conflict warning */}
                {hasConflict && ghostDurationMin >= 45 && (
                  <div className="text-[10px] font-body text-red-500 font-semibold mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Conflict
                  </div>
                )}
              </div>

              {/* Resize handle (bottom edge) - hidden when assigned */}
              {!isAssigned && (
                <div
                  data-resize-handle
                  className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center z-30 group"
                  onPointerDown={handleGhostResizeStart}
                  style={{ touchAction: 'none' }}
                >
                  <div className={`w-8 h-1 rounded-full transition-colors ${
                    hasConflict ? 'bg-red-300 group-hover:bg-red-400' : 'bg-accent/40 group-hover:bg-accent/70'
                  }`} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

SidebarTimeline.propTypes = {
  techEvents: PropTypes.array.isRequired,
  ghostEvent: PropTypes.object,
  ghostStartTime: PropTypes.string,
  ghostEndTime: PropTypes.string,
  onGhostTimeChange: PropTypes.func.isRequired,
  onEventUpdate: PropTypes.func.isRequired,
  isAssigned: PropTypes.bool,
  selectedDate: PropTypes.string,
  techId: PropTypes.string,
  maxHeight: PropTypes.string,
}
