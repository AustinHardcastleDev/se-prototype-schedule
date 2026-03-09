import PropTypes from 'prop-types'
import { getEventTypeByKey } from '../../utils/dataAccess'

export default function TechDayTimeline({ events, highlightEventId }) {
  if (events.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-gray-400 font-body">
        No jobs scheduled
      </div>
    )
  }

  const sorted = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <div className="flex flex-col gap-1 px-4 py-2">
      {sorted.map(event => {
        const eventType = getEventTypeByKey(event.type)
        const isHighlighted = event.id === highlightEventId

        return (
          <div
            key={event.id}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-body transition-all ${
              isHighlighted
                ? 'ring-2 ring-accent bg-accent/5'
                : 'hover:bg-gray-50'
            }`}
          >
            <div
              className="w-1 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: eventType?.color || '#6B7280' }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800 truncate">{event.title}</div>
              <div className="text-gray-400">{event.startTime} - {event.endTime}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

TechDayTimeline.propTypes = {
  events: PropTypes.array.isRequired,
  highlightEventId: PropTypes.string,
}
