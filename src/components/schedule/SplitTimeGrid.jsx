import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { format, addDays, subDays } from 'date-fns'
import { DndContext, DragOverlay, pointerWithin, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { toast } from 'react-hot-toast'
import DraggableEvent from './DraggableEvent'
import EventCard from './EventCard'
import VirtualColumnCardList from './VirtualColumnCardList'
import MiniCalendarPopup from '../ui/MiniCalendarPopup'

const SLOT_HEIGHT = 16
const SLOTS_PER_HOUR = 4
const START_HOUR = 6
const END_HOUR = 20
const TOTAL_HOURS = END_HOUR - START_HOUR
const TOTAL_SLOTS = TOTAL_HOURS * SLOTS_PER_HOUR

// Column header with date navigation for real members
function ColumnHeader({ member, date, onDateChange, onHeaderTap }) {
  const [showCalendar, setShowCalendar] = useState(false)

  const formattedDate = format(date, 'EEE M/d')

  return (
    <div className="sticky top-0 z-20 bg-charcoal border-b border-secondary w-full h-[52px] flex-shrink-0 flex flex-col justify-center">
      {/* Row 1: Avatar + Name */}
      <button
        className="px-2 flex items-center gap-1.5 w-full active:brightness-125 transition-all"
        onClick={() => onHeaderTap && onHeaderTap()}
      >
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-body font-semibold flex-shrink-0"
          style={{ backgroundColor: member.color }}
        >
          {member.avatar}
        </div>
        <span className="text-xs font-body text-text-light font-semibold truncate">
          {member.name.split(' ')[0]}
        </span>
      </button>

      {/* Row 2: Date navigation */}
      <div className="px-1 flex items-center justify-center gap-0.5 relative">
        <button
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onDateChange(subDays(date, 1))
          }}
          aria-label="Previous day"
        >
          <svg className="w-3 h-3 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          className="text-[10px] font-body text-text-light/80 hover:text-text-light transition-colors px-1"
          onClick={(e) => {
            e.stopPropagation()
            setShowCalendar(!showCalendar)
          }}
        >
          {formattedDate}
        </button>

        <button
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onDateChange(addDays(date, 1))
          }}
          aria-label="Next day"
        >
          <svg className="w-3 h-3 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {showCalendar && (
          <MiniCalendarPopup
            selectedDate={date}
            onDateSelect={(d) => {
              onDateChange(d)
              setShowCalendar(false)
            }}
            onClose={() => setShowCalendar(false)}
          />
        )}
      </div>
    </div>
  )
}

ColumnHeader.propTypes = {
  member: PropTypes.object.isRequired,
  date: PropTypes.instanceOf(Date).isRequired,
  onDateChange: PropTypes.func.isRequired,
  onHeaderTap: PropTypes.func,
}

// Virtual column header (Unassigned / Earlier) — height matches ColumnHeader
function VirtualColumnHeader({ member, eventCount, onHeaderTap }) {
  return (
    <div
      className="bg-charcoal px-2 flex items-center gap-1.5 border-b border-secondary w-full active:brightness-125 transition-all h-[52px] flex-shrink-0 cursor-pointer"
      onClick={() => onHeaderTap && onHeaderTap()}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-body font-semibold flex-shrink-0"
        style={{ backgroundColor: member.color }}
      >
        {member.avatar}
      </div>
      <span className="text-xs font-body text-text-light font-semibold truncate">
        {member.name}
      </span>
      <span className="text-[10px] font-body text-gray-400 ml-auto flex-shrink-0">
        {eventCount} jobs
      </span>
    </div>
  )
}

VirtualColumnHeader.propTypes = {
  member: PropTypes.object.isRequired,
  eventCount: PropTypes.number.isRequired,
  onHeaderTap: PropTypes.func,
}

// Droppable time-grid column for a real member
function SplitColumn({
  columnId,
  member,
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
}) {
  const { setNodeRef } = useDroppable({
    id: columnId,
    data: { columnId },
  })

  const isColumnOver = dragOverColumn === columnId
  const [longPressSlot, setLongPressSlot] = useState(null)
  const longPressTimerRef = useRef(null)

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

  const timeLabels = []
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    timeLabels.push({ hour })
  }

  // Calculate drag preview height based on active event duration
  const getDragPreviewHeight = () => {
    if (!activeEvent) return SLOT_HEIGHT
    if (!activeEvent.startTime || !activeEvent.endTime) return 2 * SLOT_HEIGHT // default 30 min
    const [startH, startM] = activeEvent.startTime.split(':').map(Number)
    const [endH, endM] = activeEvent.endTime.split(':').map(Number)
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM)
    return (durationMinutes / 15) * SLOT_HEIGHT
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Grid area */}
      <div
        ref={setNodeRef}
        data-droppable-id={columnId}
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
              <div className="p-1 overflow-hidden">
                <div className="text-[10px] font-body text-accent font-semibold truncate">
                  {resizingEvent.title}
                </div>
                <div className="text-[9px] font-body text-accent/80 truncate">
                  {(() => {
                    const [sh, sm] = resizingEvent.startTime.split(':').map(Number)
                    const [eh, em] = resizePreviewEndTime.split(':').map(Number)
                    const fmtTime = (h, m) => `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`
                    const dur = (eh * 60 + em) - (sh * 60 + sm)
                    const dh = Math.floor(dur / 60)
                    const dm = dur % 60
                    return `${fmtTime(sh, sm)} – ${fmtTime(eh, em)} (${dh ? dh + 'h ' : ''}${dm ? dm + 'm' : ''})`
                  })()}
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
              height: `${getDragPreviewHeight()}px`,
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
  columnId: PropTypes.string.isRequired,
  member: PropTypes.object.isRequired,
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
}

// Droppable wrapper for virtual columns
function VirtualColumnDroppable({ columnId, children }) {
  const { setNodeRef } = useDroppable({
    id: columnId,
    data: { columnId },
  })

  return (
    <div
      ref={setNodeRef}
      data-droppable-id={columnId}
      className="flex flex-col flex-1 min-h-0 min-w-0"
    >
      {children}
    </div>
  )
}

VirtualColumnDroppable.propTypes = {
  columnId: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

export default function SplitTimeGrid({
  leftMember,
  rightMember,
  leftDate,
  rightDate,
  onLeftDateChange,
  onRightDateChange,
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

  const activeIdRef = useRef(null)
  const dragOverColumnRef = useRef(null)
  const dragOverSlotRef = useRef(null)

  // Refs for column containers — used for geometry-based column detection
  const leftColRef = useRef(null)
  const rightColRef = useRef(null)

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

  const leftFormattedDate = format(leftDate, 'yyyy-MM-dd')
  const rightFormattedDate = format(rightDate, 'yyyy-MM-dd')

  const leftIsVirtual = leftMember.isVirtual
  const rightIsVirtual = rightMember.isVirtual

  // Filter events for each column
  const getColumnEvents = (member, formattedDate) => {
    if (member.isVirtual) {
      if (member.virtualType === 'unassigned') {
        return allEvents
          .filter((e) => e.assigneeId === null)
          .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))
      }
      if (member.virtualType === 'earlier') {
        return allEvents
          .filter((e) => e.earlierOpening === true)
          .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))
      }
      return []
    }
    return allEvents.filter(
      (e) => e.assigneeId === member.id && e.date === formattedDate
    )
  }

  const leftEvents = getColumnEvents(leftMember, leftFormattedDate)
  const rightEvents = getColumnEvents(rightMember, rightFormattedDate)

  // Calculate current time offset
  const getCurrentTimeOffset = () => {
    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()
    if (hours < START_HOUR || hours > END_HOUR) return null
    const slotsFromStart = (hours - START_HOUR) * SLOTS_PER_HOUR + minutes / 15
    return slotsFromStart * SLOT_HEIGHT
  }
  const currentTimeOffset = getCurrentTimeOffset()

  // Check if a date is today
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const leftIsToday = leftFormattedDate === todayStr
  const rightIsToday = rightFormattedDate === todayStr

  const calculateEventOffset = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const slotsFromStart = (hours - START_HOUR) * SLOTS_PER_HOUR + minutes / 15
    return slotsFromStart * SLOT_HEIGHT
  }

  // Conflict detection with target date support
  const hasConflict = (eventId, newStartTime, newEndTime, date, targetAssigneeId) => {
    if (targetAssigneeId === null) return false
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

  // Geometry-based column detection using refs (more reliable than elementsFromPoint)
  const findColumnAtPoint = (clientX) => {
    const leftRect = leftColRef.current?.getBoundingClientRect()
    const rightRect = rightColRef.current?.getBoundingClientRect()

    if (leftRect && rightRect) {
      // Use midpoint between columns as boundary
      const midX = (leftRect.right + rightRect.left) / 2
      return clientX < midX ? 'col-left' : 'col-right'
    }
    if (leftRect && clientX >= leftRect.left && clientX <= leftRect.right) return 'col-left'
    if (rightRect && clientX >= rightRect.left && clientX <= rightRect.right) return 'col-right'
    return null
  }

  // Get the bounding rect of a column's grid element (for slot calculation)
  const getGridRect = (columnId) => {
    const el = document.querySelector(`[data-droppable-id="${columnId}"]`)
    return el ? el.getBoundingClientRect() : null
  }

  const getEventCoords = (evt) => {
    if (evt == null) return { x: 0, y: 0 }
    if (Number.isFinite(evt.clientX)) return { x: evt.clientX, y: evt.clientY }
    const touch = evt.touches?.[0] || evt.changedTouches?.[0]
    if (touch) return { x: touch.clientX, y: touch.clientY }
    return { x: 0, y: 0 }
  }

  const initialCoordsRef = useRef({ x: 0, y: 0 })

  // Resolve target column info (member + date) from column ID
  const resolveTargetColumn = (columnId) => {
    if (columnId === 'col-left') {
      return { member: leftMember, date: leftFormattedDate }
    }
    if (columnId === 'col-right') {
      return { member: rightMember, date: rightFormattedDate }
    }
    return null
  }

  // Get member name for toast messages
  const getMemberName = (assigneeId) => {
    if (assigneeId === null) return 'Unassigned'
    if (assigneeId === leftMember.id && !leftMember.isVirtual) return leftMember.name
    if (assigneeId === rightMember.id && !rightMember.isVirtual) return rightMember.name
    return 'team member'
  }

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

    const columnId = findColumnAtPoint(currentPointerX)

    if (columnId) {
      dragOverColumnRef.current = columnId
      setDragOverColumn(columnId)

      // Only calculate slot for non-virtual columns
      const targetCol = resolveTargetColumn(columnId)
      if (targetCol && !targetCol.member.isVirtual) {
        const gridRect = getGridRect(columnId)
        if (gridRect) {
          const cardTopY = currentPointerY - grabOffsetRef.current.y
          const yInGrid = cardTopY - gridRect.top
          const newSlot = Math.floor(yInGrid / SLOT_HEIGHT)
          const clampedSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, newSlot))
          dragOverSlotRef.current = clampedSlot
          setDragOverSlot(clampedSlot)
        }
      } else {
        dragOverSlotRef.current = null
        setDragOverSlot(null)
      }
    } else {
      dragOverColumnRef.current = null
      dragOverSlotRef.current = null
      setDragOverColumn(null)
      setDragOverSlot(null)
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

    // Resolve target column
    let targetColumnInfo = null
    let clampedSlot = null

    if (prevDragOverColumn) {
      targetColumnInfo = resolveTargetColumn(prevDragOverColumn)
      clampedSlot = prevDragOverSlot !== null ? prevDragOverSlot : 0
    } else {
      // Fallback: recalculate from current pointer position
      const currentPointerX = initialCoordsRef.current.x + delta.x
      const currentPointerY = initialCoordsRef.current.y + delta.y
      const columnId = findColumnAtPoint(currentPointerX)
      if (columnId) {
        targetColumnInfo = resolveTargetColumn(columnId)
        const gridRect = getGridRect(columnId)
        if (gridRect) {
          const cardTopY = currentPointerY - grabOffsetRef.current.y
          const yInGrid = cardTopY - gridRect.top
          const newSlot = Math.floor(yInGrid / SLOT_HEIGHT)
          clampedSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, newSlot))
        } else {
          clampedSlot = 0
        }
      } else {
        return
      }
    }

    if (!targetColumnInfo) return

    const { member: targetMember, date: targetDate } = targetColumnInfo

    // Handle drop onto "Earlier" column — reject
    if (targetMember.isVirtual && targetMember.virtualType === 'earlier') {
      toast.error('Cannot drop into Earlier pool')
      return
    }

    // Handle drop onto "Unassigned" column
    if (targetMember.isVirtual && targetMember.virtualType === 'unassigned') {
      const sourceName = getMemberName(draggedEvent.assigneeId)
      const updatedEvent = {
        ...draggedEvent,
        assigneeId: null,
      }
      if (onEventUpdate) onEventUpdate(updatedEvent)
      if (draggedEvent.assigneeId !== null) {
        toast.success(`Unassigned from ${sourceName}`)
      }
      return
    }

    // Handle drop onto real member column
    const targetAssigneeId = targetMember.id
    if (clampedSlot === null) clampedSlot = 0

    // Calculate new times
    const totalMinutes = clampedSlot * 15
    const newHours = Math.floor(totalMinutes / 60) + START_HOUR
    const newMinutes = totalMinutes % 60
    let newStartTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
    newStartTime = roundToNearestSlot(newStartTime)

    // Default to 30-min duration for events without times (unassigned)
    let durationMinutes = 30
    if (draggedEvent.startTime && draggedEvent.endTime) {
      const [oldStartHour, oldStartMin] = draggedEvent.startTime.split(':').map(Number)
      const [oldEndHour, oldEndMin] = draggedEvent.endTime.split(':').map(Number)
      durationMinutes = (oldEndHour * 60 + oldEndMin) - (oldStartHour * 60 + oldStartMin)
    }

    const [newStartHour, newStartMin] = newStartTime.split(':').map(Number)
    const endTotalMinutes = (newStartHour * 60 + newStartMin) + durationMinutes
    const newEndHour = Math.floor(endTotalMinutes / 60)
    const newEndMin = endTotalMinutes % 60
    const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`

    if (newStartHour < START_HOUR || newEndHour > END_HOUR) {
      toast.error('Event cannot be moved outside of 6 AM - 8 PM')
      return
    }

    if (hasConflict(draggedEvent.id, newStartTime, newEndTime, targetDate, targetAssigneeId)) {
      const memberName = targetMember.name
      toast.error(`Cannot move event - time slot conflicts with ${memberName}'s schedule`)
      return
    }

    const updatedEvent = {
      ...draggedEvent,
      assigneeId: targetAssigneeId,
      date: targetDate,
      startTime: newStartTime,
      endTime: newEndTime,
    }

    // Clear earlierOpening flag when assigning to a real person
    if (draggedEvent.earlierOpening && !targetMember.isVirtual) {
      updatedEvent.earlierOpening = false
    }

    // Generate appropriate toast message
    const personChanged = targetAssigneeId !== draggedEvent.assigneeId
    const dateChanged = targetDate !== draggedEvent.date
    const wasUnassigned = draggedEvent.assigneeId === null
    const wasEarlier = draggedEvent.earlierOpening === true

    if (wasEarlier && personChanged) {
      toast.success(`Earlier opening assigned to ${targetMember.name}`)
    } else if (wasUnassigned) {
      toast.success(`Assigned to ${targetMember.name}`)
    } else if (personChanged && dateChanged) {
      toast.success(`Reassigned to ${targetMember.name} on ${format(new Date(targetDate + 'T12:00:00'), 'EEE M/d')}`)
    } else if (personChanged) {
      toast.success(`Reassigned to ${targetMember.name}`)
    } else if (dateChanged) {
      toast.success(`Moved to ${format(new Date(targetDate + 'T12:00:00'), 'EEE M/d')}`)
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

  // Calculate drag overlay height for card-to-grid transformation
  const getDragOverlayHeight = () => {
    if (!activeEvent) return undefined
    if (!activeEvent.startTime || !activeEvent.endTime) return 2 * SLOT_HEIGHT // default 30 min
    const [startH, startM] = activeEvent.startTime.split(':').map(Number)
    const [endH, endM] = activeEvent.endTime.split(':').map(Number)
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM)
    return (durationMinutes / 15) * SLOT_HEIGHT
  }

  // Handle long press on split column with date context
  const handleSplitLongPressSlot = (side) => ({ startTime, endTime, memberId }) => {
    const date = side === 'left' ? leftFormattedDate : rightFormattedDate
    if (onLongPressSlot) {
      onLongPressSlot({ startTime, endTime, memberId, date })
    }
  }

  // Render the time gutter
  const renderGutter = () => (
    <div className="w-10 flex-shrink-0 relative bg-gray-200">
      <div className="sticky top-0 z-20 h-[52px] bg-charcoal border-b border-secondary" />
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
  )

  // Render a real member column (header + grid)
  const renderRealColumn = (side) => {
    const member = side === 'left' ? leftMember : rightMember
    const date = side === 'left' ? leftDate : rightDate
    const onDateChange = side === 'left' ? onLeftDateChange : onRightDateChange
    const columnEvents = side === 'left' ? leftEvents : rightEvents
    const isToday = side === 'left' ? leftIsToday : rightIsToday

    return (
      <>
        <ColumnHeader
          member={member}
          date={date}
          onDateChange={onDateChange}
          onHeaderTap={onHeaderTap}
        />
        <SplitColumn
          columnId={`col-${side}`}
          member={member}
          events={columnEvents}
          activeId={activeId}
          activeEvent={activeEvent}
          dragOverColumn={dragOverColumn}
          dragOverSlot={dragOverSlot}
          onEventClick={onEventClick}
          onResizeStart={handleResizeStart}
          resizingEvent={resizingEvent}
          resizePreviewEndTime={resizePreviewEndTime}
          calculateEventOffset={calculateEventOffset}
          onLongPressSlot={handleSplitLongPressSlot(side)}
          currentTimeOffset={currentTimeOffset}
          isToday={isToday}
        />
      </>
    )
  }

  // Render a virtual member column (header + card list)
  const renderVirtualColumn = (side) => {
    const member = side === 'left' ? leftMember : rightMember
    const columnEvents = side === 'left' ? leftEvents : rightEvents

    return (
      <VirtualColumnDroppable columnId={`col-${side}`}>
        <VirtualColumnHeader
          member={member}
          eventCount={columnEvents.length}
          onHeaderTap={onHeaderTap}
        />
        <div className="flex-1 overflow-y-auto min-h-0">
          <VirtualColumnCardList
            events={columnEvents}
            onEventClick={onEventClick}
            activeId={activeId}
            emptyMessage={
              member.virtualType === 'unassigned'
                ? 'No unassigned jobs'
                : 'No earlier openings'
            }
          />
        </div>
      </VirtualColumnDroppable>
    )
  }

  // Layout: when any column is virtual, each side scrolls independently.
  // When both are real, they share one scroll container for synced scrolling.
  const bothReal = !leftIsVirtual && !rightIsVirtual

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
        {bothReal ? (
          /* Both real columns: single shared scroll container */
          <div className="flex-1 overflow-y-auto bg-gray-200 relative">
            <div className="flex" style={{ minHeight: `${TOTAL_SLOTS * SLOT_HEIGHT + 52}px` }}>
              {renderGutter()}
              <div ref={leftColRef} className="flex-1 min-w-0 border-l border-gray-300 flex flex-col">
                {renderRealColumn('left')}
              </div>
              <div ref={rightColRef} className="flex-1 min-w-0 border-l border-gray-300 flex flex-col">
                {renderRealColumn('right')}
              </div>
            </div>
          </div>
        ) : (
          /* Mixed or both virtual: each side scrolls independently */
          <div className="flex flex-1 min-h-0 bg-gray-200">
            {/* Left side */}
            {leftIsVirtual ? (
              <div ref={leftColRef} className="flex-1 min-w-0 border-r border-gray-300 flex flex-col min-h-0">
                {renderVirtualColumn('left')}
              </div>
            ) : (
              <div ref={leftColRef} className="flex flex-1 min-w-0 overflow-y-auto min-h-0">
                {renderGutter()}
                <div className="flex-1 min-w-0 border-l border-gray-300 flex flex-col">
                  {renderRealColumn('left')}
                </div>
              </div>
            )}

            {/* Right side */}
            {rightIsVirtual ? (
              <div ref={rightColRef} className="flex-1 min-w-0 border-l border-gray-300 flex flex-col min-h-0">
                {renderVirtualColumn('right')}
              </div>
            ) : (
              <div ref={rightColRef} className="flex flex-1 min-w-0 overflow-y-auto min-h-0 border-l border-gray-300">
                {!leftIsVirtual ? null : renderGutter()}
                <div className="flex-1 min-w-0 flex flex-col">
                  {renderRealColumn('right')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeEvent ? (
          <div
            className="opacity-90"
            style={{
              maxWidth: '45vw',
              height: `${getDragOverlayHeight()}px`,
            }}
          >
            <EventCard event={activeEvent} disableInteraction={true} disableResize={true} compact={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

SplitTimeGrid.propTypes = {
  leftMember: PropTypes.object.isRequired,
  rightMember: PropTypes.object.isRequired,
  leftDate: PropTypes.instanceOf(Date).isRequired,
  rightDate: PropTypes.instanceOf(Date).isRequired,
  onLeftDateChange: PropTypes.func.isRequired,
  onRightDateChange: PropTypes.func.isRequired,
  events: PropTypes.array.isRequired,
  onEventClick: PropTypes.func.isRequired,
  onLongPressSlot: PropTypes.func,
  onEventUpdate: PropTypes.func,
  onHeaderTap: PropTypes.func,
}
