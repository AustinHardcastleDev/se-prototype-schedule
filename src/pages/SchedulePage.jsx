import { useState } from 'react'
import { format } from 'date-fns'
import WeekStrip from '../components/schedule/WeekStrip'
import TimeGrid from '../components/schedule/TimeGrid'
import DesktopTimeGrid from '../components/schedule/DesktopTimeGrid'
import FloatingActionButton from '../components/schedule/FloatingActionButton'
import TeamMemberSwitcher from '../components/schedule/TeamMemberSwitcher'
import CreateEventModal from '../components/schedule/CreateEventModal'
import EditEventModal from '../components/schedule/EditEventModal'
import DesktopDatePicker from '../components/schedule/DesktopDatePicker'
import { getAllMembers, getAllEvents } from '../utils/dataAccess'

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Default to first team member (current user)
  const allMembers = getAllMembers()
  const [selectedMember, setSelectedMember] = useState(allMembers[0])

  // Load all events from data (TimeGrid will filter by date and member)
  const allEvents = getAllEvents()
  const [events, setEvents] = useState(allEvents)

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createModalDefaults, setCreateModalDefaults] = useState({})
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

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

  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setIsEditModalOpen(true)
  }

  const handleLongPressSlot = ({ startTime, endTime }) => {
    // Open create modal with pre-filled time from long-pressed slot
    setCreateModalDefaults({
      assigneeId: selectedMember.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime,
      endTime,
    })
    setIsCreateModalOpen(true)
  }

  const handleDesktopSlotClick = ({ memberId, date, startTime, endTime }) => {
    // Open create modal with pre-filled time and person from clicked slot
    setCreateModalDefaults({
      assigneeId: memberId,
      date,
      startTime,
      endTime,
    })
    setIsCreateModalOpen(true)
  }

  const handleUpdateEvent = (updatedEvent) => {
    // Update event in state
    setEvents(events.map((evt) => (evt.id === updatedEvent.id ? updatedEvent : evt)))
  }

  const handleDeleteEvent = (eventId) => {
    // Remove event from state
    setEvents(events.filter((evt) => evt.id !== eventId))
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedEvent(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Desktop Date Picker Bar - Desktop Only */}
      <DesktopDatePicker selectedDate={selectedDate} onDateChange={handleDateSelect} />

      {/* Week Strip - Mobile Only */}
      <WeekStrip selectedDate={selectedDate} onDateSelect={handleDateSelect} />

      {/* Time Grid - Mobile Day Agenda View - Mobile Only */}
      <div className="md:hidden flex flex-col flex-1">
        <TimeGrid
          selectedDate={selectedDate}
          selectedMember={selectedMember}
          events={events}
          onEventClick={handleEventClick}
          onLongPressSlot={handleLongPressSlot}
          onEventUpdate={handleUpdateEvent}
        />
      </div>

      {/* Desktop Time Grid - Multi-Column View - Desktop Only */}
      <DesktopTimeGrid
        selectedDate={selectedDate}
        events={events}
        onDateChange={handleDateSelect}
        onSlotClick={handleDesktopSlotClick}
        onEventClick={handleEventClick}
        onEventUpdate={handleUpdateEvent}
      />

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

      {/* Edit Event Modal - Mobile Only */}
      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
      />
    </div>
  )
}
