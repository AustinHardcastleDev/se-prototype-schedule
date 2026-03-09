import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { format } from 'date-fns'
import { getAllMembers, getEventTypeByKey } from '../../utils/dataAccess'
import TechDayTimeline from './TechDayTimeline'

export default function MapSidebar({ event, isOpen, onClose, onAssign, events, selectedDate }) {
  const [selectedTechId, setSelectedTechId] = useState(null)
  const members = getAllMembers().filter(m => m.role === 'tech' || m.role === 'sales')

  // Reset selected tech when a new event is clicked
  useEffect(() => {
    setSelectedTechId(null)
  }, [event?.id])

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

  const canAssign = selectedTechId && selectedTechId !== event.assigneeId

  const handleAssign = () => {
    if (canAssign) {
      onAssign(event, selectedTechId)
    }
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
        {/* Job info */}
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

        {/* Tech selector */}
        <div className="px-5 py-3 border-b border-gray-100">
          <h5 className="font-body text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
            {isUnassigned ? 'Assign to' : 'Reassign to'}
          </h5>
          <div className="flex flex-col gap-1">
            {members.map(member => {
              const memberJobCount = events.filter(
                e => e.assigneeId === member.id && e.date === dateStr
              ).length
              const isSelected = selectedTechId === member.id
              const isCurrent = event.assigneeId === member.id

              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedTechId(isSelected ? null : member.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all font-body ${
                    isSelected
                      ? 'bg-accent/10 ring-1 ring-accent'
                      : isCurrent
                        ? 'bg-gray-50 opacity-50'
                        : 'hover:bg-gray-50'
                  }`}
                  disabled={isCurrent}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">
                      {member.name}
                      {isCurrent && <span className="text-gray-400 font-normal ml-1">(current)</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{memberJobCount} jobs</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected tech's day schedule */}
        {selectedTechId && (
          <div className="border-b border-gray-100">
            <div className="px-5 pt-3 pb-1">
              <h5 className="font-body text-xs font-bold text-gray-400 uppercase tracking-wide">
                {members.find(m => m.id === selectedTechId)?.name}&apos;s Schedule
              </h5>
            </div>
            <TechDayTimeline events={selectedTechEvents} highlightEventId={event.id} />
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="px-5 py-4 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={handleAssign}
          disabled={!canAssign}
          className={`w-full py-2.5 rounded-lg font-body text-sm font-bold uppercase tracking-wide transition-all ${
            canAssign
              ? 'bg-accent text-white hover:bg-accent/90 shadow-sm'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {isUnassigned ? 'Assign Job' : 'Reassign Job'}
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
  events: PropTypes.array.isRequired,
  selectedDate: PropTypes.instanceOf(Date).isRequired,
}
