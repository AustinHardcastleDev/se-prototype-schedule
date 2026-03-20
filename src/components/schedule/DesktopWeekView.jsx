import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { getAllMembers, getEventTypeByKey } from '../../utils/dataAccess'

const START_HOUR = 6
const END_HOUR = 20
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60 // 840

export default function DesktopWeekView({ selectedDate, events, onDateChange, onEventClick, roleFilter = 'all', hiddenMembers }) {
  const [tooltip, setTooltip] = useState(null)

  const allMembers = getAllMembers()
  const filteredMembers = (roleFilter === 'all'
    ? allMembers
    : allMembers.filter(m => m.role === roleFilter)
  ).filter(m => !hiddenMembers?.has(m.id))

  // Get Monday of the selected week
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekdaysOnly = weekDays.slice(0, 5)
  const weekendDays = weekDays.slice(5)

  // Group events by date+member for fast lookup
  const eventMap = useMemo(() => {
    const map = {}
    events.forEach(evt => {
      if (!evt.assigneeId || !evt.startTime || !evt.endTime) return
      const key = `${evt.date}::${evt.assigneeId}`
      if (!map[key]) map[key] = []
      map[key].push(evt)
    })
    // Sort each bucket by start time
    Object.values(map).forEach(arr => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)))
    return map
  }, [events])

  const getEventsForCell = (date, memberId) => {
    const key = `${format(date, 'yyyy-MM-dd')}::${memberId}`
    return eventMap[key] || []
  }

  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h > 12 ? h - 12 : h || 12
    return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }

  const today = new Date()

  // Check if any weekend events exist
  const hasWeekendEvents = weekendDays.some(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return filteredMembers.some(m => {
      const key = `${dateStr}::${m.id}`
      return eventMap[key]?.length > 0
    })
  })

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white overflow-auto">
      {/* Content wrapper for horizontal scroll */}
      <div style={{ minWidth: `${100 + filteredMembers.length * 140}px` }}>
        {/* Column headers - sticky */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-300">
          <div className="flex">
            {/* Day label spacer */}
            <div className="w-[100px] flex-shrink-0 bg-white sticky left-0 z-10" />
            {/* Member headers */}
            <div className="flex flex-1">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="px-2 py-2.5 border-l border-gray-200 flex-shrink-0 flex-1"
                  style={{ minWidth: '140px' }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white font-body text-[10px] font-semibold flex-shrink-0"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.avatar}
                    </div>
                    <span className="font-body text-xs text-gray-700 font-semibold truncate">
                      {member.name.split(' ')[0]} {member.name.split(' ')[1]?.[0]}.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekday rows */}
        {weekdaysOnly.map((day) => {
          const isToday = isSameDay(day, today)
          const dateStr = format(day, 'yyyy-MM-dd')

          return (
            <div
              key={dateStr}
              className={`flex border-b border-gray-200 ${isToday ? 'bg-accent/[0.04]' : ''}`}
              style={{ minHeight: '120px' }}
            >
              {/* Day label - sticky left */}
              <div
                className={`w-[100px] flex-shrink-0 sticky left-0 z-10 px-3 py-2 border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isToday ? 'bg-accent/[0.06]' : 'bg-gray-50'
                }`}
                onClick={() => onDateChange?.(day)}
              >
                <div className="font-body text-xs font-bold text-gray-500 uppercase">
                  {format(day, 'EEE')}
                </div>
                <div className={`font-body text-lg font-bold ${isToday ? 'text-accent' : 'text-gray-800'}`}>
                  {format(day, 'd')}
                </div>
                <div className="font-body text-[10px] text-gray-400 uppercase">
                  {format(day, 'MMM')}
                </div>
              </div>

              {/* Member cells */}
              <div className="flex flex-1">
                {filteredMembers.map((member) => {
                  const cellEvents = getEventsForCell(day, member.id)

                  return (
                    <div
                      key={member.id}
                      className="relative border-l border-gray-200 flex-shrink-0 flex-1"
                      style={{ minWidth: '140px', minHeight: '120px' }}
                    >
                      {/* Time scale background lines - subtle hour markers */}
                      {[0.25, 0.5, 0.75].map((frac) => (
                        <div
                          key={frac}
                          className="absolute left-0 right-0 border-t border-gray-100"
                          style={{ top: `${frac * 100}%` }}
                        />
                      ))}

                      {/* Event blocks */}
                      {cellEvents.map((evt) => {
                        const startMin = parseTime(evt.startTime)
                        const endMin = parseTime(evt.endTime)
                        const topPct = ((startMin - START_HOUR * 60) / TOTAL_MINUTES) * 100
                        const heightPct = ((endMin - startMin) / TOTAL_MINUTES) * 100
                        const eventType = getEventTypeByKey(evt.type)
                        const color = eventType?.color || '#6B7280'

                        return (
                          <div
                            key={evt.id}
                            className="absolute left-1 right-1 rounded-sm cursor-pointer transition-opacity hover:opacity-80"
                            style={{
                              top: `${topPct}%`,
                              height: `${Math.max(heightPct, 1.5)}%`,
                              backgroundColor: color,
                              minHeight: '3px',
                            }}
                            onClick={() => onEventClick?.(evt)}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setTooltip({
                                id: evt.id,
                                title: evt.title,
                                time: `${formatTime(evt.startTime)} – ${formatTime(evt.endTime)}`,
                                type: eventType?.label || evt.type,
                                x: rect.left + rect.width / 2,
                                y: rect.top - 4,
                              })
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          />
                        )
                      })}

                      {/* Empty state - subtle indicator */}
                      {cellEvents.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-gray-200" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Weekend rows - collapsed, subtly shaded */}
        {hasWeekendEvents && weekendDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')

          return (
            <div
              key={dateStr}
              className="flex border-b border-gray-200 bg-gray-50/60"
              style={{ minHeight: '48px' }}
            >
              <div
                className="w-[100px] flex-shrink-0 sticky left-0 z-10 px-3 py-1.5 border-r border-gray-200 bg-gray-100/80 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onDateChange?.(day)}
              >
                <div className="font-body text-[10px] font-bold text-gray-400 uppercase">
                  {format(day, 'EEE')}
                </div>
                <div className="font-body text-sm font-bold text-gray-500">
                  {format(day, 'd')}
                </div>
              </div>
              <div className="flex flex-1">
                {filteredMembers.map((member) => {
                  const cellEvents = getEventsForCell(day, member.id)
                  return (
                    <div
                      key={member.id}
                      className="relative border-l border-gray-200 flex-shrink-0 flex-1"
                      style={{ minWidth: '140px', minHeight: '48px' }}
                    >
                      {cellEvents.map((evt) => {
                        const startMin = parseTime(evt.startTime)
                        const endMin = parseTime(evt.endTime)
                        const topPct = ((startMin - START_HOUR * 60) / TOTAL_MINUTES) * 100
                        const heightPct = ((endMin - startMin) / TOTAL_MINUTES) * 100
                        const eventType = getEventTypeByKey(evt.type)
                        const color = eventType?.color || '#6B7280'

                        return (
                          <div
                            key={evt.id}
                            className="absolute left-1 right-1 rounded-sm cursor-pointer transition-opacity hover:opacity-80"
                            style={{
                              top: `${topPct}%`,
                              height: `${Math.max(heightPct, 3)}%`,
                              backgroundColor: color,
                              minHeight: '2px',
                            }}
                            onClick={() => onEventClick?.(evt)}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setTooltip({
                                id: evt.id,
                                title: evt.title,
                                time: `${formatTime(evt.startTime)} – ${formatTime(evt.endTime)}`,
                                type: eventType?.label || evt.type,
                                x: rect.left + rect.width / 2,
                                y: rect.top - 4,
                              })
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[2000] pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-charcoal text-white rounded-lg px-3 py-2 shadow-xl text-xs font-body max-w-[200px]">
            <div className="font-semibold truncate">{tooltip.title}</div>
            <div className="text-white/70 mt-0.5">{tooltip.time}</div>
            <div className="text-white/50 mt-0.5">{tooltip.type}</div>
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-charcoal" />
          </div>
        </div>
      )}
    </div>
  )
}

DesktopWeekView.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  events: PropTypes.array.isRequired,
  onDateChange: PropTypes.func,
  onEventClick: PropTypes.func,
  roleFilter: PropTypes.oneOf(['all', 'tech', 'sales']),
  hiddenMembers: PropTypes.instanceOf(Set),
}
