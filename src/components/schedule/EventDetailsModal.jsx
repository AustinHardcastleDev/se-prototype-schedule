import PropTypes from 'prop-types'
import { getEventTypeByKey, getMemberById } from '../../utils/dataAccess'

export default function EventDetailsModal({ isOpen, onClose, onEdit, event }) {
  if (!isOpen || !event) return null

  const eventType = getEventTypeByKey(event.type)
  const assignee = getMemberById(event.assigneeId)

  // Format time for display (HH:MM to h:MM AM/PM)
  const formatTime = (timeStr) => {
    const [hour, minute] = timeStr.split(':').map(Number)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  // Format date for display (YYYY-MM-DD to Month DD, YYYY)
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00') // Add time to avoid timezone issues
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Status labels for display
  const STATUS_LABELS = {
    'open': 'Open',
    'closed-no-invoice': 'Closed - No Invoice',
    'closed-invoiced': 'Closed - Invoiced',
  }

  const DetailsContent = () => (
    <div className="px-6 py-4">
      {/* Event Type with color indicator */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: eventType.borderColor }}
        />
        <div>
          <div className="text-xs font-body text-muted uppercase">Event Type</div>
          <div className="text-base font-body text-text-dark font-semibold">{eventType.label}</div>
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <div className="text-xs font-body text-muted uppercase mb-1">Title</div>
        <div className="text-lg font-body text-text-dark font-semibold">{event.title}</div>
      </div>

      {/* Assignee */}
      <div className="mb-4">
        <div className="text-xs font-body text-muted uppercase mb-1">Assigned To</div>
        <div className="text-base font-body text-text-dark">{assignee ? assignee.name : <span className="text-rose-500 font-semibold">Unassigned</span>}</div>
      </div>

      {/* Date */}
      <div className="mb-4">
        <div className="text-xs font-body text-muted uppercase mb-1">Date</div>
        <div className="text-base font-body text-text-dark">{formatDate(event.date)}</div>
      </div>

      {/* Time */}
      <div className="mb-4">
        <div className="text-xs font-body text-muted uppercase mb-1">Time</div>
        <div className="text-base font-body text-text-dark">
          {formatTime(event.startTime)} – {formatTime(event.endTime)}
        </div>
      </div>

      {/* Status (only for job events) */}
      {event.status && (
        <div className="mb-4">
          <div className="text-xs font-body text-muted uppercase mb-1">Status</div>
          <div className="text-base font-body text-text-dark">{STATUS_LABELS[event.status] || event.status}</div>
        </div>
      )}

      {/* Notes */}
      {event.notes && (
        <div className="mb-4">
          <div className="text-xs font-body text-muted uppercase mb-1 flex items-center gap-1">
            <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            Prep Notes
          </div>
          <div className="text-sm font-body text-text-dark bg-blue-50 rounded-lg px-3 py-2">{event.notes}</div>
        </div>
      )}

      {/* View Full Details Link (placeholder) */}
      <div className="pt-4 border-t border-secondary">
        <button
          type="button"
          className="text-accent font-body text-sm hover:brightness-110 transition-all"
          onClick={(e) => e.preventDefault()}
        >
          View full details
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Backdrop - both mobile and desktop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet Modal - Mobile */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-muted rounded-full" />
        </div>

        {/* Modal Header with Pencil Icon */}
        <div className="px-6 pb-4 border-b border-secondary flex items-center justify-between">
          <h2 className="font-body text-2xl text-text-dark uppercase font-bold">Event Details</h2>
          <button
            type="button"
            onClick={onEdit}
            className="p-2 hover:bg-secondary rounded-lg transition-all"
            aria-label="Edit event"
          >
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* Details Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          <DetailsContent />
        </div>
      </div>

      {/* Centered Modal - Desktop */}
      <div
        className={`hidden md:block fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 w-[480px] max-h-[80vh] overflow-hidden ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        } transition-all duration-200`}
      >
        {/* Modal Header with Pencil Icon */}
        <div className="px-6 py-4 border-b border-secondary flex items-center justify-between">
          <h2 className="font-body text-2xl text-text-dark uppercase font-bold">Event Details</h2>
          <button
            type="button"
            onClick={onEdit}
            className="p-2 hover:bg-secondary rounded-lg transition-all"
            aria-label="Edit event"
          >
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* Details Content */}
        <div className="max-h-[calc(80vh-80px)] overflow-y-auto">
          <DetailsContent />
        </div>
      </div>
    </>
  )
}

EventDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  event: PropTypes.shape({
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
  }),
}
