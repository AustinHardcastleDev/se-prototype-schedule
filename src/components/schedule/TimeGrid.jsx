import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { format } from 'date-fns'
import { DndContext, DragOverlay, pointerWithin, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Toaster, toast } from 'react-hot-toast'
import DraggableEvent from './DraggableEvent'
import EventCard from './EventCard'

const SLOT_HEIGHT = 16 // pixels per 15-minute slot
const SLOTS_PER_HOUR = 4
const START_HOUR = 6 // 6 AM
const END_HOUR = 20 // 8 PM
const TOTAL_HOURS = END_HOUR - START_HOUR
const TOTAL_SLOTS = TOTAL_HOURS * SLOTS_PER_HOUR

export default function TimeGrid({ selectedDate, selectedMember, events: allEvents, onEventClick, onLongPressSlot, onEventUpdate }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [longPressSlot, setLongPressSlot] = useState(null) // Track which slot is being long-pressed
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [dragOverSlot, setDragOverSlot] = useState(null) // Track which slot is being dragged over

  // Resize state
  const [resizingEvent, setResizingEvent] = useState(null)
  const [resizePreviewEndTime, setResizePreviewEndTime] = useState(null)
  const resizePreviewEndTimeRef = useRef(null)

  // Configure sensors for both mouse and touch
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // 5px movement required to start drag
    },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200, // 200ms hold before drag starts
      tolerance: 5, // 5px movement tolerance during delay
    },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

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

  // Helper: Calculate time from Y position
  const calculateTimeFromY = (yPosition) => {
    const slots = Math.floor(yPosition / SLOT_HEIGHT)
    const totalMinutes = slots * 15
    const hours = Math.floor(totalMinutes / 60) + START_HOUR
    const minutes = totalMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Long-press handlers for empty slots
  const handlePointerDown = (e) => {
    // Only handle if clicking on the event area background (not an event card)
    if (e.target.closest('[data-event-card]')) return

    const rect = e.currentTarget.getBoundingClientRect()
    const yPosition = e.clientY - rect.top
    const slotIndex = Math.floor(yPosition / SLOT_HEIGHT)

    setLongPressSlot(slotIndex)

    const timer = setTimeout(() => {
      // Long press detected - trigger callback
      const startTime = calculateTimeFromY(yPosition)
      const [startHour, startMin] = startTime.split(':').map(Number)
      const endMinutes = startMin + 15
      const endHour = startHour + Math.floor(endMinutes / 60)
      const endMin = endMinutes % 60
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`

      if (onLongPressSlot) {
        onLongPressSlot({ startTime, endTime })
      }

      setLongPressSlot(null)
    }, 500) // 500ms for long press

    setLongPressTimer(timer)
  }

  const handlePointerUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setLongPressSlot(null)
  }

  const handlePointerLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setLongPressSlot(null)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [longPressTimer])

  // Helper: Check if two events overlap
  const eventsOverlap = (event1Start, event1End, event2Start, event2End) => {
    return event1Start < event2End && event1End > event2Start
  }

  // Helper: Check if a new time conflicts with existing events
  const hasConflict = (eventId, newStartTime, newEndTime, newDate) => {
    return events.some((existingEvent) => {
      // Don't check against the same event
      if (existingEvent.id === eventId) return false

      // Only check events on the same date for the same person
      if (existingEvent.date !== newDate || existingEvent.assigneeId !== selectedMember.id) {
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

  // Drag handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragMove = (event) => {
    const { delta } = event

    if (!activeId) return

    // Calculate which slot we're hovering over based on Y delta
    const draggedEvent = events.find((e) => e.id === activeId)
    if (!draggedEvent) return

    const originalOffset = calculateEventOffset(draggedEvent.startTime)
    const newOffset = originalOffset + delta.y
    const newSlot = Math.floor(newOffset / SLOT_HEIGHT)

    // Clamp to valid range
    const clampedSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, newSlot))
    setDragOverSlot(clampedSlot)
  }

  const handleDragEnd = (event) => {
    const { active, delta } = event

    setActiveId(null)
    setDragOverSlot(null)

    if (!delta.y) return // No vertical movement

    const draggedEvent = events.find((e) => e.id === active.id)
    if (!draggedEvent) return

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

    // Check for conflicts
    if (hasConflict(draggedEvent.id, newStartTime, newEndTime, draggedEvent.date)) {
      toast.error('Cannot move event - time slot conflicts with another event')
      return
    }

    // Update the event
    const updatedEvent = {
      ...draggedEvent,
      startTime: newStartTime,
      endTime: newEndTime,
    }

    if (onEventUpdate) {
      onEventUpdate(updatedEvent)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setDragOverSlot(null)
  }

  // Resize handlers
  const handleResizeStart = (event, pointerEvent) => {
    pointerEvent.stopPropagation()
    const startY = pointerEvent.clientY

    setResizingEvent(event)
    setResizePreviewEndTime(event.endTime)
    resizePreviewEndTimeRef.current = event.endTime

    // Add global pointer move/up handlers
    const handlePointerMove = (e) => {
      const deltaY = e.clientY - startY
      const deltaSlots = Math.round(deltaY / SLOT_HEIGHT)

      // Calculate new end time
      const [endHour, endMin] = event.endTime.split(':').map(Number)
      const endTotalMinutes = endHour * 60 + endMin
      const newEndTotalMinutes = endTotalMinutes + (deltaSlots * 15)

      // Clamp to valid range and enforce minimum duration
      const [startHour, startMin] = event.startTime.split(':').map(Number)
      const startTotalMinutes = startHour * 60 + startMin
      const minEndTotalMinutes = startTotalMinutes + 15 // Minimum 15 minutes

      const clampedEndTotalMinutes = Math.max(
        minEndTotalMinutes,
        Math.min(newEndTotalMinutes, END_HOUR * 60)
      )

      const newEndHour = Math.floor(clampedEndTotalMinutes / 60)
      const newEndMin = clampedEndTotalMinutes % 60
      const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`

      setResizePreviewEndTime(newEndTime)
      resizePreviewEndTimeRef.current = newEndTime
    }

    const handlePointerUp = () => {
      // Get the final end time from the ref
      const finalEndTime = resizePreviewEndTimeRef.current

      cleanup()

      if (!finalEndTime || finalEndTime === event.endTime) {
        return
      }

      // Check for conflicts with new size
      if (hasConflict(event.id, event.startTime, finalEndTime, event.date)) {
        toast.error('Cannot resize event - conflicts with another event')
        return
      }

      // Update the event
      const updatedEvent = {
        ...event,
        endTime: finalEndTime,
      }

      if (onEventUpdate) {
        onEventUpdate(updatedEvent)
      }
    }

    const cleanup = () => {
      setResizingEvent(null)
      setResizePreviewEndTime(null)
      resizePreviewEndTimeRef.current = null
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  // Get the currently dragged event for the overlay
  const activeEvent = activeId ? events.find((e) => e.id === activeId) : null

  return (
    <>
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#2A2A2A',
            color: '#FFFFFF',
            border: '1px solid #F47A20',
          },
        }}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        collisionDetection={pointerWithin}
      >
        <div className="flex-1 overflow-y-auto bg-gray-200 relative">
          <div className="relative" style={{ height: `${TOTAL_SLOTS * SLOT_HEIGHT}px` }}>
        {/* Time labels and grid lines */}
        {timeLabels.map((time, index) => {
          const topPosition = index * SLOTS_PER_HOUR * SLOT_HEIGHT

          return (
            <div key={time.hour} className="absolute left-0 right-0" style={{ top: `${topPosition}px` }}>
              {/* Hour label */}
              <div className="absolute left-0 w-16 text-right pr-2 -translate-y-2">
                <span className="text-xs font-body text-gray-500 uppercase">{time.label}</span>
              </div>

              {/* Hour line (heavier) */}
              <div className="absolute left-16 right-0 border-t border-gray-300" />

              {/* 15-minute grid lines (lighter) */}
              {index < timeLabels.length - 1 && (
                <>
                  <div
                    className="absolute left-16 right-0 border-t border-gray-300/40"
                    style={{ top: `${SLOT_HEIGHT}px` }}
                  />
                  <div
                    className="absolute left-16 right-0 border-t border-gray-300/40"
                    style={{ top: `${SLOT_HEIGHT * 2}px` }}
                  />
                  <div
                    className="absolute left-16 right-0 border-t border-gray-300/40"
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
        <div
          className="absolute left-16 right-0 top-0 bottom-0 px-1"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        >
          {/* Long-press visual feedback */}
          {longPressSlot !== null && (
            <div
              className="absolute left-0 right-0 bg-accent/20 pointer-events-none z-10"
              style={{
                top: `${longPressSlot * SLOT_HEIGHT}px`,
                height: `${SLOT_HEIGHT}px`,
              }}
            />
          )}

          {/* Drag-over preview (ghost) */}
          {dragOverSlot !== null && activeEvent && (
            <div
              className="absolute left-0 right-0 pointer-events-none z-20"
              style={{
                top: `${dragOverSlot * SLOT_HEIGHT}px`,
              }}
            >
              <div className="absolute left-0 right-0 border-2 border-dashed border-accent bg-accent/10 rounded-md"
                style={{
                  height: `${calculateEventOffset(activeEvent.endTime) - calculateEventOffset(activeEvent.startTime)}px`,
                }}
              >
                <div className="p-1.5">
                  <div className="text-xs font-body text-accent font-semibold truncate">
                    {activeEvent.title}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resize preview */}
          {resizingEvent && resizePreviewEndTime && (
            <div
              className="absolute left-0 right-0 pointer-events-none z-20"
              style={{
                top: `${calculateEventOffset(resizingEvent.startTime)}px`,
              }}
            >
              <div className="absolute left-0 right-0 border-2 border-dashed border-accent bg-accent/10 rounded-md"
                style={{
                  height: `${calculateEventOffset(resizePreviewEndTime) - calculateEventOffset(resizingEvent.startTime)}px`,
                }}
              >
                <div className="p-1.5">
                  <div className="text-xs font-body text-accent font-semibold truncate">
                    {resizingEvent.title}
                  </div>
                </div>
              </div>
            </div>
          )}

          {events.length === 0 ? (
            // Empty state
            <div className="flex items-center justify-center h-full pointer-events-none">
              <div className="text-center px-4">
                <p className="text-gray-500 font-body text-sm">
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
                style={{
                  top: `${calculateEventOffset(event.startTime)}px`,
                  height: `${calculateEventOffset(event.endTime) - calculateEventOffset(event.startTime)}px`,
                  opacity: resizingEvent && resizingEvent.id === event.id ? 0.3 : 1,
                }}
                data-event-card
              >
                <DraggableEvent
                  event={event}
                  onEventClick={onEventClick}
                  onResizeStart={handleResizeStart}
                  isDragging={activeId === event.id}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>

    {/* Drag overlay - shows a copy of the dragged event */}
    <DragOverlay dropAnimation={null}>
      {activeEvent ? (
        <div className="opacity-90">
          <EventCard event={activeEvent} />
        </div>
      ) : null}
    </DragOverlay>
  </DndContext>
</>
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
  onEventClick: PropTypes.func.isRequired,
  onLongPressSlot: PropTypes.func,
  onEventUpdate: PropTypes.func,
}
