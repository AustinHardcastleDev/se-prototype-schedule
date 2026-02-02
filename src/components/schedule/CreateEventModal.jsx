import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { format } from 'date-fns'
import { getEventTypes, getAllMembers } from '../../utils/dataAccess'

export default function CreateEventModal({ isOpen, onClose, onSave, defaults = {} }) {
  const eventTypes = getEventTypes()
  const allMembers = getAllMembers()

  // Generate time options (6:00 AM - 8:00 PM in 15-minute increments)
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 6; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Don't include times after 8:00 PM
        if (hour === 20 && minute > 0) break

        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const period = hour >= 12 ? 'PM' : 'AM'
        const displayStr = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`

        options.push({ value: timeStr, label: displayStr })
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  // Form state
  const [eventType, setEventType] = useState(defaults.eventType || eventTypes[0].key)
  const [assigneeId, setAssigneeId] = useState(defaults.assigneeId || allMembers[0].id)
  const [date, setDate] = useState(defaults.date || format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(defaults.startTime || '09:00')
  const [endTime, setEndTime] = useState(defaults.endTime || '10:00')
  const [title, setTitle] = useState('')
  const [validationError, setValidationError] = useState('')

  // Reset form when modal opens with new defaults
  useEffect(() => {
    if (isOpen) {
      setEventType(defaults.eventType || eventTypes[0].key)
      setAssigneeId(defaults.assigneeId || allMembers[0].id)
      setDate(defaults.date || format(new Date(), 'yyyy-MM-dd'))
      setStartTime(defaults.startTime || '09:00')
      setEndTime(defaults.endTime || '10:00')
      setTitle('')
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

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate times
    if (!validateTimes(startTime, endTime)) {
      setValidationError('End time must be after start time')
      return
    }

    // Create new event object
    const newEvent = {
      id: `evt-${Date.now()}`,
      title,
      type: eventType,
      assigneeId,
      date,
      startTime,
      endTime,
      status: 'open' // Default status for new events
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

  const selectedEventType = eventTypes.find(et => et.key === eventType)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet Modal */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-muted rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-6 pb-4 border-b border-secondary">
          <h2 className="font-heading text-2xl text-text-dark uppercase">Create Event</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* Event Type Dropdown */}
          <div className="mb-4">
            <label htmlFor="eventType" className="block text-sm font-body text-text-dark font-semibold mb-2">
              Event Type
            </label>
            <div className="relative">
              <select
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-3 bg-secondary text-text-light rounded-lg appearance-none font-body text-sm pr-10"
              >
                {eventTypes.map((et) => (
                  <option key={et.key} value={et.key}>
                    {et.label}
                  </option>
                ))}
              </select>
              {/* Color Indicator */}
              <div
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
                style={{ backgroundColor: selectedEventType?.borderColor }}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Person Dropdown */}
          <div className="mb-4">
            <label htmlFor="assignee" className="block text-sm font-body text-text-dark font-semibold mb-2">
              Person
            </label>
            <select
              id="assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-4 py-3 bg-secondary text-text-light rounded-lg appearance-none font-body text-sm"
            >
              {allMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-body text-text-dark font-semibold mb-2">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-secondary text-text-light rounded-lg font-body text-sm"
            />
          </div>

          {/* Start Time */}
          <div className="mb-4">
            <label htmlFor="startTime" className="block text-sm font-body text-text-dark font-semibold mb-2">
              Start Time
            </label>
            <select
              id="startTime"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value)
                setValidationError('')
              }}
              className="w-full px-4 py-3 bg-secondary text-text-light rounded-lg appearance-none font-body text-sm"
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* End Time */}
          <div className="mb-4">
            <label htmlFor="endTime" className="block text-sm font-body text-text-dark font-semibold mb-2">
              End Time
            </label>
            <select
              id="endTime"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value)
                setValidationError('')
              }}
              className="w-full px-4 py-3 bg-secondary text-text-light rounded-lg appearance-none font-body text-sm"
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="mb-4 px-4 py-2 bg-rose-100 text-time-off rounded-lg text-sm font-body">
              {validationError}
            </div>
          )}

          {/* Title Input */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-body text-text-dark font-semibold mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              className="w-full px-4 py-3 bg-secondary text-text-light rounded-lg font-body text-sm placeholder-muted"
              required
            />
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
}
