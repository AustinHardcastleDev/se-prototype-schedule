import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { getEventTypeByKey } from '../../utils/dataAccess'

const SLOT_HEIGHT = 16 // pixels per 15-minute slot (must match TimeGrid.jsx)

// Job event types that show status indicators
const JOB_TYPES = ['job-occupied', 'job-vacant', 'callback-job']

// Status indicator colors
const STATUS_COLORS = {
  'open': null, // No indicator
  'closed-no-invoice': '#EAB308', // Yellow
  'closed-invoiced': '#8B5CF6', // Purple
}

// SVG icons for each event type (shown when card has enough room)
const TYPE_ICONS = {
  'job-occupied': (
    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-8 9 8v8a1 1 0 01-1 1H4a1 1 0 01-1-1v-8z"/>
      <path d="M9 21v-6h6v6"/>
    </svg>
  ),
  'job-vacant': (
    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-8 9 8v8a1 1 0 01-1 1H4a1 1 0 01-1-1v-8z"/>
      <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  'callback-job': (
    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14l-5-5 5-5"/>
      <path d="M4 9h11a5 5 0 010 10h-2"/>
    </svg>
  ),
  'sales-stop': (
    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      <line x1="2" y1="13" x2="22" y2="13"/>
    </svg>
  ),
  'meeting': (
    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  'time-off': (
    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="12" x2="16" y2="14"/>
    </svg>
  ),
}

export default function EventCard({ event, onClick, onLongPress, onResizeStart, disableInteraction = false, disableResize = false, earlierHighlightMode = false }) {
  const eventType = getEventTypeByKey(event.type)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [isLongPressing, setIsLongPressing] = useState(false)

  // Calculate event duration in minutes
  const calculateDurationMinutes = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startTotalMin = startHour * 60 + startMin
    const endTotalMin = endHour * 60 + endMin
    return endTotalMin - startTotalMin
  }

  // Calculate card height based on duration
  const calculateHeight = () => {
    const durationMinutes = calculateDurationMinutes(event.startTime, event.endTime)
    const slots = durationMinutes / 15 // Each slot is 15 minutes
    return slots * SLOT_HEIGHT
  }

  // Format time for display (HH:MM to h:MM AM/PM)
  const formatTime = (timeStr) => {
    const [hour, minute] = timeStr.split(':').map(Number)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  const durationMinutes = calculateDurationMinutes(event.startTime, event.endTime)
  const cardHeight = calculateHeight()
  const isVeryTinyEvent = durationMinutes === 15 // 15 min: centered title only
  const isTinyEvent = durationMinutes <= 30 // 15-30 min events: title only
  const isShortEvent = durationMinutes < 60 // 45 min events: title + time only
  const isJobType = JOB_TYPES.includes(event.type)
  const statusColor = isJobType ? STATUS_COLORS[event.status] : null
  const showIcon = durationMinutes >= 60 // Only show icon when there's enough room

  // Determine if this is a present/future job with no photos
  const today = new Date().toISOString().split('T')[0]
  const isFutureOrPresent = event.date >= today
  const needsPhotos = isJobType && isFutureOrPresent && event.status !== 'closed-invoiced'

  // Determine if this event has notes to review
  const hasNotes = !!event.notes && isFutureOrPresent

  // Long-press handlers
  const handlePointerDown = (e) => {
    if (disableInteraction) return

    e.stopPropagation() // Prevent triggering slot long-press

    setIsLongPressing(true)

    const timer = setTimeout(() => {
      // Long press detected - call onLongPress if provided, otherwise onClick
      if (onLongPress) {
        onLongPress(event)
      } else if (onClick) {
        onClick(event)
      }
      setIsLongPressing(false)
    }, 500) // 500ms for long press

    setLongPressTimer(timer)
  }

  const handlePointerUp = (e) => {
    if (disableInteraction) return

    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)

      // If released before 500ms, treat as click
      if (isLongPressing && onClick) {
        onClick(e)
      }
    }
    setIsLongPressing(false)
  }

  const handlePointerLeave = () => {
    if (disableInteraction) return

    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setIsLongPressing(false)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [longPressTimer])

  const pointerHandlers = disableInteraction
    ? {}
    : {
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerLeave: handlePointerLeave,
      }

  // Resize handle handler - separate from card click
  const handleResizeStart = (e) => {
    if (disableResize) return
    e.stopPropagation() // Prevent card click and drag

    if (onResizeStart) {
      onResizeStart(event, e)
    }
  }

  // Earlier highlight mode styling
  const isEarlier = event.earlierOpening === true
  const highlightActive = earlierHighlightMode && isEarlier
  const dimmed = earlierHighlightMode && !isEarlier

  return (
    <div
      className={`absolute left-0 right-0 bg-white rounded-md cursor-pointer hover:brightness-95 transition-all ${
        disableInteraction ? '' : 'touch-none'
      } ${isLongPressing ? 'brightness-90' : ''} ${
        needsPhotos && !isEarlier ? 'ring-1 ring-amber-400/60 ring-inset' : ''
      }`}
      style={{
        height: `${cardHeight}px`,
        borderLeft: `6px solid ${eventType.borderColor}`,
        minHeight: `${SLOT_HEIGHT}px`, // Minimum 15 minutes
        opacity: dimmed ? 0.4 : undefined,
        // Earlier opening: dotted amber outline by default, solid glowing when highlight active
        ...(isEarlier && !highlightActive ? {
          outline: '2px solid #F59E0B',
          outlineOffset: '-2px',
        } : {}),
        ...(highlightActive ? {
          outline: '2px solid #F59E0B',
          outlineOffset: '-2px',
          boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
        } : {}),
      }}
      {...pointerHandlers}
    >
      <div className={`relative h-full ${isVeryTinyEvent ? 'px-1.5 flex items-center' : 'p-1.5'}`}>
        {/* Status indicator dot (top-right) */}
        {statusColor && (
          <div
            className="absolute top-1 right-1 rounded-full"
            style={{
              backgroundColor: statusColor,
              width: '10px',
              height: '10px'
            }}
          />
        )}

        {/* No-photos indicator (top-right, below status dot) */}
        {needsPhotos && !isTinyEvent && (
          <div
            className={`absolute ${statusColor ? 'top-4' : 'top-1'} right-1`}
            title="No photos"
          >
            <svg className="w-2.5 h-2.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="14" rx="2"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
        )}

        {/* Has-notes indicator (top-right, below other indicators) */}
        {hasNotes && !isTinyEvent && (
          <div
            className={`absolute ${statusColor && needsPhotos ? 'top-7' : statusColor || needsPhotos ? 'top-4' : 'top-1'} right-1`}
            title="Has prep notes"
          >
            <svg className="w-2.5 h-2.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
          </div>
        )}

        {/* Content */}
        {isTinyEvent ? (
          // 15-30 min events: title only (centered for 15 min)
          <div className="text-xs font-body text-text-dark font-semibold truncate pr-3 leading-none flex items-center gap-1">
            {needsPhotos && (
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
            )}
            {hasNotes && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            )}
            <span className="truncate">{event.title}</span>
          </div>
        ) : isShortEvent ? (
          // 45 min events: title + time
          <div className="flex flex-col gap-0.5 h-full">
            <div className="text-xs font-body text-text-dark font-semibold truncate pr-3">
              {event.title}
            </div>
            <div className="text-xs font-body text-muted truncate">
              {formatTime(event.startTime)} – {formatTime(event.endTime)}
            </div>
          </div>
        ) : (
          // 60+ min events: title, time, type with icon
          <div className="flex flex-col gap-0.5 h-full">
            <div className="text-xs font-body text-text-dark font-semibold truncate pr-3">
              {event.title}
            </div>
            <div className="text-xs font-body text-muted truncate">
              {formatTime(event.startTime)} – {formatTime(event.endTime)}
            </div>
            <div className="text-xs font-body text-muted truncate flex items-center gap-1">
              {showIcon && TYPE_ICONS[event.type] && (
                <span style={{ color: eventType.borderColor }}>
                  {TYPE_ICONS[event.type]}
                </span>
              )}
              {eventType.label}
            </div>
          </div>
        )}
      </div>

      {/* Resize handle (bottom edge) */}
      {!disableResize && onResizeStart && (
        <div
          data-resize-handle
          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center z-30"
          onPointerDown={handleResizeStart}
          style={{ touchAction: 'none' }}
        >
          <div className="w-8 h-1 bg-secondary rounded-full" />
        </div>
      )}
    </div>
  )
}

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    assigneeId: PropTypes.string,
    date: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
    status: PropTypes.string,
    notes: PropTypes.string,
    earlierOpening: PropTypes.bool,
  }).isRequired,
  onClick: PropTypes.func,
  onLongPress: PropTypes.func,
  onResizeStart: PropTypes.func,
  disableInteraction: PropTypes.bool,
  disableResize: PropTypes.bool,
  earlierHighlightMode: PropTypes.bool,
}
