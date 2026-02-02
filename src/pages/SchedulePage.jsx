import { useState } from 'react'
import WeekStrip from '../components/schedule/WeekStrip'
import TimeGrid from '../components/schedule/TimeGrid'

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handleDateSelect = (date) => {
    setSelectedDate(date)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week Strip - Mobile Only */}
      <WeekStrip selectedDate={selectedDate} onDateSelect={handleDateSelect} />

      {/* Time Grid - Mobile Day Agenda View */}
      <TimeGrid />
    </div>
  )
}
