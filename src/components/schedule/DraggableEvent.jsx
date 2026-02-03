import PropTypes from 'prop-types'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import EventCard from './EventCard'

export default function DraggableEvent({ event, onEventClick, onResizeStart, isDragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: { event },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    transition: isDragging ? 'none' : 'transform 150ms ease',
  }

  const handleClick = (e) => {
    // Only trigger onClick if not currently dragging
    if (!isDragging && e.detail === 1) {
      onEventClick(event)
    }
  }

  // Filter out drag listeners for the resize handle
  const dragListeners = {
    ...listeners,
    onPointerDown: (e) => {
      // Don't start drag if clicking on the resize handle
      if (e.target.closest('[class*="cursor-ns-resize"]')) {
        return
      }
      if (listeners.onPointerDown) {
        listeners.onPointerDown(e)
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
}
