import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'
import { getEventTypes, getAllMembers } from '../../utils/dataAccess'
import CustomDropdown from '../ui/CustomDropdown'
import TimePicker from '../ui/TimePicker'

export default function CreateEventModal({ isOpen, onClose, onSave, defaults = {}, events = [] }) {
  const eventTypes = getEventTypes()
  const allMembers = getAllMembers()

  // Calculate end time based on start time and event type duration
  const calculateEndTime = (start, typeKey) => {
    const type = eventTypes.find(t => t.key === typeKey)
    const duration = type?.defaultDuration || 15
    const [startHour, startMin] = start.split(':').map(Number)
    const totalMinutes = startHour * 60 + startMin + duration
    const endHour = Math.min(Math.floor(totalMinutes / 60), 20) // Cap at 8 PM
    const endMin = totalMinutes % 60
    return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
  }

  // Form state
  const initialType = defaults.eventType || eventTypes[0].key
  const initialStart = defaults.startTime || '09:00'
  const [eventType, setEventType] = useState(initialType)
  const [assigneeId, setAssigneeId] = useState(defaults.assigneeId || allMembers[0].id)
  const [date, setDate] = useState(defaults.date || format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(initialStart)
  const [endTime, setEndTime] = useState(defaults.endTime || calculateEndTime(initialStart, initialType))
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [earlierOpening, setEarlierOpening] = useState(false)
  const [validationError, setValidationError] = useState('')

  // Reset form when modal opens with new defaults
  useEffect(() => {
    if (isOpen) {
      const type = defaults.eventType || eventTypes[0].key
      const start = defaults.startTime || '09:00'
      setEventType(type)
      setAssigneeId(defaults.assigneeId || allMembers[0].id)
      setDate(defaults.date || format(new Date(), 'yyyy-MM-dd'))
      setStartTime(start)
      setEndTime(defaults.endTime || calculateEndTime(start, type))
      setTitle('')
      setNotes('')
      setEarlierOpening(false)
      setValidationError('')
    }
  }, [isOpen, defaults, eventTypes, allMembers])

  // Validate end time is after start time
  const validateTimes = (start, end) => {
    const [startHour, startMinute] = start.split(':').map(Number)
    const [endHour, endMinute] = end.split(':').map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    return endMinutes > startMinutes
  }

  // Check if two events overlap (same logic as drag-and-drop)
  const eventsOverlap = (event1Start, event1End, event2Start, event2End) => {
    return event1Start < event2End && event1End > event2Start
  }

  // Check for conflicts with existing events for the same person on the same date
  const hasConflict = (newStartTime, newEndTime, newDate, newAssigneeId) => {
    return events.some((existingEvent) => {
      // Only check events for the same person on the same date
      if (existingEvent.date !== newDate || existingEvent.assigneeId !== newAssigneeId) {
        return false
      }

      // Check if time ranges overlap
      return eventsOverlap(newStartTime, newEndTime, existingEvent.startTime, existingEvent.endTime)
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate times
    if (!validateTimes(startTime, endTime)) {
      setValidationError('End time must be after start time')
      return
    }

    // Check for conflicts
    if (hasConflict(startTime, endTime, date, assigneeId)) {
      toast.error('Cannot create event - conflicts with existing event')
      return // Keep modal open so user can adjust times
    }

    // Create new event object
    const newEvent = {
      id: `evt-${Date.now()}`,
      title,
      type: eventType,
      assigneeId: assigneeId || null,
      date,
      startTime,
      endTime,
      status: 'open', // Default status for new events
      ...(notes.trim() && { notes: notes.trim() }),
      ...(earlierOpening && { earlierOpening: true }),
    }

    onSave(newEvent)
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  // Render form fields inline to avoid component recreation on state changes
  const renderFormFields = (idPrefix = '') => (
    <>
      {/* Event Type Dropdown */}
      <CustomDropdown
        id={`eventType${idPrefix}`}
        label="Event Type"
        value={eventType}
        onChange={(value) => {
          setEventType(value)
          // Auto-update end time based on new event type's default duration
          setEndTime(calculateEndTime(startTime, value))
        }}
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
      <div className="mb-4">
        <label htmlFor={`date${idPrefix}`} className="block text-sm font-body text-text-light font-semibold mb-2">
          Date
        </label>
        <input
          type="date"
          id={`date${idPrefix}`}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 text-white rounded-lg font-body text-sm"
        />
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
      <div className="flex gap-3 pb-4">
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
    </>
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
          <h2 className="font-body text-2xl text-text-light uppercase font-bold">Create Event</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {renderFormFields('')}
        </form>
      </div>

      {/* Centered Modal - Desktop */}
      <div
        className={`hidden md:block fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-charcoal rounded-2xl z-50 w-[480px] max-h-[80vh] overflow-hidden ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        } transition-all duration-200`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-body text-2xl text-text-light uppercase font-bold">Create Event</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[calc(80vh-80px)] overflow-y-auto">
          {renderFormFields('-desktop')}
        </form>
      </div>
    </>
  )
}

CreateEventModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  defaults: PropTypes.shape({
    eventType: PropTypes.string,
    assigneeId: PropTypes.string,
    date: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
  }),
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
  ),
}
