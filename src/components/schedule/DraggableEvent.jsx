import { useRef } from 'react'
import PropTypes from 'prop-types'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import EventCard from './EventCard'

export default function DraggableEvent({ event, onEventClick, onResizeStart, isDragging, earlierHighlightMode = false }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: { event },
  })

  const pointerDownRef = useRef(null)
  const hasDraggedRef = useRef(false)

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    transition: isDragging ? 'none' : 'transform 150ms ease',
  }

  const handleClick = (e) => {
    // Only trigger onClick if not currently dragging and didn't drag
    if (!isDragging && !hasDraggedRef.current && e.detail === 1) {
      onEventClick(event)
    }
    // Reset drag tracking
    hasDraggedRef.current = false
    pointerDownRef.current = null
  }

  // Filter out drag listeners for the resize handle and track drag vs click
  const isResizeHandleRef = useRef(false)

  const dragListeners = {
    ...listeners,
    onPointerDown: (e) => {
      // Don't start drag if clicking on the resize handle
      if (e.target.closest('[data-resize-handle]')) {
        isResizeHandleRef.current = true
        return
      }

      isResizeHandleRef.current = false

      // Track pointer down position
      pointerDownRef.current = { x: e.clientX, y: e.clientY }
      hasDraggedRef.current = false

      if (listeners.onPointerDown) {
        listeners.onPointerDown(e)
      }
    },
    onPointerMove: (e) => {
      // Don't process move events if we started on resize handle
      if (isResizeHandleRef.current) {
        return
      }

      // If pointer has moved significantly from down position, it's a drag
      if (pointerDownRef.current) {
        const dx = Math.abs(e.clientX - pointerDownRef.current.x)
        const dy = Math.abs(e.clientY - pointerDownRef.current.y)
        if (dx > 5 || dy > 5) {
          hasDraggedRef.current = true
        }
      }

      if (listeners.onPointerMove) {
        listeners.onPointerMove(e)
      }
    },
    onPointerUp: (e) => {
      // Reset resize handle tracking
      isResizeHandleRef.current = false

      if (listeners.onPointerUp) {
        listeners.onPointerUp(e)
      }
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...dragListeners}
      onClick={handleClick}
    >
      <EventCard
        event={event}
        disableInteraction={true}
        disableResize={false}
        onResizeStart={onResizeStart}
        earlierHighlightMode={earlierHighlightMode}
      />
    </div>
  )
}

DraggableEvent.propTypes = {
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
  onEventClick: PropTypes.func.isRequired,
  onResizeStart: PropTypes.func,
  isDragging: PropTypes.bool,
  earlierHighlightMode: PropTypes.bool,
}
