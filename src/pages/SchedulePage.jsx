import { useState } from 'react'
import { format } from 'date-fns'
import WeekStrip from '../components/schedule/WeekStrip'
import TimeGrid from '../components/schedule/TimeGrid'
import SplitTimeGrid from '../components/schedule/SplitTimeGrid'
import DesktopTimeGrid from '../components/schedule/DesktopTimeGrid'
import FloatingActionButton from '../components/schedule/FloatingActionButton'
import DesktopFloatingPanel from '../components/schedule/DesktopFloatingPanel'
import TeamMemberSwitcher from '../components/schedule/TeamMemberSwitcher'
import CreateEventModal from '../components/schedule/CreateEventModal'
import EditEventModal from '../components/schedule/EditEventModal'
import EventDetailsModal from '../components/schedule/EventDetailsModal'
import DesktopToolbar from '../components/schedule/DesktopToolbar'
import { getAllMembers, getAllEvents, getEventTypes } from '../utils/dataAccess'

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
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Desktop role filter state
  const [roleFilter, setRoleFilter] = useState('all')

  // Split view state
  const [splitMember, setSplitMember] = useState(null)
  const isSplitView = splitMember !== null

  // Track whether the team member switcher is open (to hide FAB)
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const eventTypes = getEventTypes()

  const handleDateSelect = (date) => {
    setSelectedDate(date)
  }

  const handleEventTypeSelect = (eventType) => {
    // Calculate end time based on event type's default duration
    const startTime = '09:00'
    const type = eventTypes.find(t => t.key === eventType.key)
    const duration = type?.defaultDuration || 15
    const [startHour, startMin] = startTime.split(':').map(Number)
    const totalMinutes = startHour * 60 + startMin + duration
    const endHour = Math.min(Math.floor(totalMinutes / 60), 20)
    const endMin = totalMinutes % 60
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`

    // Open create event modal with pre-selected event type
    setCreateModalDefaults({
      eventType: eventType.key,
      assigneeId: selectedMember.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime,
      endTime,
    })
    setIsCreateModalOpen(true)
  }

  const handleMemberSelect = (member) => {
    setSelectedMember(member)
  }

  const handleEnterSplitView = (member) => {
    setSplitMember(member)
  }

  const handleExitSplitView = () => {
    setSplitMember(null)
  }

  const handleSwapSplitMember = (side, member) => {
    if (side === 'left') {
      setSelectedMember(member)
    } else {
      setSplitMember(member)
    }
  }

  const handleCreateEvent = (newEvent) => {
    // Add new event to state
    setEvents([...events, newEvent])
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
  }

  const handleEventClick = (event) => {
    // Open details modal first (not edit modal)
    setSelectedEvent(event)
    setIsDetailsModalOpen(true)
  }

  const handleEditFromDetails = () => {
    // Transition from details modal to edit modal
    setIsDetailsModalOpen(false)
    setIsEditModalOpen(true)
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedEvent(null)
  }

  const handleLongPressSlot = ({ startTime, endTime, memberId }) => {
    // Open create modal with pre-filled time from long-pressed slot
    setCreateModalDefaults({
      assigneeId: memberId || selectedMember.id,
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
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Week Strip - Mobile Only */}
      <WeekStrip selectedDate={selectedDate} onDateSelect={handleDateSelect} />

      {/* Desktop Page Title + Panel with Toolbar + Grid */}
      <DesktopToolbar
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        selectedDate={selectedDate}
        onDateChange={handleDateSelect}
      >
        {/* Desktop Time Grid - rendered inside the panel */}
        <DesktopTimeGrid
          selectedDate={selectedDate}
          events={events}
          onDateChange={handleDateSelect}
          onSlotClick={handleDesktopSlotClick}
          onEventClick={handleEventClick}
          onEventUpdate={handleUpdateEvent}
          roleFilter={roleFilter}
        >
          <DesktopFloatingPanel
            onEventTypeSelect={handleEventTypeSelect}
            events={events}
            onEventClick={handleEventClick}
          />
        </DesktopTimeGrid>
      </DesktopToolbar>

      {/* Time Grid - Mobile Day Agenda View - Mobile Only */}
      <div className="md:hidden flex flex-col flex-1">
        {isSplitView ? (
          <SplitTimeGrid
            selectedDate={selectedDate}
            leftMember={selectedMember}
            rightMember={splitMember}
            events={events}
            onEventClick={handleEventClick}
            onLongPressSlot={handleLongPressSlot}
            onEventUpdate={handleUpdateEvent}
            onHeaderTap={() => setSwitcherOpen(true)}
          />
        ) : (
          <TimeGrid
            selectedDate={selectedDate}
            selectedMember={selectedMember}
            events={events}
            onEventClick={handleEventClick}
            onLongPressSlot={handleLongPressSlot}
            onEventUpdate={handleUpdateEvent}
          />
        )}
      </div>

      {/* Team Member Switcher - Mobile Only - Bottom Left */}
      <TeamMemberSwitcher
        selectedMember={selectedMember}
        onMemberSelect={handleMemberSelect}
        splitMember={splitMember}
        onEnterSplitView={handleEnterSplitView}
        onExitSplitView={handleExitSplitView}
        onSwapSplitMember={handleSwapSplitMember}
        isOpen={switcherOpen}
        onOpenChange={setSwitcherOpen}
      />

      {/* Floating Action Button - Mobile Only - Bottom Right */}
      <FloatingActionButton onEventTypeSelect={handleEventTypeSelect} hidden={switcherOpen} />

      {/* Create Event Modal - Mobile Only */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSave={handleCreateEvent}
        defaults={createModalDefaults}
        events={events}
      />

      {/* Event Details Modal - Both Mobile and Desktop */}
      <EventDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        onEdit={handleEditFromDetails}
        event={selectedEvent}
      />

      {/* Edit Event Modal - Both Mobile and Desktop */}
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
