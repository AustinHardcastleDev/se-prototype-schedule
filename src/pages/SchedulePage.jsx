import { useState } from 'react'
import WeekStrip from '../components/schedule/WeekStrip'
import TimeGrid from '../components/schedule/TimeGrid'
import FloatingActionButton from '../components/schedule/FloatingActionButton'
import { getAllMembers } from '../utils/dataAccess'

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Default to first team member (current user)
  const allMembers = getAllMembers()
  // eslint-disable-next-line no-unused-vars
  const [selectedMember, setSelectedMember] = useState(allMembers[0])

  const handleDateSelect = (date) => {
    setSelectedDate(date)
  }

  const handleEventTypeSelect = (eventType) => {
    // TODO: Open create event modal with pre-selected event type (Story 10)
    console.log('Selected event type:', eventType)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week Strip - Mobile Only */}
      <WeekStrip selectedDate={selectedDate} onDateSelect={handleDateSelect} />

      {/* Time Grid - Mobile Day Agenda View */}
      <TimeGrid selectedDate={selectedDate} selectedMember={selectedMember} />

      {/* Floating Action Button - Mobile Only */}
      <FloatingActionButton onEventTypeSelect={handleEventTypeSelect} />
    </div>
  )
}
