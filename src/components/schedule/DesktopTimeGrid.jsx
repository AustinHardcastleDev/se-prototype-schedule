import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { format, addDays, isSameDay } from 'date-fns'
import { DndContext, DragOverlay, pointerWithin, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { toast } from 'react-hot-toast'
import { getAllMembers } from '../../utils/dataAccess'
import EventCard from './EventCard'
import DraggableEvent from './DraggableEvent'
import CalendarPopup from '../ui/CalendarPopup'

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
  onResizeStart,
  resizingEvent,
  resizePreviewEndTime,
  calculateEventOffset,
  earlierHighlightMode
}) {
  const { setNodeRef } = useDroppable({
    id: `${memberId}-${date}`,
    data: { memberId, date },
  })

  const isColumnOver = dragOverColumn === memberId && dragOverDate === date

  return (
    <div
      ref={setNodeRef}
      data-droppable-id={`${memberId}-${date}`}
      data-member-id={memberId}
      data-date={date}
      className={`relative px-1 cursor-pointer transition-colors flex-shrink-0 flex-1 ${
        isColumnOver ? 'bg-accent/10' : ''
      }`}
      style={{
        minWidth: '150px',
        borderLeft: memberIndex === 0 ? 'none' : '1px solid #D1D5DB'
      }}
      onClick={onColumnClick}
    >
      {/* Render events for this member on this day */}
      {events.map((event) => {
        const topOffset = calculateEventOffset(event.startTime)
        const isDragging = activeId === event.id
        const isResizing = resizingEvent && resizingEvent.id === event.id

        return (
          <div
            key={event.id}
            data-event-card
            className="absolute left-0 right-0"
            style={{
              top: `${topOffset}px`,
              opacity: isResizing ? 0 : 1,
            }}
          >
            <DraggableEvent
              event={event}
              onEventClick={onEventClick}
              onResizeStart={onResizeStart}
              isDragging={isDragging}
              earlierHighlightMode={earlierHighlightMode}
            />
          </div>
        )
      })}

      {/* Resize preview */}
      {resizingEvent && resizePreviewEndTime && resizingEvent.assigneeId === memberId && resizingEvent.date === date && (
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
  onResizeStart: PropTypes.func,
  resizingEvent: PropTypes.object,
  resizePreviewEndTime: PropTypes.string,
  calculateEventOffset: PropTypes.func.isRequired,
  earlierHighlightMode: PropTypes.bool,
}

export default function DesktopTimeGrid({ selectedDate, events, onDateChange, onSlotClick, onEventClick, onEventUpdate, roleFilter = 'all', earlierHighlightMode = false, children }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const dayRefs = useRef({}) // Store refs to each day section
  const scrollContainerRef = useRef(null) // Ref to the scrollable container
  const [activeId, setActiveId] = useState(null) // Track actively dragged event
  const [dragOverSlot, setDragOverSlot] = useState(null) // Track which slot is being dragged over
  const [dragOverColumn, setDragOverColumn] = useState(null) // Track which column (memberId) is being dragged over
  const [dragOverDate, setDragOverDate] = useState(null) // Track which date section is being dragged over
  const [calendarOpenForDate, setCalendarOpenForDate] = useState(null) // Track which date's calendar is open
  const calendarButtonRef = useRef(null) // Ref for calendar button positioning
  const scrollChangeSource = useRef(null) // 'scroll' | 'picker' | null - tracks source of date change
  const ignoreObserverUntil = useRef(0) // Timestamp until which to ignore observer updates

  // Resize state
  const [resizingEvent, setResizingEvent] = useState(null)
  const [resizePreviewEndTime, setResizePreviewEndTime] = useState(null)
  const resizePreviewEndTimeRef = useRef(null)
  const justFinishedResizingRef = useRef(false)
  const ignoreDragRef = useRef(false) // Track if current drag should be ignored (started from resize handle)
  const holdingPinEventRef = useRef(null) // Persist holding-pin event id across draggable unmount
  const grabOffsetRef = useRef({ x: 0, y: 0 }) // Offset from pointer to top-left of dragged card

  // Configure sensors for both mouse and touch - require movement before drag starts
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

  // Get all team members for columns
  const teamMembers = getAllMembers()
  const filteredMembers = roleFilter === 'all'
    ? teamMembers
    : teamMembers.filter(m => m.role === roleFilter)

  // Generate array of dates to render (10 days before + selected date + 10 days after = 21 days total)
  const daysToRender = []
  for (let i = -10; i <= 10; i++) {
    daysToRender.push(addDays(selectedDate, i))
  }

  // IntersectionObserver to detect which day is in view
  useEffect(() => {
    if (!onDateChange) return

    const observer = new IntersectionObserver(
      (entries) => {
        const now = Date.now()
        const ignoreUntil = ignoreObserverUntil.current

        // Ignore observer updates briefly after programmatic scrolling
        if (now < ignoreUntil) {
          console.log('[IntersectionObserver] Ignoring - within ignore window. now:', now, 'ignoreUntil:', ignoreUntil, 'diff:', ignoreUntil - now)
          return
        }

        console.log('[IntersectionObserver] NOT ignoring - processing entries. Entries count:', entries.length)

        // Find the day header that is most visible at the top of the viewport
        const visibleEntry = entries.find(
          (entry) => entry.isIntersecting && entry.intersectionRatio > 0.5
        )

        if (visibleEntry) {
          const dateStr = visibleEntry.target.dataset.date
          console.log('[IntersectionObserver] Visible entry date:', dateStr, 'ratio:', visibleEntry.intersectionRatio)

          if (dateStr) {
            const newDate = new Date(dateStr)
            const newDateStr = format(newDate, 'yyyy-MM-dd')
            const currentDateStr = format(selectedDate, 'yyyy-MM-dd')

            console.log('[IntersectionObserver] newDateStr:', newDateStr, 'currentDateStr:', currentDateStr)

            // Only update if it's a different day
            if (newDateStr !== currentDateStr) {
              console.log('[IntersectionObserver] UPDATING selectedDate from', currentDateStr, 'to', newDateStr)
              // Mark this as scroll-initiated so we don't scroll back to it
              scrollChangeSource.current = 'scroll'
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

  // Scroll to selected date when it changes from date picker (not from scrolling)
  // Using useLayoutEffect to ensure scroll happens synchronously after DOM updates
  useLayoutEffect(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    console.log('[useLayoutEffect] selectedDate changed to:', dateKey)
    console.log('[useLayoutEffect] scrollChangeSource.current:', scrollChangeSource.current)

    // If this change came from scrolling, don't scroll back to it
    if (scrollChangeSource.current === 'scroll') {
      console.log('[useLayoutEffect] Skipping scroll - change came from scrolling')
      scrollChangeSource.current = null
      return
    }

    // Immediately ignore observer updates to prevent race conditions
    ignoreObserverUntil.current = Date.now() + 500 // Increased to 500ms for debugging
    console.log('[useLayoutEffect] Set ignoreObserverUntil to:', ignoreObserverUntil.current)

    // Use requestAnimationFrame to ensure layout is fully calculated
    requestAnimationFrame(() => {
      console.log('[rAF] Calculating scroll position for date:', dateKey)

      if (scrollContainerRef.current) {
        // Calculate scroll position based on known layout:
        // - Team header: ~56px (sticky at top-0)
        // - Each day section: dayHeader (~50px) + grid (896px) = 946px
        // - Today is always at index 10 in daysToRender (center of -10 to +10 range)
        const teamHeaderHeight = 56
        const dayHeaderHeight = 50 // py-2 (16px) + content (~32px) + border-b-2 (2px)
        const gridHeight = TOTAL_SLOTS * SLOT_HEIGHT // 56 * 16 = 896
        const daySectionHeight = dayHeaderHeight + gridHeight // 936
        const todayIndex = 10 // selectedDate is always at center

        // Position of today's day header in scroll content
        const todayHeaderPosition = teamHeaderHeight + (todayIndex * daySectionHeight)

        // Position of today's 6 AM (start of grid, right after day header)
        const today6AMPosition = todayHeaderPosition + dayHeaderHeight

        // We want 6 AM to be visible right below the sticky day header
        // Sticky team header: 0-56px, Sticky day header: 56-96px
        // So visible content starts at ~96px
        const visibleContentStart = teamHeaderHeight + dayHeaderHeight // 96

        const targetScrollTop = today6AMPosition - visibleContentStart

        console.log('[rAF] todayIndex:', todayIndex)
        console.log('[rAF] todayHeaderPosition:', todayHeaderPosition)
        console.log('[rAF] today6AMPosition:', today6AMPosition)
        console.log('[rAF] visibleContentStart:', visibleContentStart)
        console.log('[rAF] targetScrollTop:', targetScrollTop)
        console.log('[rAF] scrollTopBefore:', scrollContainerRef.current.scrollTop)

        scrollContainerRef.current.scrollTop = targetScrollTop

        console.log('[rAF] scrollTopAfter:', scrollContainerRef.current.scrollTop)

        // Debug: Check which day headers are near the top after scroll
        setTimeout(() => {
          console.log('[DEBUG 100ms after scroll] Checking visible day headers...')
          const allDayHeaders = scrollContainerRef.current?.querySelectorAll('[data-date]')
          if (allDayHeaders) {
            const containerTop = scrollContainerRef.current.getBoundingClientRect().top
            allDayHeaders.forEach(header => {
              const rect = header.getBoundingClientRect()
              const relativeTop = rect.top - containerTop
              // Only log headers near the top of the viewport (within 200px)
              if (relativeTop >= -50 && relativeTop <= 200) {
                console.log('[DEBUG] Day header', header.dataset.date, 'is at relativeTop:', relativeTop)
              }
            })
          }
          console.log('[DEBUG] Current scrollTop:', scrollContainerRef.current?.scrollTop)
        }, 100)
      } else {
        console.log('[rAF] scrollContainerRef not available')
      }
    })

    scrollChangeSource.current = null
  }, [selectedDate])

  // Debug: Log selectedDate on every render
  useEffect(() => {
    console.log('[DEBUG RENDER] selectedDate is now:', format(selectedDate, 'yyyy-MM-dd'))
  })

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every 60 seconds

    return () => clearInterval(interval)
  }, [])

  // Handle outside click to close calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarButtonRef.current && !calendarButtonRef.current.contains(event.target)) {
        setCalendarOpenForDate(null)
      }
    }

    if (calendarOpenForDate) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [calendarOpenForDate])

  const handleCalendarClick = (dateKey) => {
    setCalendarOpenForDate(calendarOpenForDate === dateKey ? null : dateKey)
  }

  const handleCalendarDateSelect = (date) => {
    if (onDateChange) {
      onDateChange(date)
    }
    setCalendarOpenForDate(null)
  }

  const handleTodayClick = () => {
    if (onDateChange) {
      const today = new Date()
      console.log('[handleTodayClick] Calling onDateChange with:', format(today, 'yyyy-MM-dd'))
      onDateChange(today)
    }
  }


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

    // Don't trigger if we just finished resizing
    if (justFinishedResizingRef.current) {
      justFinishedResizingRef.current = false
      return
    }

    const gridElement = e.currentTarget
    const rect = gridElement.getBoundingClientRect()
    const yPosition = e.clientY - rect.top

    // Calculate start time from click position
    const startTime = calculateTimeFromY(yPosition)

    // Default end time: start + 15 minutes
    const [startHour, startMin] = startTime.split(':').map(Number)
    const endMinutes = startMin + 15
    let endHour = startHour + Math.floor(endMinutes / 60)
    let endMin = endMinutes % 60

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
    // Check if drag started from resize handle - if so, ignore this drag
    if (event.activatorEvent?.target?.closest('[data-resize-handle]')) {
      ignoreDragRef.current = true
      return
    }
    ignoreDragRef.current = false

    // Capture grab offset (distance from pointer to top-left of the dragged card)
    // so the drag preview aligns with the card, not the pointer
    const activeNode = event.active.node?.current
    if (activeNode && event.activatorEvent) {
      const rect = activeNode.getBoundingClientRect()
      grabOffsetRef.current = {
        x: event.activatorEvent.clientX - rect.left,
        y: event.activatorEvent.clientY - rect.top,
      }
    } else {
      grabOffsetRef.current = { x: 0, y: 0 }
    }

    // Handle holding pin cards (prefixed id) vs grid cards (event id directly)
    const data = event.active.data.current
    if (data?.source === 'holding-pin') {
      holdingPinEventRef.current = data.event.id
      setActiveId(data.event.id)
    } else {
      holdingPinEventRef.current = null
      setActiveId(event.active.id)
    }
  }

  // Helper: find the droppable column under a viewport point using live DOM rects.
  // This bypasses dnd-kit's cached rects which become stale when the container scrolls.
  const findDroppableAtPoint = (clientX, clientY) => {
    const elements = document.elementsFromPoint(clientX, clientY)
    const col = elements.find(el => el.dataset.droppableId)
    if (!col) return null
    return {
      memberId: col.dataset.memberId,
      date: col.dataset.date,
      rect: col.getBoundingClientRect(),
    }
  }

  const handleDragMove = (event) => {
    // Ignore if this drag started from resize handle
    if (ignoreDragRef.current) return

    const { delta, activatorEvent } = event

    if (!activeId) return

    // Current pointer position in viewport coordinates
    const currentPointerX = activatorEvent.clientX + delta.x
    const currentPointerY = activatorEvent.clientY + delta.y

    // Find which droppable column the pointer is actually over using live DOM hit-testing
    const target = findDroppableAtPoint(currentPointerX, currentPointerY)

    if (target) {
      setDragOverColumn(target.memberId)
      setDragOverDate(target.date)

      // Calculate slot based on where the card's top edge would land
      const cardTopY = currentPointerY - grabOffsetRef.current.y
      const yInGrid = cardTopY - target.rect.top
      const newSlot = Math.floor(yInGrid / SLOT_HEIGHT)
      const clampedSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, newSlot))
      setDragOverSlot(clampedSlot)
    }
    // When pointer is not over any droppable (e.g. day header gap),
    // keep the last valid preview state so the ghost doesn't disappear
  }

  const handleDragEnd = (event) => {
    // If this drag was from resize handle, just reset and ignore
    if (ignoreDragRef.current) {
      ignoreDragRef.current = false
      holdingPinEventRef.current = null
      setActiveId(null)
      setDragOverSlot(null)
      setDragOverColumn(null)
      setDragOverDate(null)
      return
    }

    const { active, delta, over, activatorEvent } = event

    const prevDragOverColumn = dragOverColumn
    const prevDragOverDate = dragOverDate
    const prevDragOverSlot = dragOverSlot

    setActiveId(null)
    setDragOverSlot(null)
    setDragOverColumn(null)
    setDragOverDate(null)

    // Use ref for holding-pin detection since the draggable may have unmounted mid-drag
    const isHoldingPin = holdingPinEventRef.current !== null
    const eventId = isHoldingPin ? holdingPinEventRef.current : active.id
    holdingPinEventRef.current = null
    const draggedEvent = events.find((e) => e.id === eventId)
    if (!draggedEvent) return

    // Check if dropped on a holding pin target (Unassigned pill)
    const dropTarget = over?.data?.current?.target
    if (dropTarget === 'unassigned') {
      const updatedEvent = { ...draggedEvent, assigneeId: null }
      if (onEventUpdate) onEventUpdate(updatedEvent)
      toast.success('Event moved to unassigned jobs')
      return
    }

    // For holding pin drags without a valid drop target, cancel
    if (isHoldingPin && !over && !prevDragOverColumn) {
      return
    }

    // Determine target column, date, and slot.
    // Use our manually-tracked state (from handleDragMove's live DOM detection) as primary
    // source so the drop always matches where the preview ghost was showing.
    let targetAssigneeId = draggedEvent.assigneeId
    let targetDate = draggedEvent.date
    let clampedSlot

    if (prevDragOverColumn && prevDragOverDate) {
      targetAssigneeId = prevDragOverColumn
      targetDate = prevDragOverDate
      clampedSlot = prevDragOverSlot !== null ? prevDragOverSlot : 0
    } else {
      // No tracked column (e.g. very short drag) - try live DOM detection at drop point
      const currentPointerX = activatorEvent.clientX + delta.x
      const currentPointerY = activatorEvent.clientY + delta.y
      const target = findDroppableAtPoint(currentPointerX, currentPointerY)
      if (target) {
        targetAssigneeId = target.memberId
        targetDate = target.date
        const cardTopY = currentPointerY - grabOffsetRef.current.y
        const yInGrid = cardTopY - target.rect.top
        const newSlot = Math.floor(yInGrid / SLOT_HEIGHT)
        clampedSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, newSlot))
      } else {
        // Last resort: same day, same column, delta-based calculation
        const originalOffset = calculateEventOffset(draggedEvent.startTime)
        const newOffset = originalOffset + delta.y
        const newSlot = Math.floor(newOffset / SLOT_HEIGHT)
        clampedSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, newSlot))
      }
    }

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

    // Show success message if assigned/reassigned to different person
    if (targetAssigneeId !== draggedEvent.assigneeId) {
      const targetMember = teamMembers.find(m => m.id === targetAssigneeId)
      const memberName = targetMember ? targetMember.name : 'team member'
      const verb = draggedEvent.assigneeId === null ? 'assigned' : 'reassigned'
      toast.success(`Event ${verb} to ${memberName}`)
    }

    if (onEventUpdate) {
      onEventUpdate(updatedEvent)
    }
  }

  const handleDragCancel = () => {
    ignoreDragRef.current = false
    holdingPinEventRef.current = null
    setActiveId(null)
    setDragOverSlot(null)
    setDragOverColumn(null)
    setDragOverDate(null)
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
      if (hasConflict(event.id, event.startTime, finalEndTime, event.date, event.assigneeId)) {
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
      justFinishedResizingRef.current = true
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  // Get the active event being dragged for the overlay
  const activeEvent = activeId ? events.find((e) => e.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      collisionDetection={pointerWithin}
    >
      <div
        ref={scrollContainerRef}
        tabIndex={-1}
        className="hidden md:flex md:flex-col flex-1 min-h-0 overflow-auto bg-gray-200 relative focus:outline-none"
      >
      {/* Content wrapper with min-width to enable horizontal scrolling */}
      <div style={{ minWidth: `${64 + filteredMembers.length * 150}px` }}>

      {/* Column Headers - Sticky at very top */}
      <div className="sticky top-0 z-40 bg-charcoal border-b border-secondary">
        <div className="flex">
          {/* Time label column header (spacer) - Sticky on left */}
          <div className="w-16 flex-shrink-0 bg-charcoal sticky left-0 z-10" />

          {/* Team member column headers */}
          <div className="flex flex-1">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="px-4 py-3 border-l border-secondary flex-shrink-0 flex-1"
                style={{ minWidth: '150px' }}
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
              className="sticky top-14 z-30 bg-gray-100 border-b-2 border-accent px-4 py-2"
            >
              <div className="flex items-center gap-3">
                {/* Calendar Icon Button */}
                <div className="relative" ref={calendarOpenForDate === dateKey ? calendarButtonRef : null}>
                  <button
                    onClick={() => handleCalendarClick(dateKey)}
                    className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-300 transition-colors"
                    aria-label="Open calendar"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>

                  {/* Calendar Popup */}
                  {calendarOpenForDate === dateKey && (
                    <CalendarPopup
                      selectedDate={selectedDate}
                      onDateSelect={handleCalendarDateSelect}
                      onClose={() => setCalendarOpenForDate(null)}
                    />
                  )}
                </div>

                {/* Date Text */}
                <h2 className="font-body text-xl uppercase text-gray-800 font-bold">
                  {format(dayDate, 'EEEE, MMMM d, yyyy')}
                </h2>

                {/* Today Badge or Button */}
                {isToday ? (
                  <span className="text-accent text-sm font-body font-semibold">Today</span>
                ) : (
                  <button
                    onClick={handleTodayClick}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full font-body text-xs font-semibold hover:bg-gray-400 transition-all"
                  >
                    Today
                  </button>
                )}
              </div>
            </div>

            {/* Grid Body for this day */}
            <div className="flex relative" style={{ height: `${TOTAL_SLOTS * SLOT_HEIGHT}px` }}>
              {/* Time labels column - Sticky on left */}
              <div className="w-16 flex-shrink-0 bg-gray-200 relative sticky left-0 z-10">
                {timeLabels.map((time, index) => {
                  const topPosition = index * SLOTS_PER_HOUR * SLOT_HEIGHT
                  return (
                    <div
                      key={time.hour}
                      className="absolute left-0 w-16 text-right pr-2 -translate-y-2"
                      style={{ top: `${topPosition}px` }}
                    >
                      <span className="text-xs font-body text-gray-500 uppercase">{time.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Grid content */}
              <div className="flex-1 relative">
                <div className="flex">
                  {/* Grid lines for each column */}
                  {filteredMembers.map((member, memberIndex) => (
                    <div
                      key={`grid-${member.id}`}
                      className="relative flex-shrink-0 flex-1"
                      style={{
                        minWidth: '150px',
                        borderLeft: memberIndex === 0 ? 'none' : '1px solid #D1D5DB',
                        height: `${TOTAL_SLOTS * SLOT_HEIGHT}px`,
                      }}
                    >
                      {/* Hour and 15-minute grid lines */}
                      {timeLabels.map((time, index) => {
                        const topPosition = index * SLOTS_PER_HOUR * SLOT_HEIGHT
                        return (
                          <div key={time.hour}>
                            {/* Hour line (heavier) */}
                            <div
                              className="absolute left-0 right-0 border-t border-gray-300"
                              style={{ top: `${topPosition}px` }}
                            />
                            {/* 15-minute grid lines (lighter) */}
                            {index < timeLabels.length - 1 && (
                              <>
                                <div
                                  className="absolute left-0 right-0 border-t border-gray-300/40"
                                  style={{ top: `${topPosition + SLOT_HEIGHT}px` }}
                                />
                                <div
                                  className="absolute left-0 right-0 border-t border-gray-300/40"
                                  style={{ top: `${topPosition + SLOT_HEIGHT * 2}px` }}
                                />
                                <div
                                  className="absolute left-0 right-0 border-t border-gray-300/40"
                                  style={{ top: `${topPosition + SLOT_HEIGHT * 3}px` }}
                                />
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Current time indicator - only show for today */}
                {isToday && currentTimeOffset !== null && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: `${currentTimeOffset}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <div className="flex-1 h-0.5 bg-accent" />
                    </div>
                  </div>
                )}

                {/* Event rendering areas - one per column */}
                <div className="absolute left-0 right-0 top-0 bottom-0 flex">
                  {filteredMembers.map((member, memberIndex) => {
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
                        onResizeStart={handleResizeStart}
                        resizingEvent={resizingEvent}
                        resizePreviewEndTime={resizePreviewEndTime}
                        calculateEventOffset={calculateEventOffset}
                        earlierHighlightMode={earlierHighlightMode}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      </div> {/* End content wrapper */}
      </div> {/* End scroll container */}

      {children}

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
      assigneeId: PropTypes.string,
      date: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
      status: PropTypes.string,
      notes: PropTypes.string,
      earlierOpening: PropTypes.bool,
    })
  ).isRequired,
  onDateChange: PropTypes.func,
  onSlotClick: PropTypes.func,
  onEventClick: PropTypes.func,
  onEventUpdate: PropTypes.func,
  roleFilter: PropTypes.oneOf(['all', 'tech', 'sales']),
  earlierHighlightMode: PropTypes.bool,
  children: PropTypes.node,
}
