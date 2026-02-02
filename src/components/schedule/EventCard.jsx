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

export default function EventCard({ event, onClick }) {
  const eventType = getEventTypeByKey(event.type)

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
  const isShortEvent = durationMinutes < 30 // Condensed layout for events under 30 min
  const isJobType = JOB_TYPES.includes(event.type)
  const statusColor = isJobType ? STATUS_COLORS[event.status] : null

  return (
    <div
      className="absolute left-0 right-0 bg-white rounded-md overflow-hidden cursor-pointer hover:brightness-95 transition-all"
      style={{
        height: `${cardHeight}px`,
        borderLeft: `4px solid ${eventType.borderColor}`,
        minHeight: `${SLOT_HEIGHT}px`, // Minimum 15 minutes
      }}
      onClick={onClick}
    >
      <div className="relative h-full p-1.5">
        {/* Status indicator dot (top-right) */}
        {statusColor && (
          <div
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
        )}

        {/* Content */}
        {isShortEvent ? (
          // Condensed layout for events < 30 min: title only
          <div className="text-xs font-body text-text-dark font-semibold truncate pr-3">
            {event.title}
          </div>
        ) : (
          // Full layout for events >= 30 min
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
}
