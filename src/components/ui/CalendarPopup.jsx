import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import PropTypes from 'prop-types'

export default function CalendarPopup({ selectedDate, onDateSelect, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate)

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleDateClick = (date) => {
    onDateSelect(date)
    onClose()
  }

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = []
  let day = startDate

  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  const today = new Date()

  return (
    <div className="absolute top-full mt-2 bg-secondary rounded-lg shadow-2xl p-4 z-[60] border border-accent/20 min-w-[320px]">
      {/* Month/Year Header with Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePreviousMonth}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-accent/10 transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="font-body text-lg text-text-light font-semibold uppercase">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>

        <button
          onClick={handleNextMonth}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-accent/10 transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
          <div key={dayName} className="text-center text-xs text-muted font-body font-semibold uppercase py-1">
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isSelected = isSameDay(day, selectedDate)
          const isToday = isSameDay(day, today)
          const isCurrentMonth = isSameMonth(day, currentMonth)

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              className={`
                flex items-center justify-center w-10 h-10 rounded-lg font-body text-sm transition-colors
                ${isSelected ? 'bg-accent text-white font-bold' : ''}
                ${!isSelected && isToday ? 'border-2 border-accent/50 text-text-light' : ''}
                ${!isSelected && !isToday && isCurrentMonth ? 'text-text-light hover:bg-accent/10' : ''}
                ${!isSelected && !isToday && !isCurrentMonth ? 'text-muted hover:bg-accent/5' : ''}
              `}
              aria-label={format(day, 'MMMM d, yyyy')}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

CalendarPopup.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  onDateSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}
