import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { format } from 'date-fns'
import { getEventTypes, getAllMembers } from '../../utils/dataAccess'
import CustomDropdown from '../ui/CustomDropdown'
import TimePicker from '../ui/TimePicker'

export default function EditEventModal({ isOpen, onClose, onSave, onDelete, event }) {
  const eventTypes = getEventTypes()
  const allMembers = getAllMembers()

  // Form state - will be pre-populated from event prop
  const [eventType, setEventType] = useState(event?.type || eventTypes[0].key)
  const [assigneeId, setAssigneeId] = useState(event?.assigneeId || allMembers[0].id)
  const [date, setDate] = useState(event?.date || format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(event?.startTime || '09:00')
  const [endTime, setEndTime] = useState(event?.endTime || '10:00')
  const [title, setTitle] = useState(event?.title || '')
  const [validationError, setValidationError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset form when modal opens with event data
  useEffect(() => {
    if (isOpen && event) {
      setEventType(event.type)
      setAssigneeId(event.assigneeId)
      setDate(event.date)
      setStartTime(event.startTime)
      setEndTime(event.endTime)
      setTitle(event.title)
      setValidationError('')
      setShowDeleteConfirm(false)
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
      assigneeId,
      date,
      startTime,
      endTime,
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

  // Shared form fields component
  const FormFields = ({ idPrefix = '' }) => (
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
        options={allMembers.map((member) => ({ value: member.id, label: member.name }))}
      />

      {/* Date Picker */}
      <div className="mb-4">
        <label htmlFor={`date${idPrefix}`} className="block text-sm font-body text-text-dark font-semibold mb-2">
          Date
        </label>
        <input
          type="date"
          id={`date${idPrefix}`}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 bg-secondary text-text-light rounded-lg font-body text-sm"
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
      <div className="mb-6">
        <label htmlFor={`title${idPrefix}`} className="block text-sm font-body text-text-dark font-semibold mb-2">
          Title
        </label>
        <input
          type="text"
          id={`title${idPrefix}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter event title"
          className="w-full px-4 py-3 bg-secondary text-text-light rounded-lg font-body text-sm placeholder-muted"
          required
        />
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

  FormFields.propTypes = {
    idPrefix: PropTypes.string
  }

  // Delete confirmation view
  const DeleteConfirmation = () => (
    <div className="px-6 py-8">
      <p className="text-center font-body text-text-dark mb-6">
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
          <h2 className="font-body text-2xl text-text-dark uppercase font-bold">Edit Event</h2>
        </div>

        {/* Delete Confirmation or Form */}
        {showDeleteConfirm ? (
          <DeleteConfirmation />
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <FormFields idPrefix="" />
          </form>
        )}
      </div>

      {/* Centered Modal - Desktop */}
      <div
        className={`hidden md:block fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 w-[480px] max-h-[80vh] overflow-hidden ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        } transition-all duration-200`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-secondary">
          <h2 className="font-body text-2xl text-text-dark uppercase font-bold">Edit Event</h2>
        </div>

        {/* Delete Confirmation or Form */}
        {showDeleteConfirm ? (
          <DeleteConfirmation />
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[calc(80vh-80px)] overflow-y-auto">
            <FormFields idPrefix="-desktop" />
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
    assigneeId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
    status: PropTypes.string,
  }),
}
