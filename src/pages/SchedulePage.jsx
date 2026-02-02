import { useState } from 'react'
import WeekStrip from '../components/schedule/WeekStrip'
import TimeGrid from '../components/schedule/TimeGrid'
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

  return (
    <div className="flex flex-col h-full">
      {/* Week Strip - Mobile Only */}
      <WeekStrip selectedDate={selectedDate} onDateSelect={handleDateSelect} />

      {/* Time Grid - Mobile Day Agenda View */}
      <TimeGrid selectedDate={selectedDate} selectedMember={selectedMember} />
    </div>
  )
}
