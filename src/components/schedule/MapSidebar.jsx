import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { format } from 'date-fns'
import { getAllMembers, getEventTypeByKey } from '../../utils/dataAccess'
import SidebarTimeline from './SidebarTimeline'

export default function MapSidebar({ event, isOpen, onClose, onAssign, onEventUpdate, events, selectedDate }) {
  const [selectedTechId, setSelectedTechId] = useState(null)
  const [ghostStartTime, setGhostStartTime] = useState(null)
  const [ghostEndTime, setGhostEndTime] = useState(null)
  const [isAssigned, setIsAssigned] = useState(false)
  const members = getAllMembers().filter(m => m.role === 'tech' || m.role === 'sales')

  // Reset selected tech when a new event is clicked
  useEffect(() => {
    setSelectedTechId(null)
    setIsAssigned(false)
    setGhostStartTime(null)
    setGhostEndTime(null)
  }, [event?.id])

  // Initialize ghost position when tech selection changes
  useEffect(() => {
    if (selectedTechId && event) {
      setGhostStartTime(event.startTime)
      setGhostEndTime(event.endTime)
      setIsAssigned(false)
    } else {
      setGhostStartTime(null)
      setGhostEndTime(null)
    }
    // Only re-run when the selected tech changes, not on event object updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTechId])

  if (!event) return null

  const eventType = getEventTypeByKey(event.type)
  const isUnassigned = event.assigneeId === null
  const isEarlier = event.earlierOpening === true
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const selectedTechEvents = selectedTechId
    ? events.filter(e => e.assigneeId === selectedTechId && e.date === dateStr)
    : []

  const currentAssignee = event.assigneeId
    ? members.find(m => m.id === event.assigneeId)
    : null

  // Conflict detection for ghost card
  const hasGhostConflict = ghostStartTime && ghostEndTime && selectedTechId && selectedTechEvents.some(ev =>
    ev.id !== event.id && ghostStartTime < ev.endTime && ghostEndTime > ev.startTime
  )

  const canAssign = selectedTechId && !hasGhostConflict && !isAssigned

  const handleAssign = () => {
    if (canAssign && ghostStartTime && ghostEndTime) {
      onAssign(event, selectedTechId, ghostStartTime, ghostEndTime)
      setIsAssigned(true)
    }
  }

  const handleGhostTimeChange = (newStart, newEnd) => {
    setGhostStartTime(newStart)
    setGhostEndTime(newEnd)
  }

  return (
    <div
      className={`absolute top-0 right-0 h-full w-[380px] z-[1001] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="bg-charcoal px-5 py-4 flex items-center justify-between flex-shrink-0">
        <h3 className="font-body text-sm font-bold text-white uppercase tracking-wide">Job Details</h3>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Job info — collapses to compact bar when tech is selected */}
        {selectedTechId ? (
          <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: eventType?.color || '#6B7280' }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-body text-sm font-bold text-gray-900 truncate">{event.title}</div>
            </div>
            <span className="font-body text-xs text-gray-400 flex-shrink-0">
              {event.startTime} – {event.endTime}
            </span>
          </div>
        ) : (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: eventType?.color || '#6B7280' }}
              />
              <span className="text-xs font-semibold text-gray-500 uppercase font-body">
                {eventType?.label || event.type}
              </span>
            </div>
            <h4 className="font-body text-base font-bold text-gray-900 mb-1">{event.title}</h4>
            {event.address && (
              <p className="font-body text-sm text-gray-500 mb-1">{event.address}</p>
            )}
            <p className="font-body text-sm text-gray-600">
              {event.startTime} - {event.endTime}
            </p>
            {event.notes && (
              <p className="font-body text-xs text-gray-400 mt-2 leading-relaxed">{event.notes}</p>
            )}

            {/* Badges */}
            <div className="flex gap-2 mt-3">
              {isEarlier && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-body bg-amber-100 text-amber-700">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Earlier Opening
                </span>
              )}
              {isUnassigned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-body bg-gray-100 text-gray-500">
                  Unassigned
                </span>
              )}
              {currentAssignee && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-body text-white"
                  style={{ backgroundColor: currentAssignee.color }}
                >
                  {currentAssignee.name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tech selector dropdown */}
        <div className="px-5 py-3 border-b border-gray-100">
          <label className="font-body text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
            {isUnassigned ? 'Assign to' : 'Assign to'}
          </label>
          <div className="relative">
            <select
              value={selectedTechId || ''}
              onChange={(e) => setSelectedTechId(e.target.value || null)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 font-body text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors cursor-pointer"
            >
              <option value="">Select a tech...</option>
              {members.map(member => {
                const memberJobCount = events.filter(
                  e => e.assigneeId === member.id && e.date === dateStr
                ).length
                const isCurrent = event.assigneeId === member.id
                return (
                  <option key={member.id} value={member.id}>
                    {member.name}{isCurrent ? ' (current)' : ''} — {memberJobCount} jobs
                  </option>
                )
              })}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Selected tech's day schedule - interactive mini-timeline */}
        {selectedTechId && (
          <div className="border-b border-gray-100">
            <div className="px-5 pt-3 pb-1">
              <h5 className="font-body text-xs font-bold text-gray-400 uppercase tracking-wide">
                {members.find(m => m.id === selectedTechId)?.name}&apos;s Schedule
              </h5>
            </div>
            <div className="px-2 pb-2">
              <SidebarTimeline
                techEvents={selectedTechEvents}
                ghostEvent={event}
                ghostStartTime={ghostStartTime}
                ghostEndTime={ghostEndTime}
                onGhostTimeChange={handleGhostTimeChange}
                onEventUpdate={onEventUpdate}
                isAssigned={isAssigned}
                selectedDate={dateStr}
                techId={selectedTechId}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="px-5 py-4 border-t border-gray-200 flex-shrink-0">
        {hasGhostConflict && selectedTechId && (
          <p className="font-body text-xs text-red-500 font-semibold mb-2 text-center">
            Cannot assign — conflicts with existing event
          </p>
        )}
        <button
          onClick={handleAssign}
          disabled={!canAssign}
          className={`w-full py-2.5 rounded-lg font-body text-sm font-bold uppercase tracking-wide transition-all ${
            isAssigned
              ? 'bg-green-500 text-white cursor-default'
              : canAssign
                ? 'bg-accent text-white hover:bg-accent/90 shadow-sm'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {isAssigned ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Assigned
            </span>
          ) : selectedTechId === event.assigneeId ? 'Reschedule Job' : isUnassigned ? 'Assign Job' : 'Reassign Job'}
        </button>
      </div>
    </div>
  )
}

MapSidebar.propTypes = {
  event: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  onEventUpdate: PropTypes.func,
  events: PropTypes.array.isRequired,
  selectedDate: PropTypes.instanceOf(Date).isRequired,
}
