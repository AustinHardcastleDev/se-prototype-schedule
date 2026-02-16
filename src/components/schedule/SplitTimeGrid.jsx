import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { format } from 'date-fns'
import { DndContext, DragOverlay, pointerWithin, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { toast } from 'react-hot-toast'
import DraggableEvent from './DraggableEvent'
import EventCard from './EventCard'

const SLOT_HEIGHT = 16
const SLOTS_PER_HOUR = 4
const START_HOUR = 6
const END_HOUR = 20
const TOTAL_HOURS = END_HOUR - START_HOUR
const TOTAL_SLOTS = TOTAL_HOURS * SLOTS_PER_HOUR

// Droppable column for one member in split view
function SplitColumn({
  member,
  date,
  events,
  activeId,
  activeEvent,
  dragOverColumn,
  dragOverSlot,
  onEventClick,
  onResizeStart,
  resizingEvent,
  resizePreviewEndTime,
  calculateEventOffset,
  onLongPressSlot,
  currentTimeOffset,
  isToday,
  onHeaderTap,
}) {
  const { setNodeRef } = useDroppable({
    id: member.id,
    data: { memberId: member.id },
  })

  const isColumnOver = dragOverColumn === member.id
  const [longPressSlot, setLongPressSlot] = useState(null)
  const longPressTimerRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }
  }, [])

  const handlePointerDown = (e) => {
    if (e.target.closest('[data-event-card]')) return

    const rect = e.currentTarget.getBoundingClientRect()
    const yPosition = e.clientY - rect.top
    const slotIndex = Math.floor(yPosition / SLOT_HEIGHT)

    setLongPressSlot(slotIndex)

    longPressTimerRef.current = setTimeout(() => {
      const totalMinutes = slotIndex * 15
      const hours = Math.floor(totalMinutes / 60) + START_HOUR
      const minutes = totalMinutes % 60
      const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

      const endMinutes = minutes + 15
      const endHour = hours + Math.floor(endMinutes / 60)
      const endMin = endMinutes % 60
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`

      if (onLongPressSlot) {
        onLongPressSlot({ startTime, endTime, memberId: member.id })
      }
      setLongPressSlot(null)
    }, 500)
  }

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setLongPressSlot(null)
  }

  const handlePointerLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setLongPressSlot(null)
  }

  // Generate time labels for grid lines
  const timeLabels = []
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    timeLabels.push({ hour })
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Sticky header — tappable to open switcher */}
      <button
        className="sticky top-0 z-20 bg-charcoal px-2 py-1.5 flex items-center gap-1.5 border-b border-secondary w-full active:brightness-125 transition-all"
        onClick={() => onHeaderTap && onHeaderTap()}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-body font-semibold flex-shrink-0"
          style={{ backgroundColor: member.color }}
        >
          {member.avatar}
        </div>
        <span className="text-xs font-body text-text-light font-semibold truncate">
          {member.name.split(' ')[0]}
        </span>
      </button>

      {/* Grid area */}
      <div
        ref={setNodeRef}
        data-droppable-id={member.id}
        data-member-id={member.id}
        className={`relative ${isColumnOver ? 'bg-accent/10' : ''}`}
        style={{ height: `${TOTAL_SLOTS * SLOT_HEIGHT}px` }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {/* Grid lines */}
        {timeLabels.map((time, index) => {
          const topPosition = index * SLOTS_PER_HOUR * SLOT_HEIGHT
          return (
            <div key={time.hour}>
              <div
                className="absolute left-0 right-0 border-t border-gray-300"
                style={{ top: `${topPosition}px` }}
              />
              {index < timeLabels.length - 1 && (
                <>
                  <div className="absolute left-0 right-0 border-t border-gray-300/40" style={{ top: `${topPosition + SLOT_HEIGHT}px` }} />
                  <div className="absolute left-0 right-0 border-t border-gray-300/40" style={{ top: `${topPosition + SLOT_HEIGHT * 2}px` }} />
                  <div className="absolute left-0 right-0 border-t border-gray-300/40" style={{ top: `${topPosition + SLOT_HEIGHT * 3}px` }} />
                </>
              )}
            </div>
          )
        })}

        {/* Current time indicator */}
        {isToday && currentTimeOffset !== null && (
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ top: `${currentTimeOffset}px` }}
          >
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <div className="flex-1 h-0.5 bg-accent" />
            </div>
          </div>
        )}

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

        {/* Events */}
        {events.map((event) => {
          const topOffset = calculateEventOffset(event.startTime)
          const endOffset = calculateEventOffset(event.endTime)
          const isDragging = activeId === event.id
          const isResizing = resizingEvent && resizingEvent.id === event.id

          return (
            <div
              key={event.id}
              data-event-card
              className="absolute left-0 right-0"
              style={{
                top: `${topOffset}px`,
                height: `${endOffset - topOffset}px`,
                opacity: isResizing ? 0.3 : 1,
              }}
            >
              <DraggableEvent
                event={event}
                onEventClick={onEventClick}
                onResizeStart={onResizeStart}
                isDragging={isDragging}
                compact={true}
              />
            </div>
          )
        })}

        {/* Resize preview */}
        {resizingEvent && resizePreviewEndTime && resizingEvent.assigneeId === member.id && (
          <div
            className="absolute left-0 right-0 pointer-events-none z-20"
            style={{ top: `${calculateEventOffset(resizingEvent.startTime)}px` }}
          >
            <div
              className="absolute left-0 right-0 border-2 border-dashed border-accent bg-accent/10 rounded-md"
              style={{
                height: `${calculateEventOffset(resizePreviewEndTime) - calculateEventOffset(resizingEvent.startTime)}px`,
              }}
            >
              <div className="p-1">
                <div className="text-[10px] font-body text-accent font-semibold truncate">
                  {resizingEvent.title}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drag preview ghost */}
        {dragOverSlot !== null && activeEvent && isColumnOver && (
          <div
            className="absolute left-0 right-0 pointer-events-none z-20 border-2 border-dashed border-accent bg-accent/10"
            style={{
              top: `${dragOverSlot * SLOT_HEIGHT}px`,
              height: `${calculateEventOffset(activeEvent.endTime) - calculateEventOffset(activeEvent.startTime)}px`,
            }}
          >
            <div className="p-1 text-[10px] text-accent font-semibold truncate">
              {activeEvent.title}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

SplitColumn.propTypes = {
  member: PropTypes.object.isRequired,
  date: PropTypes.string.isRequired,
  events: PropTypes.array.isRequired,
  activeId: PropTypes.string,
  activeEvent: PropTypes.object,
  dragOverColumn: PropTypes.string,
  dragOverSlot: PropTypes.number,
  onEventClick: PropTypes.func.isRequired,
  onResizeStart: PropTypes.func,
  resizingEvent: PropTypes.object,
  resizePreviewEndTime: PropTypes.string,
  calculateEventOffset: PropTypes.func.isRequired,
  onLongPressSlot: PropTypes.func,
  currentTimeOffset: PropTypes.number,
  isToday: PropTypes.bool,
  onHeaderTap: PropTypes.func,
}

export default function SplitTimeGrid({
  selectedDate,
  leftMember,
  rightMember,
  events: allEvents,
  onEventClick,
  onLongPressSlot,
  onEventUpdate,
  onHeaderTap,
}) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeId, setActiveId] = useState(null)
  const [dragOverSlot, setDragOverSlot] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const grabOffsetRef = useRef({ x: 0, y: 0 })

  // Refs mirror state for synchronous reads inside drag handlers.
  // On mobile, TouchSensor fires onDragStart from a setTimeout — React 18
  // batches that state update, so onDragMove can fire before the re-render
  // commits the new activeId. Same for dragOverColumn/dragOverSlot read in
  // handleDragEnd.
  const activeIdRef = useRef(null)
  const dragOverColumnRef = useRef(null)
  const dragOverSlotRef = useRef(null)

  // Resize state
  const [resizingEvent, setResizingEvent] = useState(null)
  const [resizePreviewEndTime, setResizePreviewEndTime] = useState(null)
  const resizePreviewEndTimeRef = useRef(null)

  // Sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const formattedDate = format(selectedDate, 'yyyy-MM-dd')
  const isToday = format(new Date(), 'yyyy-MM-dd') === formattedDate

  // Filter events for each member
  const leftEvents = allEvents.filter(
    (e) => e.assigneeId === leftMember.id && e.date === formattedDate
  )
  const rightEvents = allEvents.filter(
    (e) => e.assigneeId === rightMember.id && e.date === formattedDate
  )

  // Calculate current time offset
  const getCurrentTimeOffset = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    if (hours < START_HOUR || hours > END_HOUR) return null
    const slotsFromStart = (hours - START_HOUR) * SLOTS_PER_HOUR + minutes / 15
    return slotsFromStart * SLOT_HEIGHT
  }
  const currentTimeOffset = getCurrentTimeOffset()

  const calculateEventOffset = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const slotsFromStart = (hours - START_HOUR) * SLOTS_PER_HOUR + minutes / 15
    return slotsFromStart * SLOT_HEIGHT
  }

  // Conflict detection against target member's events
  const hasConflict = (eventId, newStartTime, newEndTime, date, targetAssigneeId) => {
    return allEvents.some((existing) => {
      if (existing.id === eventId) return false
      if (existing.date !== date || existing.assigneeId !== targetAssigneeId) return false
      return newStartTime < existing.endTime && newEndTime > existing.startTime
    })
  }

  const roundToNearestSlot = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes
    const roundedMinutes = Math.round(totalMinutes / 15) * 15
    const roundedHours = Math.floor(roundedMinutes / 60)
    const roundedMins = roundedMinutes % 60
    return `${roundedHours.toString().padStart(2, '0')}:${roundedMins.toString().padStart(2, '0')}`
  }

  // DOM hit-testing for droppable columns
  const findDroppableAtPoint = (clientX, clientY) => {
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null
    const elements = document.elementsFromPoint(clientX, clientY)
    const col = elements.find((el) => el.dataset.droppableId)
    if (!col) return null
    return {
      memberId: col.dataset.memberId,
      rect: col.getBoundingClientRect(),
    }
  }

  // Extract clientX/clientY from an event, handling both pointer and touch events
  const getEventCoords = (evt) => {
    if (evt == null) return { x: 0, y: 0 }
    if (Number.isFinite(evt.clientX)) return { x: evt.clientX, y: evt.clientY }
    // TouchEvent: coordinates live on individual touches
    const touch = evt.touches?.[0] || evt.changedTouches?.[0]
    if (touch) return { x: touch.clientX, y: touch.clientY }
    return { x: 0, y: 0 }
  }

  // Track the initial pointer position for reliable delta calculation
  const initialCoordsRef = useRef({ x: 0, y: 0 })

  // Drag handlers
  const handleDragStart = (event) => {
    if (event.activatorEvent?.target?.closest('[data-resize-handle]')) return

    const coords = getEventCoords(event.activatorEvent)
    initialCoordsRef.current = coords

    const activeNode = event.active.node?.current
    if (activeNode) {
      const rect = activeNode.getBoundingClientRect()
      grabOffsetRef.current = {
        x: coords.x - rect.left,
        y: coords.y - rect.top,
      }
    } else {
      grabOffsetRef.current = { x: 0, y: 0 }
    }

    activeIdRef.current = event.active.id
    setActiveId(event.active.id)
  }

  const handleDragMove = (event) => {
    const { delta } = event
    if (!activeIdRef.current) return

    const currentPointerX = initialCoordsRef.current.x + delta.x
    const currentPointerY = initialCoordsRef.current.y + delta.y

    const target = findDroppableAtPoint(currentPointerX, currentPointerY)

    if (target) {
      dragOverColumnRef.current = target.memberId
      setDragOverColumn(target.memberId)
      const cardTopY = currentPointerY - grabOffsetRef.current.y
      const yInGrid = cardTopY - target.rect.top
      const newSlot = Math.floor(yInGrid / SLOT_HEIGHT)
      const clampedSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, newSlot))
      dragOverSlotRef.current = clampedSlot
      setDragOverSlot(clampedSlot)
    }
  }

  const handleDragEnd = (event) => {
    const { active, delta } = event

    const prevDragOverColumn = dragOverColumnRef.current
    const prevDragOverSlot = dragOverSlotRef.current

    activeIdRef.current = null
    dragOverColumnRef.current = null
    dragOverSlotRef.current = null
    setActiveId(null)
    setDragOverSlot(null)
    setDragOverColumn(null)

    const draggedEvent = allEvents.find((e) => e.id === active.id)
    if (!draggedEvent) return

    let targetAssigneeId = draggedEvent.assigneeId
    let clampedSlot

    if (prevDragOverColumn) {
      targetAssigneeId = prevDragOverColumn
      clampedSlot = prevDragOverSlot !== null ? prevDragOverSlot : 0
    } else {
      const currentPointerX = initialCoordsRef.current.x + delta.x
      const currentPointerY = initialCoordsRef.current.y + delta.y
      const target = findDroppableAtPoint(currentPointerX, currentPointerY)
      if (target) {
        targetAssigneeId = target.memberId
        const cardTopY = currentPointerY - grabOffsetRef.current.y
        const yInGrid = cardTopY - target.rect.top
        const newSlot = Math.floor(yInGrid / SLOT_HEIGHT)
        clampedSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, newSlot))
      } else {
        const originalOffset = calculateEventOffset(draggedEvent.startTime)
        const newOffset = originalOffset + delta.y
        const newSlot = Math.floor(newOffset / SLOT_HEIGHT)
        clampedSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, newSlot))
      }
    }

    // Calculate new times
    const totalMinutes = clampedSlot * 15
    const newHours = Math.floor(totalMinutes / 60) + START_HOUR
    const newMinutes = totalMinutes % 60
    let newStartTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
    newStartTime = roundToNearestSlot(newStartTime)

    const [oldStartHour, oldStartMin] = draggedEvent.startTime.split(':').map(Number)
    const [oldEndHour, oldEndMin] = draggedEvent.endTime.split(':').map(Number)
    const durationMinutes = (oldEndHour * 60 + oldEndMin) - (oldStartHour * 60 + oldStartMin)

    const [newStartHour, newStartMin] = newStartTime.split(':').map(Number)
    const endTotalMinutes = (newStartHour * 60 + newStartMin) + durationMinutes
    const newEndHour = Math.floor(endTotalMinutes / 60)
    const newEndMin = endTotalMinutes % 60
    const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`

    if (newStartHour < START_HOUR || newEndHour > END_HOUR) {
      toast.error('Event cannot be moved outside of 6 AM - 8 PM')
      return
    }

    if (hasConflict(draggedEvent.id, newStartTime, newEndTime, formattedDate, targetAssigneeId)) {
      const targetMember = [leftMember, rightMember].find((m) => m.id === targetAssigneeId)
      const memberName = targetMember ? targetMember.name : 'this person'
      toast.error(`Cannot move event - time slot conflicts with ${memberName}'s schedule`)
      return
    }

    const updatedEvent = {
      ...draggedEvent,
      assigneeId: targetAssigneeId,
      startTime: newStartTime,
      endTime: newEndTime,
    }
    if (targetAssigneeId !== draggedEvent.assigneeId) {
      const targetMember = [leftMember, rightMember].find((m) => m.id === targetAssigneeId)
      const memberName = targetMember ? targetMember.name : 'team member'
      toast.success(`Event reassigned to ${memberName}`)
    }

    if (onEventUpdate) onEventUpdate(updatedEvent)
  }

  const handleDragCancel = () => {
    activeIdRef.current = null
    dragOverColumnRef.current = null
    dragOverSlotRef.current = null
    setActiveId(null)
    setDragOverSlot(null)
    setDragOverColumn(null)
  }

  // Resize handlers
  const handleResizeStart = (event, pointerEvent) => {
    pointerEvent.stopPropagation()
    const startY = pointerEvent.clientY

    setResizingEvent(event)
    setResizePreviewEndTime(event.endTime)
    resizePreviewEndTimeRef.current = event.endTime

    const handlePointerMove = (e) => {
      const deltaY = e.clientY - startY
      const deltaSlots = Math.round(deltaY / SLOT_HEIGHT)

      const [endHour, endMin] = event.endTime.split(':').map(Number)
      const endTotalMinutes = endHour * 60 + endMin
      const newEndTotalMinutes = endTotalMinutes + deltaSlots * 15

      const [startHour, startMin] = event.startTime.split(':').map(Number)
      const startTotalMinutes = startHour * 60 + startMin
      const minEndTotalMinutes = startTotalMinutes + 15

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
      const finalEndTime = resizePreviewEndTimeRef.current
      cleanup()

      if (!finalEndTime || finalEndTime === event.endTime) return

      if (hasConflict(event.id, event.startTime, finalEndTime, event.date, event.assigneeId)) {
        toast.error('Cannot resize event - conflicts with another event')
        return
      }

      if (onEventUpdate) {
        onEventUpdate({ ...event, endTime: finalEndTime })
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

  const activeEvent = activeId ? allEvents.find((e) => e.id === activeId) : null

  // Time labels for the narrow gutter
  const timeLabels = []
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    const period = hour >= 12 ? 'p' : 'a'
    const displayHour = hour % 12 || 12
    timeLabels.push({ hour, label: `${displayHour}${period}` })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      collisionDetection={pointerWithin}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Scrollable container */}
        <div className="flex-1 overflow-y-auto bg-gray-200 relative">
          <div className="flex" style={{ minHeight: `${TOTAL_SLOTS * SLOT_HEIGHT + 36}px` }}>
            {/* Time gutter */}
            <div className="w-10 flex-shrink-0 relative bg-gray-200">
              {/* Gutter header spacer */}
              <div className="sticky top-0 z-20 h-9 bg-charcoal border-b border-secondary" />
              <div className="relative" style={{ height: `${TOTAL_SLOTS * SLOT_HEIGHT}px` }}>
                {timeLabels.map((time, index) => {
                  const topPosition = index * SLOTS_PER_HOUR * SLOT_HEIGHT
                  return (
                    <div
                      key={time.hour}
                      className="absolute left-0 w-10 text-right pr-1 -translate-y-2"
                      style={{ top: `${topPosition}px` }}
                    >
                      <span className="text-[10px] font-body text-gray-500">{time.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Left column */}
            <div className="flex-1 min-w-0 border-l border-gray-300">
              <SplitColumn
                member={leftMember}
                date={formattedDate}
                events={leftEvents}
                activeId={activeId}
                activeEvent={activeEvent}
                dragOverColumn={dragOverColumn}
                dragOverSlot={dragOverSlot}
                onEventClick={onEventClick}
                onResizeStart={handleResizeStart}
                resizingEvent={resizingEvent}
                resizePreviewEndTime={resizePreviewEndTime}
                calculateEventOffset={calculateEventOffset}
                onLongPressSlot={onLongPressSlot}
                currentTimeOffset={currentTimeOffset}
                isToday={isToday}
                onHeaderTap={onHeaderTap}
              />
            </div>

            {/* Right column */}
            <div className="flex-1 min-w-0 border-l border-gray-300">
              <SplitColumn
                member={rightMember}
                date={formattedDate}
                events={rightEvents}
                activeId={activeId}
                activeEvent={activeEvent}
                dragOverColumn={dragOverColumn}
                dragOverSlot={dragOverSlot}
                onEventClick={onEventClick}
                onResizeStart={handleResizeStart}
                resizingEvent={resizingEvent}
                resizePreviewEndTime={resizePreviewEndTime}
                calculateEventOffset={calculateEventOffset}
                onLongPressSlot={onLongPressSlot}
                currentTimeOffset={currentTimeOffset}
                isToday={isToday}
                onHeaderTap={onHeaderTap}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeEvent ? (
          <div className="opacity-90" style={{ maxWidth: '45vw' }}>
            <EventCard event={activeEvent} disableInteraction={true} disableResize={true} compact={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

SplitTimeGrid.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  leftMember: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
  rightMember: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
  events: PropTypes.array.isRequired,
  onEventClick: PropTypes.func.isRequired,
  onLongPressSlot: PropTypes.func,
  onEventUpdate: PropTypes.func,
  onHeaderTap: PropTypes.func,
}
