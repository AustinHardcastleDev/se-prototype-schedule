import { useState } from 'react'
import WeekStrip from '../components/schedule/WeekStrip'

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handleDateSelect = (date) => {
    setSelectedDate(date)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week Strip - Mobile Only */}
      <WeekStrip selectedDate={selectedDate} onDateSelect={handleDateSelect} />

      {/* Main Content Area */}
      <div className="flex-1 p-8">
        <h1 className="font-heading text-4xl text-accent uppercase mb-4">
          Schedule View
        </h1>
        <p className="font-body text-text-light">
          Selected Date: {selectedDate.toLocaleDateString()}
        </p>
        <p className="font-body text-muted text-sm mt-2">
          Calendar grid will appear here in future stories.
        </p>
      </div>
    </div>
  )
}
