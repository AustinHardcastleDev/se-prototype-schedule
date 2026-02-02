import { useState } from 'react'
import { format } from 'date-fns'
import WeekStrip from '../components/schedule/WeekStrip'
import TimeGrid from '../components/schedule/TimeGrid'
import FloatingActionButton from '../components/schedule/FloatingActionButton'
import TeamMemberSwitcher from '../components/schedule/TeamMemberSwitcher'
import CreateEventModal from '../components/schedule/CreateEventModal'
import { getAllMembers, getEventsForDate } from '../utils/dataAccess'

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Default to first team member (current user)
  const allMembers = getAllMembers()
  const [selectedMember, setSelectedMember] = useState(allMembers[0])

  // Load initial events from data
  const initialEvents = getEventsForDate(format(new Date(), 'yyyy-MM-dd'))
  const [events, setEvents] = useState(initialEvents)

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createModalDefaults, setCreateModalDefaults] = useState({})

  const handleDateSelect = (date) => {
    setSelectedDate(date)
  }

  const handleEventTypeSelect = (eventType) => {
    // Open create event modal with pre-selected event type
    setCreateModalDefaults({
      eventType: eventType.key,
      assigneeId: selectedMember.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
    })
    setIsCreateModalOpen(true)
  }

  const handleMemberSelect = (member) => {
    setSelectedMember(member)
  }

  const handleCreateEvent = (newEvent) => {
    // Add new event to state
    setEvents([...events, newEvent])
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week Strip - Mobile Only */}
      <WeekStrip selectedDate={selectedDate} onDateSelect={handleDateSelect} />

      {/* Time Grid - Mobile Day Agenda View */}
      <TimeGrid selectedDate={selectedDate} selectedMember={selectedMember} events={events} />

      {/* Team Member Switcher - Mobile Only - Bottom Left */}
      <TeamMemberSwitcher selectedMember={selectedMember} onMemberSelect={handleMemberSelect} />

      {/* Floating Action Button - Mobile Only - Bottom Right */}
      <FloatingActionButton onEventTypeSelect={handleEventTypeSelect} />

      {/* Create Event Modal - Mobile Only */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSave={handleCreateEvent}
        defaults={createModalDefaults}
      />
    </div>
  )
}
