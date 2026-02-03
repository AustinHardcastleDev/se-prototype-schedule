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

export default function EventCard({ event, onClick, onLongPress, onResizeStart, disableInteraction = false, disableResize = false }) {
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
  const isTinyEvent = durationMinutes === 15 // 15-min events: title only
  const isShortEvent = durationMinutes < 45 // Events under 45 min: condensed layout
  const isJobType = JOB_TYPES.includes(event.type)
  const statusColor = isJobType ? STATUS_COLORS[event.status] : null

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

  return (
    <div
      className={`absolute left-0 right-0 bg-white rounded-md overflow-visible cursor-pointer hover:brightness-95 transition-all ${
        disableInteraction ? '' : 'touch-none'
      } ${isLongPressing ? 'brightness-90' : ''}`}
      style={{
        height: `${cardHeight}px`,
        borderLeft: `6px solid ${eventType.borderColor}`,
        minHeight: `${SLOT_HEIGHT}px`, // Minimum 15 minutes
      }}
      {...pointerHandlers}
    >
      <div className="relative h-full p-1.5">
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

        {/* Content */}
        {isTinyEvent ? (
          // 15-min events: title only, single line
          <div className="text-xs font-body text-text-dark font-semibold truncate pr-3">
            {event.title}
          </div>
        ) : isShortEvent ? (
          // Events < 45 min: condensed layout (title + time)
          <div className="flex flex-col gap-0.5 h-full">
            <div className="text-xs font-body text-text-dark font-semibold truncate pr-3">
              {event.title}
            </div>
            <div className="text-xs font-body text-muted truncate">
              {formatTime(event.startTime)} – {formatTime(event.endTime)}
            </div>
          </div>
        ) : (
          // Full layout for events >= 45 min (title, time, type)
          <div className="flex flex-col gap-0.5 h-full">
            <div className="text-xs font-body text-text-dark font-semibold truncate pr-3">
              {event.title}
            </div>
            <div className="text-xs font-body text-muted truncate">
              {formatTime(event.startTime)} – {formatTime(event.endTime)}
            </div>
            <div className="text-xs font-body text-muted truncate">
              {eventType.label}
            </div>
          </div>
        )}
      </div>

      {/* Resize handle (bottom edge) */}
      {!disableResize && onResizeStart && (
        <div
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
    assigneeId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
    status: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func,
  onLongPress: PropTypes.func,
  onResizeStart: PropTypes.func,
  disableInteraction: PropTypes.bool,
  disableResize: PropTypes.bool,
}
