import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { format } from 'date-fns'
import EventCard from './EventCard'

const SLOT_HEIGHT = 16 // pixels per 15-minute slot
const SLOTS_PER_HOUR = 4
const START_HOUR = 6 // 6 AM
const END_HOUR = 20 // 8 PM
const TOTAL_HOURS = END_HOUR - START_HOUR
const TOTAL_SLOTS = TOTAL_HOURS * SLOTS_PER_HOUR

export default function TimeGrid({ selectedDate, selectedMember, events: allEvents }) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every 60 seconds

    return () => clearInterval(interval)
  }, [])

  // Generate time labels for each hour
  const timeLabels = []
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    const date = new Date()
    date.setHours(hour, 0, 0, 0)
    timeLabels.push({
      hour,
      label: format(date, 'h a'),
    })
  }

  // Calculate current time indicator position
  const getCurrentTimeOffset = () => {
    const now = currentTime
    const hours = now.getHours()
    const minutes = now.getMinutes()

    // Only show if within visible range
    if (hours < START_HOUR || hours > END_HOUR) {
      return null
    }

    const slotsFromStart = (hours - START_HOUR) * SLOTS_PER_HOUR + minutes / 15
    return slotsFromStart * SLOT_HEIGHT
  }

  const currentTimeOffset = getCurrentTimeOffset()

  // Format selected date as YYYY-MM-DD for filtering
  const formattedDate = format(selectedDate, 'yyyy-MM-dd')

  // Filter events for selected member and date
  const events = allEvents.filter(
    (event) => event.assigneeId === selectedMember.id && event.date === formattedDate
  )

  // Helper: Calculate top offset for an event
  const calculateEventOffset = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const slotsFromStart = (hours - START_HOUR) * SLOTS_PER_HOUR + minutes / 15
    return slotsFromStart * SLOT_HEIGHT
  }

  return (
    <div className="flex-1 overflow-y-auto bg-charcoal relative">
      <div className="relative" style={{ height: `${TOTAL_SLOTS * SLOT_HEIGHT}px` }}>
        {/* Time labels and grid lines */}
        {timeLabels.map((time, index) => {
          const topPosition = index * SLOTS_PER_HOUR * SLOT_HEIGHT

          return (
            <div key={time.hour} className="absolute left-0 right-0" style={{ top: `${topPosition}px` }}>
              {/* Hour label */}
              <div className="absolute left-0 w-16 text-right pr-2 -translate-y-2">
                <span className="text-xs font-body text-muted uppercase">{time.label}</span>
              </div>

              {/* Hour line (heavier) */}
              <div className="absolute left-16 right-0 border-t border-secondary" />

              {/* 15-minute grid lines (lighter) */}
              {index < timeLabels.length - 1 && (
                <>
                  <div
                    className="absolute left-16 right-0 border-t border-secondary/30"
                    style={{ top: `${SLOT_HEIGHT}px` }}
                  />
                  <div
                    className="absolute left-16 right-0 border-t border-secondary/30"
                    style={{ top: `${SLOT_HEIGHT * 2}px` }}
                  />
                  <div
                    className="absolute left-16 right-0 border-t border-secondary/30"
                    style={{ top: `${SLOT_HEIGHT * 3}px` }}
                  />
                </>
              )}
            </div>
          )
        })}

        {/* Current time indicator */}
        {currentTimeOffset !== null && (
          <div
            className="absolute left-16 right-0 z-10"
            style={{ top: `${currentTimeOffset}px` }}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div className="flex-1 h-0.5 bg-accent" />
            </div>
          </div>
        )}

        {/* Event rendering area */}
        <div className="absolute left-16 right-0 top-0 bottom-0 px-1">
          {events.length === 0 ? (
            // Empty state
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-4">
                <p className="text-muted font-body text-sm">
                  No events scheduled for {selectedMember.name} on{' '}
                  {format(selectedDate, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ) : (
            // Render events
            events.map((event) => (
              <div
                key={event.id}
                className="absolute left-0 right-0"
                style={{ top: `${calculateEventOffset(event.startTime)}px` }}
              >
                <EventCard event={event} onClick={() => console.log('Event clicked:', event)} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

TimeGrid.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  selectedMember: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      assigneeId: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
}
