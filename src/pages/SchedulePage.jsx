import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Toaster } from 'react-hot-toast'
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
import DesktopMapView from '../components/schedule/DesktopMapView'
import MobileMapView from '../components/schedule/MobileMapView'
import VirtualColumnCardList from '../components/schedule/VirtualColumnCardList'
import { getAllMembers, getAllEvents, getEventTypes } from '../utils/dataAccess'
import { useMobileViewMode } from '../contexts/ViewModeContext'

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

  // Desktop view mode state (calendar or map)
  const [viewMode, setViewMode] = useState('calendar')

  // Split view state
  const [splitMember, setSplitMember] = useState(null)
  const isSplitView = splitMember !== null

  // Per-column date state for split view
  const [leftDate, setLeftDate] = useState(new Date())
  const [rightDate, setRightDate] = useState(new Date())

  // Track whether the team member switcher is open (to hide FAB)
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const eventTypes = getEventTypes()

  // Check if selected member is a virtual member
  const isVirtualMember = selectedMember?.isVirtual === true

  // Mobile view mode
  const { mobileViewMode, setMobileViewMode } = useMobileViewMode()

  // Force back to calendar when entering split view or virtual member view
  useEffect(() => {
    if (isSplitView || isVirtualMember) setMobileViewMode('calendar')
  }, [isSplitView, isVirtualMember, setMobileViewMode])

  const showMobileMap = mobileViewMode === 'map' && !isSplitView && !isVirtualMember

  // Hide WeekStrip when in split view or when a virtual member is selected
  const hideWeekStrip = isSplitView || isVirtualMember

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
      assigneeId: isVirtualMember ? allMembers[0].id : selectedMember.id,
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
    // Set both dates to current selectedDate when entering split mode
    setLeftDate(selectedDate)
    setRightDate(selectedDate)
    setSplitMember(member)
  }

  const handleExitSplitView = () => {
    // Restore selectedDate from leftDate when exiting
    setSelectedDate(leftDate)
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

  const handleLongPressSlot = ({ startTime, endTime, memberId, date }) => {
    // Open create modal with pre-filled time from long-pressed slot
    setCreateModalDefaults({
      assigneeId: memberId || selectedMember.id,
      date: date || format(selectedDate, 'yyyy-MM-dd'),
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

  // Per-column date change handlers
  const handleLeftDateChange = (date) => {
    setLeftDate(date)
  }

  const handleRightDateChange = (date) => {
    setRightDate(date)
  }

  // Get events for virtual member single-column view
  const getVirtualColumnEvents = () => {
    if (!isVirtualMember) return []
    if (selectedMember.virtualType === 'unassigned') {
      return events
        .filter((e) => e.assigneeId === null)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    }
    if (selectedMember.virtualType === 'earlier') {
      return events
        .filter((e) => e.earlierOpening === true)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    }
    return []
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1A1A1A', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' } }} />

      {/* Week Strip - Mobile Only - Hidden in split view and virtual member view */}
      {!hideWeekStrip && (
        <WeekStrip selectedDate={selectedDate} onDateSelect={handleDateSelect} />
      )}

      {/* Desktop Page Title + Panel with Toolbar + Grid */}
      <DesktopToolbar
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        selectedDate={selectedDate}
        onDateChange={handleDateSelect}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      >
        {viewMode === 'calendar' ? (
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
              hidden={isCreateModalOpen || isDetailsModalOpen || isEditModalOpen}
            />
          </DesktopTimeGrid>
        ) : (
          <DesktopMapView
            selectedDate={selectedDate}
            events={events}
            onEventUpdate={handleUpdateEvent}
            roleFilter={roleFilter}
          />
        )}
      </DesktopToolbar>

      {/* Time Grid - Mobile Day Agenda View - Mobile Only */}
      <div className="md:hidden flex flex-col flex-1 min-h-0">
        {isSplitView ? (
          <SplitTimeGrid
            leftMember={selectedMember}
            rightMember={splitMember}
            leftDate={leftDate}
            rightDate={rightDate}
            onLeftDateChange={handleLeftDateChange}
            onRightDateChange={handleRightDateChange}
            events={events}
            onEventClick={handleEventClick}
            onLongPressSlot={handleLongPressSlot}
            onEventUpdate={handleUpdateEvent}
            onHeaderTap={() => setSwitcherOpen(true)}
          />
        ) : showMobileMap ? (
          <MobileMapView
            selectedDate={selectedDate}
            events={events}
            onEventUpdate={handleUpdateEvent}
          />
        ) : isVirtualMember ? (
          // Virtual member single-column view: card list instead of time grid
          <div className="flex flex-col flex-1 min-h-0">
            {/* Virtual member header */}
            <div
              className="bg-charcoal px-3 py-2 flex items-center gap-2 border-b border-secondary"
              onClick={() => setSwitcherOpen(true)}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-body font-semibold flex-shrink-0"
                style={{ backgroundColor: selectedMember.color }}
              >
                {selectedMember.avatar}
              </div>
              <span className="text-sm font-body text-text-light font-semibold">
                {selectedMember.name}
              </span>
              <span className="text-xs font-body text-gray-400 ml-auto">
                {getVirtualColumnEvents().length} jobs
              </span>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <VirtualColumnCardList
                events={getVirtualColumnEvents()}
                onEventClick={handleEventClick}
                emptyMessage={
                  selectedMember.virtualType === 'unassigned'
                    ? 'No unassigned jobs'
                    : 'No earlier openings available'
                }
              />
            </div>
          </div>
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
      <FloatingActionButton onEventTypeSelect={handleEventTypeSelect} hidden={switcherOpen || showMobileMap} />

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
