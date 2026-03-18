import PropTypes from 'prop-types'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { getEventTypeByKey } from '../../utils/dataAccess'

// Draggable card wrapper for virtual column events
// Uses a drag handle so the rest of the card supports touch scrolling
function DraggablePoolCard({ event, onEventClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: { event },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  const eventType = getEventTypeByKey(event.type)

  const formatTime = (timeStr) => {
    const [hour, minute] = timeStr.split(':').map(Number)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  // Format date as "Mon 3/16"
  const formatShortDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return `${dayNames[date.getDay()]} ${month}/${day}`
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onEventClick && onEventClick(event)}
      className="mx-1.5 mb-1.5"
    >
      <div
        className={`rounded-md p-2 cursor-pointer hover:brightness-95 transition-all relative ${
          event.assigneeId === null ? 'border border-dashed border-white/40' : ''
        }`}
        style={{ backgroundColor: eventType?.color || '#6B7280' }}
      >
        {/* Drag handle — only this area initiates drag */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-0 right-0 w-7 h-full flex items-center justify-center text-white/40 cursor-grab active:cursor-grabbing rounded-r-md"
          style={{ touchAction: 'none' }}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to assign"
        >
          <svg className="w-3 h-4" viewBox="0 0 12 20" fill="currentColor">
            <circle cx="3" cy="4" r="1.5" />
            <circle cx="9" cy="4" r="1.5" />
            <circle cx="3" cy="10" r="1.5" />
            <circle cx="9" cy="10" r="1.5" />
            <circle cx="3" cy="16" r="1.5" />
            <circle cx="9" cy="16" r="1.5" />
          </svg>
        </div>

        {/* Title */}
        <div className="text-xs font-body text-white font-semibold truncate pr-7">
          {event.title}
        </div>

        {/* Date */}
        <div className="text-[10px] font-body text-white/70 mt-0.5">
          {formatShortDate(event.date)}
        </div>

        {/* Time range */}
        <div className="text-[10px] font-body text-white/70">
          {formatTime(event.startTime)} – {formatTime(event.endTime)}
        </div>

        {/* Address */}
        {event.address && (
          <div className="text-[10px] font-body text-white/60 truncate mt-0.5 pr-7">
            {event.address}
          </div>
        )}

        {/* Earlier opening badge */}
        {event.earlierOpening && (
          <div className="mt-1 inline-flex items-center gap-1 bg-amber-500/30 rounded px-1 py-0.5">
            <span className="text-[9px] font-body text-amber-200 font-semibold">Earlier Opening</span>
          </div>
        )}
      </div>
    </div>
  )
}

DraggablePoolCard.propTypes = {
  event: PropTypes.object.isRequired,
  onEventClick: PropTypes.func,
  isDragging: PropTypes.bool,
}

export default function VirtualColumnCardList({ events, onEventClick, activeId, emptyMessage }) {
  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs font-body text-gray-400 text-center">
          {emptyMessage || 'No events'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-200 pt-1.5 pb-4">
      {events.map((event) => (
        <DraggablePoolCard
          key={event.id}
          event={event}
          onEventClick={onEventClick}
          isDragging={activeId === event.id}
        />
      ))}
    </div>
  )
}

VirtualColumnCardList.propTypes = {
  events: PropTypes.array.isRequired,
  onEventClick: PropTypes.func,
  activeId: PropTypes.string,
  emptyMessage: PropTypes.string,
}
