import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { format, addDays } from 'date-fns'
import { DndContext, DragOverlay, rectIntersection, useDroppable } from '@dnd-kit/core'
import { toast } from 'react-hot-toast'
import { getAllMembers } from '../../utils/dataAccess'
import EventCard from './EventCard'
import DraggableEvent from './DraggableEvent'

const SLOT_HEIGHT = 16 // pixels per 15-minute slot
const SLOTS_PER_HOUR = 4
const START_HOUR = 6 // 6 AM
const END_HOUR = 20 // 8 PM
const TOTAL_HOURS = END_HOUR - START_HOUR
const TOTAL_SLOTS = TOTAL_HOURS * SLOTS_PER_HOUR

// Helper component for droppable event column
function DroppableEventColumn({
  memberId,
  date,
  memberIndex,
  events,
  activeId,
  activeEvent,
  dragOverColumn,
  dragOverDate,
  dragOverSlot,
  onColumnClick,
  onEventClick,
  calculateEventOffset
}) {
  const { setNodeRef } = useDroppable({
    id: `${memberId}-${date}`,
    data: { memberId, date },
  })

  const isColumnOver = dragOverColumn === memberId && dragOverDate === date

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 relative px-1 cursor-pointer transition-colors ${
        isColumnOver ? 'bg-accent/10' : ''
      }`}
      style={{ borderLeft: memberIndex === 0 ? 'none' : '1px solid #2A2A2A' }}
      onClick={onColumnClick}
    >
      {/* Render events for this member on this day */}
      {events.map((event) => {
        const topOffset = calculateEventOffset(event.startTime)
        const isDragging = activeId === event.id

        return (
          <div
            key={event.id}
            data-event-card
            className="absolute left-0 right-0"
            style={{ top: `${topOffset}px` }}
          >
            <DraggableEvent
              event={event}
              onEventClick={onEventClick}
              isDragging={isDragging}
            />
          </div>
        )
      })}

      {/* Drag preview ghost - show where event will land in TARGET column */}
      {dragOverSlot !== null && activeEvent && isColumnOver && (
        <div
          className="absolute left-0 right-0 pointer-events-none z-20 border-2 border-dashed border-accent bg-accent/10"
          style={{
            top: `${dragOverSlot * SLOT_HEIGHT}px`,
            height: `${calculateEventOffset(activeEvent.endTime) - calculateEventOffset(activeEvent.startTime)}px`,
          }}
        >
          <div className="p-1.5 text-xs text-accent font-semibold truncate">
            {activeEvent.title}
          </div>
        </div>
      )}
    </div>
  )
}

DroppableEventColumn.propTypes = {
  memberId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  memberIndex: PropTypes.number.isRequired,
  events: PropTypes.array.isRequired,
  activeId: PropTypes.string,
  activeEvent: PropTypes.object,
  dragOverColumn: PropTypes.string,
  dragOverDate: PropTypes.string,
  dragOverSlot: PropTypes.number,
  onColumnClick: PropTypes.func.isRequired,
  onEventClick: PropTypes.func.isRequired,
  calculateEventOffset: PropTypes.func.isRequired,
}

export default function DesktopTimeGrid({ selectedDate, events, onDateChange, onSlotClick, onEventClick, onEventUpdate }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const dayRefs = useRef({}) // Store refs to each day section
  const scrollContainerRef = useRef(null) // Ref to the scrollable container
  const [activeId, setActiveId] = useState(null) // Track actively dragged event
  const [dragOverSlot, setDragOverSlot] = useState(null) // Track which slot is being dragged over
  const [dragOverColumn, setDragOverColumn] = useState(null) // Track which column (memberId) is being dragged over
  const [dragOverDate, setDragOverDate] = useState(null) // Track which date section is being dragged over

  // Get all team members for columns
  const teamMembers = getAllMembers()

  // Generate array of dates to render (selected date + 5 more days)
  const daysToRender = []
  for (let i = 0; i < 6; i++) {
    daysToRender.push(addDays(selectedDate, i))
  }

  // IntersectionObserver to detect which day is in view
  useEffect(() => {
    if (!onDateChange) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the day header that is most visible at the top of the viewport
        const visibleEntry = entries.find(
          (entry) => entry.isIntersecting && entry.intersectionRatio > 0.5
        )

        if (visibleEntry) {
          const dateStr = visibleEntry.target.dataset.date
          if (dateStr) {
            const newDate = new Date(dateStr)
            // Only update if it's a different day
            if (format(newDate, 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')) {
              onDateChange(newDate)
            }
          }
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: [0, 0.5, 1],
        rootMargin: '-10% 0px -80% 0px', // Trigger when day header is near top
      }
    )

    // Observe all day headers
    Object.values(dayRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [selectedDate, onDateChange])

  // Scroll to selected date when it changes externally (from date picker)
  useEffect(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    const dayRef = dayRefs.current[dateKey]

    if (dayRef && scrollContainerRef.current) {
      dayRef.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedDate])

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

  // Calculate event vertical position based on start time
  const calculateEventOffset = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const slotsFromStart = (hours - START_HOUR) * SLOTS_PER_HOUR + minutes / 15
    return slotsFromStart * SLOT_HEIGHT
  }

  // Filter events for a specific team member on a specific date
  const getEventsForMember = (memberId, date) => {
    const formattedDate = format(date, 'yyyy-MM-dd')
    return events.filter(
      (event) => event.assigneeId === memberId && event.date === formattedDate
    )
  }

  // Helper: Check if two events overlap
  const eventsOverlap = (event1Start, event1End, event2Start, event2End) => {
    return event1Start < event2End && event1End > event2Start
  }

  // Helper: Check if a new time conflicts with existing events
  const hasConflict = (eventId, newStartTime, newEndTime, newDate, newAssigneeId) => {
    return events.some((existingEvent) => {
      // Don't check against the same event
      if (existingEvent.id === eventId) return false

      // Only check events on the same date for the same person
      if (existingEvent.date !== newDate || existingEvent.assigneeId !== newAssigneeId) {
        return false
      }

      // Check if time ranges overlap
      return eventsOverlap(newStartTime, newEndTime, existingEvent.startTime, existingEvent.endTime)
    })
  }

  // Helper: Round time to nearest 15-minute increment
  const roundToNearestSlot = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes
    const roundedMinutes = Math.round(totalMinutes / 15) * 15
    const roundedHours = Math.floor(roundedMinutes / 60)
    const roundedMins = roundedMinutes % 60
    return `${roundedHours.toString().padStart(2, '0')}:${roundedMins.toString().padStart(2, '0')}`
  }

  // Calculate time from Y position within grid
  const calculateTimeFromY = (yPosition) => {
    const slotIndex = Math.floor(yPosition / SLOT_HEIGHT)
    const totalMinutes = slotIndex * 15
    const hours = Math.floor(totalMinutes / 60) + START_HOUR
    const minutes = totalMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Handle click on empty time slot in a column
  const handleColumnClick = (e, memberId, dayDate) => {
    // Don't trigger if clicking on an event card
    if (e.target.closest('[data-event-card]')) return

    const gridElement = e.currentTarget
    const rect = gridElement.getBoundingClientRect()
    const yPosition = e.clientY - rect.top

    // Calculate start time from click position
    const startTime = calculateTimeFromY(yPosition)

    // Default end time: start + 1 hour
    const [startHour, startMin] = startTime.split(':').map(Number)
    let endHour = startHour + 1
    let endMin = startMin

    // Cap at END_HOUR (8 PM)
    if (endHour > END_HOUR || (endHour === END_HOUR && endMin > 0)) {
      endHour = END_HOUR
      endMin = 0
    }

    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`

    if (onSlotClick) {
      onSlotClick({
        memberId,
        date: format(dayDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
      })
    }
  }

  // Drag handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragMove = (event) => {
    const { delta, over } = event

    if (!activeId) return

    // Find the dragged event from all events
    const draggedEvent = events.find((e) => e.id === activeId)
    if (!draggedEvent) return

    // Calculate which slot we're hovering over based on Y delta
    const originalOffset = calculateEventOffset(draggedEvent.startTime)
    const newOffset = originalOffset + delta.y
    const newSlot = Math.floor(newOffset / SLOT_HEIGHT)

    // Clamp to valid range
    const clampedSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, newSlot))
    setDragOverSlot(clampedSlot)

    // Detect which column and date we're over
    if (over && over.data.current) {
      const { memberId, date } = over.data.current
      console.log('[DragMove] Over column:', memberId, 'date:', date)
      setDragOverColumn(memberId)
      setDragOverDate(date)
    } else {
      console.log('[DragMove] Not over any droppable')
      setDragOverColumn(null)
      setDragOverDate(null)
    }
  }

  const handleDragEnd = (event) => {
    const { active, delta, over } = event

    const prevDragOverColumn = dragOverColumn
    const prevDragOverDate = dragOverDate

    console.log('[DragEnd] over:', over?.id, 'over.data:', over?.data?.current)
    console.log('[DragEnd] prevDragOverColumn:', prevDragOverColumn, 'prevDragOverDate:', prevDragOverDate)

    setActiveId(null)
    setDragOverSlot(null)
    setDragOverColumn(null)
    setDragOverDate(null)

    const draggedEvent = events.find((e) => e.id === active.id)
    if (!draggedEvent) return

    // Determine target column and date
    let targetAssigneeId = draggedEvent.assigneeId
    let targetDate = draggedEvent.date

    // Check if dropped on a different column
    if (over && over.data.current) {
      targetAssigneeId = over.data.current.memberId
      targetDate = over.data.current.date
      console.log('[DragEnd] Detected drop on column:', targetAssigneeId)
    } else if (prevDragOverColumn && prevDragOverDate) {
      targetAssigneeId = prevDragOverColumn
      targetDate = prevDragOverDate
      console.log('[DragEnd] Using prevDragOverColumn:', targetAssigneeId)
    } else {
      console.log('[DragEnd] No target column detected, staying in same column')
    }

    // Calculate new time based on drag delta
    const originalOffset = calculateEventOffset(draggedEvent.startTime)
    const newOffset = originalOffset + delta.y
    const newSlot = Math.floor(newOffset / SLOT_HEIGHT)

    // Clamp to valid range
    const clampedSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, newSlot))

    // Calculate new start time
    const totalMinutes = clampedSlot * 15
    const newHours = Math.floor(totalMinutes / 60) + START_HOUR
    const newMinutes = totalMinutes % 60
    let newStartTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`

    // Round to nearest 15-minute slot
    newStartTime = roundToNearestSlot(newStartTime)

    // Calculate new end time (preserve duration)
    const [oldStartHour, oldStartMin] = draggedEvent.startTime.split(':').map(Number)
    const [oldEndHour, oldEndMin] = draggedEvent.endTime.split(':').map(Number)
    const durationMinutes = (oldEndHour * 60 + oldEndMin) - (oldStartHour * 60 + oldStartMin)

    const [newStartHour, newStartMin] = newStartTime.split(':').map(Number)
    const endTotalMinutes = (newStartHour * 60 + newStartMin) + durationMinutes
    const newEndHour = Math.floor(endTotalMinutes / 60)
    const newEndMin = endTotalMinutes % 60
    const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`

    // Check if new time is out of bounds
    if (newStartHour < START_HOUR || newEndHour > END_HOUR) {
      toast.error('Event cannot be moved outside of 6 AM - 8 PM')
      return
    }

    // Check for conflicts with TARGET assignee's events (critical for cross-column drops)
    if (hasConflict(draggedEvent.id, newStartTime, newEndTime, targetDate, targetAssigneeId)) {
      const targetMember = teamMembers.find(m => m.id === targetAssigneeId)
      const memberName = targetMember ? targetMember.name : 'this person'
      toast.error(`Cannot move event - time slot conflicts with ${memberName}'s schedule`)
      return
    }

    // Update the event with new assignee, date, and time
    const updatedEvent = {
      ...draggedEvent,
      assigneeId: targetAssigneeId,
      date: targetDate,
      startTime: newStartTime,
      endTime: newEndTime,
    }

    // Show success message if reassigned to different person
    if (targetAssigneeId !== draggedEvent.assigneeId) {
      const targetMember = teamMembers.find(m => m.id === targetAssigneeId)
      const memberName = targetMember ? targetMember.name : 'team member'
      toast.success(`Event reassigned to ${memberName}`)
    }

    if (onEventUpdate) {
      onEventUpdate(updatedEvent)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setDragOverSlot(null)
    setDragOverColumn(null)
    setDragOverDate(null)
  }

  // Get the active event being dragged for the overlay
  const activeEvent = activeId ? events.find((e) => e.id === activeId) : null

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      collisionDetection={rectIntersection}
    >
      <div
        ref={scrollContainerRef}
        className="hidden md:flex md:flex-col flex-1 overflow-y-auto bg-charcoal"
      >
      {/* Column Headers - Sticky at very top */}
      <div className="sticky top-0 z-40 bg-charcoal border-b border-secondary">
        <div className="flex">
          {/* Time label column header (spacer) */}
          <div className="w-16 flex-shrink-0" />

          {/* Team member column headers */}
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex-1 px-4 py-3 border-l border-secondary"
            >
              <div className="flex items-center gap-2">
                {/* Avatar/Initials */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-body text-xs font-semibold"
                  style={{ backgroundColor: member.color }}
                >
                  {member.avatar}
                </div>
                {/* Name */}
                <span className="font-body text-sm text-text-light font-semibold">
                  {member.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-day grid - each day is a separate section */}
      {daysToRender.map((dayDate) => {
        const dateKey = format(dayDate, 'yyyy-MM-dd')
        const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey

        return (
          <div key={dateKey}>
            {/* Day Separator Header - Sticky within scroll */}
            <div
              ref={(el) => (dayRefs.current[dateKey] = el)}
              data-date={dateKey}
              className="sticky top-14 z-30 bg-charcoal border-b-2 border-accent px-4 py-2"
            >
              <h2 className="font-heading text-xl uppercase text-text-light">
                {format(dayDate, 'EEEE, MMMM d, yyyy')}
                {isToday && (
                  <span className="ml-3 text-accent text-sm font-body">Today</span>
                )}
              </h2>
            </div>

            {/* Grid Body for this day */}
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

                    {/* Grid lines for each column */}
                    <div className="flex ml-16">
                      {teamMembers.map((member, memberIndex) => (
                        <div
                          key={member.id}
                          className="flex-1 relative"
                          style={{ borderLeft: memberIndex === 0 ? 'none' : '1px solid #2A2A2A' }}
                        >
                          {/* Hour line (heavier) */}
                          <div className="absolute left-0 right-0 border-t border-secondary" />

                          {/* 15-minute grid lines (lighter) */}
                          {index < timeLabels.length - 1 && (
                            <>
                              <div
                                className="absolute left-0 right-0 border-t border-secondary/30"
                                style={{ top: `${SLOT_HEIGHT}px` }}
                              />
                              <div
                                className="absolute left-0 right-0 border-t border-secondary/30"
                                style={{ top: `${SLOT_HEIGHT * 2}px` }}
                              />
                              <div
                                className="absolute left-0 right-0 border-t border-secondary/30"
                                style={{ top: `${SLOT_HEIGHT * 3}px` }}
                              />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Current time indicator - only show for today */}
              {isToday && currentTimeOffset !== null && (
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

              {/* Event rendering areas - one per column */}
              <div className="absolute left-16 right-0 top-0 bottom-0 flex">
                {teamMembers.map((member, memberIndex) => {
                  const memberEvents = getEventsForMember(member.id, dayDate)

                  return (
                    <DroppableEventColumn
                      key={member.id}
                      memberId={member.id}
                      date={dateKey}
                      memberIndex={memberIndex}
                      events={memberEvents}
                      activeId={activeId}
                      activeEvent={activeEvent}
                      dragOverColumn={dragOverColumn}
                      dragOverDate={dragOverDate}
                      dragOverSlot={dragOverSlot}
                      onColumnClick={(e) => handleColumnClick(e, member.id, dayDate)}
                      onEventClick={onEventClick}
                      calculateEventOffset={calculateEventOffset}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
      </div>

      {/* Drag overlay - shows dragged event following cursor */}
      <DragOverlay dropAnimation={null}>
        {activeEvent ? <EventCard event={activeEvent} disableInteraction={true} disableResize={true} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

DesktopTimeGrid.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      assigneeId: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
      status: PropTypes.string,
    })
  ).isRequired,
  onDateChange: PropTypes.func,
  onSlotClick: PropTypes.func,
  onEventClick: PropTypes.func,
  onEventUpdate: PropTypes.func,
}
