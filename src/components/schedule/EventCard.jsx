import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { getEventTypeByKey, getMemberById } from '../../utils/dataAccess'

const SLOT_HEIGHT = 16 // pixels per 15-minute slot (must match TimeGrid.jsx)

// Job event types that show status indicators
const JOB_TYPES = ['job-occupied', 'job-vacant', 'callback-job']

// Status indicator colors
const STATUS_COLORS = {
  'open': null, // No indicator
  'closed-no-invoice': '#FACC15', // Bright yellow
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

// Status labels for tooltip display
const STATUS_LABELS = {
  'open': 'Open',
  'closed-no-invoice': 'Closed - No Invoice',
  'closed-invoiced': 'Closed - Invoiced',
}

export default function EventCard({ event, onClick, onLongPress, onResizeStart, disableInteraction = false, disableResize = false, compact = false }) {
  const eventType = getEventTypeByKey(event.type)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [isLongPressing, setIsLongPressing] = useState(false)

  // Hover tooltip state (desktop only)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const hoverTimerRef = useRef(null)
  const cardRef = useRef(null)

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
  const isTiny = durationMinutes <= 15 // title only, centered
  const showAddress = compact ? false : durationMinutes >= 45
  const showTime = compact ? durationMinutes >= 90 : durationMinutes >= 60
  const showType = compact ? false : durationMinutes >= 75
  const isJobType = JOB_TYPES.includes(event.type)
  const statusColor = isJobType ? STATUS_COLORS[event.status] : null

  // Determine if this is a past job missing photos
  const today = new Date().toISOString().split('T')[0]
  const isPast = event.date < today
  const isFutureOrPresent = event.date >= today
  const missingPhotos = isJobType && isPast && !event.photos

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

  // Earlier opening indicator
  const isEarlier = event.earlierOpening === true

  // Hover tooltip handlers (desktop only)
  const handleMouseEnter = useCallback(() => {
    // Only show on desktop (md+)
    if (window.innerWidth < 768) return
    hoverTimerRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        // Position to the right of the card, vertically centered
        setTooltipPos({
          top: rect.top,
          left: rect.right + 8,
          cardRight: rect.right,
          cardLeft: rect.left,
        })
        setShowTooltip(true)
      }
    }, 400)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setShowTooltip(false)
  }, [])

  // Cleanup hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  const assignee = getMemberById(event.assigneeId)

  return (
    <>
    {/* Hover tooltip (desktop only, rendered via portal) */}
    {showTooltip && createPortal(
      <div
        className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64 pointer-events-none animate-fadeIn"
        style={{
          top: `${tooltipPos.top}px`,
          // If tooltip would overflow right edge, show on left side instead
          ...(tooltipPos.left + 256 > window.innerWidth
            ? { right: `${window.innerWidth - tooltipPos.cardLeft + 8}px` }
            : { left: `${tooltipPos.left}px` }),
        }}
      >
        {/* Event type + title */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: eventType.color }} />
          <span className="text-xs font-body text-gray-500 uppercase">{eventType.label}</span>
        </div>
        <div className="text-sm font-body text-gray-900 font-semibold mb-2">{event.title}</div>

        {/* Time */}
        <div className="text-xs font-body text-gray-600 mb-1">
          {formatTime(event.startTime)} – {formatTime(event.endTime)}
        </div>

        {/* Address */}
        {event.address && (
          <div className="text-xs font-body text-gray-500 mb-1">{event.address}</div>
        )}

        {/* Assignee */}
        <div className="text-xs font-body text-gray-500 mb-1">
          {assignee ? assignee.name : <span className="text-rose-500 font-semibold">Unassigned</span>}
        </div>

        {/* Status */}
        {event.status && (
          <div className="text-xs font-body text-gray-500 mb-1">
            Status: {STATUS_LABELS[event.status] || event.status}
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs font-body text-blue-600 font-semibold mb-0.5">Prep Notes</div>
            <div className="text-xs font-body text-gray-600 line-clamp-3">{event.notes}</div>
          </div>
        )}
      </div>,
      document.body
    )}
    <div
      ref={cardRef}
      className={`absolute left-0 right-0 rounded-md cursor-pointer hover:brightness-95 transition-all touch-none ${
        isLongPressing ? 'brightness-90' : ''
      } ${
        missingPhotos && !isEarlier ? 'ring-1 ring-amber-400/60 ring-inset' : ''
      }`}
      style={{
        height: `${cardHeight}px`,
        backgroundColor: eventType.color,
        borderLeft: statusColor ? `${compact ? 6 : 10}px solid ${statusColor}` : 'none',
        minHeight: `${SLOT_HEIGHT}px`, // Minimum 15 minutes
        // Earlier opening: amber outline indicator
        ...(isEarlier ? {
          outline: '2px solid #F59E0B',
          outlineOffset: '-2px',
        } : {}),
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...pointerHandlers}
    >
      <div className={`relative h-full ${isTiny ? 'px-1.5 flex items-center' : 'p-1.5'}`}>
        {/* Missing photos indicator (top-right) */}
        {missingPhotos && !isTiny && (
          <div
            className="absolute top-0.5 right-0.5"
            title="Missing photos"
          >
            <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="14" rx="2"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
        )}

        {/* Has-notes indicator (top-right, below photos indicator) */}
        {hasNotes && !isTiny && (
          <div
            className={`absolute ${missingPhotos ? 'top-5' : 'top-0.5'} right-0.5`}
            title="Has prep notes"
          >
            <svg className="w-4 h-4 text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
          </div>
        )}

        {/* Content */}
        {isTiny ? (
          // 15 min: title only, centered
          <div className="text-xs font-body text-white font-semibold truncate pr-3 leading-none flex items-center gap-1">
            {missingPhotos && (
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            )}
            {hasNotes && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-200 flex-shrink-0" />
            )}
            <span className="truncate">{event.title}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 h-full">
            <div className="text-xs font-body text-white font-semibold truncate pr-3">
              {event.title}
            </div>
            {showAddress && event.address && (
              <div className="text-xs font-body text-white/70 truncate">
                {event.address}
              </div>
            )}
            {showTime && (
              <div className="text-xs font-body text-white/70 truncate">
                {formatTime(event.startTime)} – {formatTime(event.endTime)}
              </div>
            )}
            {showType && (
              <div className="text-xs font-body text-white/70 truncate flex items-center gap-1">
                {TYPE_ICONS[event.type] && (
                  <span className="text-white/80">
                    {TYPE_ICONS[event.type]}
                  </span>
                )}
                {eventType.label}
              </div>
            )}
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
    </>
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
  compact: PropTypes.bool,
}
