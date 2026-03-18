import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { format, parseISO } from 'date-fns'
import { getEventTypes, getAllMembers } from '../../utils/dataAccess'
import CustomDropdown from '../ui/CustomDropdown'
import TimePicker from '../ui/TimePicker'
import CalendarPopup from '../ui/CalendarPopup'

export default function EditEventModal({ isOpen, onClose, onSave, onDelete, event }) {
  const eventTypes = getEventTypes()
  const allMembers = getAllMembers()

  // Form state - will be pre-populated from event prop
  const [eventType, setEventType] = useState(event?.type || eventTypes[0].key)
  const [assigneeId, setAssigneeId] = useState(event?.assigneeId || '')
  const [date, setDate] = useState(event?.date || format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(event?.startTime || '09:00')
  const [endTime, setEndTime] = useState(event?.endTime || '10:00')
  const [title, setTitle] = useState(event?.title || '')
  const [notes, setNotes] = useState(event?.notes || '')
  const [earlierOpening, setEarlierOpening] = useState(event?.earlierOpening || false)
  const [validationError, setValidationError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  // Reset form when modal opens with event data
  useEffect(() => {
    if (isOpen && event) {
      setEventType(event.type)
      setAssigneeId(event.assigneeId || '')
      setDate(event.date)
      setStartTime(event.startTime)
      setEndTime(event.endTime)
      setTitle(event.title)
      setNotes(event.notes || '')
      setEarlierOpening(event.earlierOpening || false)
      setValidationError('')
      setShowDeleteConfirm(false)
      setShowCalendar(false)
    }
  }, [isOpen, event])

  // Validate end time is after start time
  const validateTimes = (start, end) => {
    const [startHour, startMinute] = start.split(':').map(Number)
    const [endHour, endMinute] = end.split(':').map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    return endMinutes > startMinutes
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate times
    if (!validateTimes(startTime, endTime)) {
      setValidationError('End time must be after start time')
      return
    }

    // Create updated event object
    const updatedEvent = {
      ...event,
      title,
      type: eventType,
      assigneeId: assigneeId || null,
      date,
      startTime,
      endTime,
      notes: notes.trim() || undefined,
      earlierOpening,
    }

    onSave(updatedEvent)
    onClose()
  }

  const handleCancel = () => {
    setShowDeleteConfirm(false)
    onClose()
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    onDelete(event.id)
    onClose()
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !event) return null

  // Render form fields inline to avoid component recreation on state changes
  const renderFormFields = (idPrefix = '') => (
    <>
      {/* Event Type Dropdown */}
      <CustomDropdown
        id={`eventType${idPrefix}`}
        label="Event Type"
        value={eventType}
        onChange={(value) => setEventType(value)}
        options={eventTypes.map((et) => ({ value: et.key, label: et.label }))}
        showColorDots={true}
        getColorForOption={(key) => {
          const et = eventTypes.find(t => t.key === key)
          return et?.borderColor
        }}
      />

      {/* Person Dropdown */}
      <CustomDropdown
        id={`assignee${idPrefix}`}
        label="Person"
        value={assigneeId}
        onChange={(value) => setAssigneeId(value)}
        options={[
          { value: '', label: 'Unassigned' },
          ...allMembers.map((member) => ({ value: member.id, label: member.name })),
        ]}
      />

      {/* Date Picker */}
      <div className="mb-4 relative">
        <label htmlFor={`date${idPrefix}`} className="block text-sm font-body text-text-light font-semibold mb-2">
          Date
        </label>
        <button
          type="button"
          id={`date${idPrefix}`}
          onClick={() => setShowCalendar(!showCalendar)}
          className="w-full px-4 py-3 bg-white/10 text-white rounded-lg font-body text-sm text-left flex items-center justify-between"
        >
          <span>{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</span>
          <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        {showCalendar && (
          <CalendarPopup
            selectedDate={parseISO(date)}
            onDateSelect={(newDate) => {
              setDate(format(newDate, 'yyyy-MM-dd'))
            }}
            onClose={() => setShowCalendar(false)}
          />
        )}
      </div>

      {/* Start Time */}
      <TimePicker
        id={`startTime${idPrefix}`}
        label="Start Time"
        value={startTime}
        onChange={(value) => {
          setStartTime(value)
          setValidationError('')
        }}
      />

      {/* End Time */}
      <TimePicker
        id={`endTime${idPrefix}`}
        label="End Time"
        value={endTime}
        onChange={(value) => {
          setEndTime(value)
          setValidationError('')
        }}
      />

      {/* Validation Error */}
      {validationError && (
        <div className="mb-4 px-4 py-2 bg-rose-100 text-time-off rounded-lg text-sm font-body">
          {validationError}
        </div>
      )}

      {/* Title Input */}
      <div className="mb-4">
        <label htmlFor={`title${idPrefix}`} className="block text-sm font-body text-text-light font-semibold mb-2">
          Title
        </label>
        <input
          type="text"
          id={`title${idPrefix}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter event title"
          className="w-full px-4 py-3 bg-white/10 text-white rounded-lg font-body text-sm placeholder-muted"
          required
        />
      </div>

      {/* Notes Input */}
      <div className="mb-6">
        <label htmlFor={`notes${idPrefix}`} className="block text-sm font-body text-text-light font-semibold mb-2 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
          </svg>
          Prep Notes
          <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          id={`notes${idPrefix}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add prep notes, special instructions, or details for the tech..."
          rows={3}
          className="w-full px-4 py-3 bg-white/10 text-white rounded-lg font-body text-sm placeholder-muted resize-none"
        />
      </div>

      {/* Earlier Opening Checkbox */}
      <div className="mb-6 flex items-center gap-2.5">
        <input
          type="checkbox"
          id={`earlierOpening${idPrefix}`}
          checked={earlierOpening}
          onChange={(e) => setEarlierOpening(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
        />
        <label htmlFor={`earlierOpening${idPrefix}`} className="text-sm font-body text-text-light cursor-pointer">
          Do earlier if possible
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pb-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-6 py-3 bg-secondary text-text-light rounded-full font-body font-semibold text-sm hover:brightness-110 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-accent text-white rounded-full font-body font-semibold text-sm hover:brightness-110 transition-all"
          >
            Save
          </button>
        </div>
        <button
          type="button"
          onClick={handleDeleteClick}
          className="w-full px-6 py-3 text-time-off font-body font-semibold text-sm hover:brightness-110 transition-all"
        >
          Delete Event
        </button>
      </div>
    </>
  )

  // Delete confirmation view as render function
  const renderDeleteConfirmation = () => (
    <div className="px-6 py-8">
      <p className="text-center font-body text-text-light mb-6">
        Are you sure you want to delete this event?
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCancelDelete}
          className="flex-1 px-6 py-3 bg-secondary text-text-light rounded-full font-body font-semibold text-sm hover:brightness-110 transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirmDelete}
          className="flex-1 px-6 py-3 bg-time-off text-white rounded-full font-body font-semibold text-sm hover:brightness-110 transition-all"
        >
          Delete
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
        className={`fixed bottom-0 left-0 right-0 bg-charcoal rounded-t-2xl z-50 md:hidden transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-6 pb-4 border-b border-white/10">
          <h2 className="font-body text-2xl text-text-light uppercase font-bold">Edit Event</h2>
        </div>

        {/* Delete Confirmation or Form */}
        {showDeleteConfirm ? (
          renderDeleteConfirmation()
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {renderFormFields('')}
          </form>
        )}
      </div>

      {/* Centered Modal - Desktop */}
      <div
        className={`hidden md:block fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-charcoal rounded-2xl z-50 w-[480px] max-h-[80vh] overflow-hidden ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        } transition-all duration-200`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-body text-2xl text-text-light uppercase font-bold">Edit Event</h2>
        </div>

        {/* Delete Confirmation or Form */}
        {showDeleteConfirm ? (
          renderDeleteConfirmation()
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[calc(80vh-80px)] overflow-y-auto">
            {renderFormFields('-desktop')}
          </form>
        )}
      </div>
    </>
  )
}

EditEventModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
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
