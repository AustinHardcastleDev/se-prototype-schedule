import { useState } from 'react'
import PropTypes from 'prop-types'
import { startOfWeek, addDays, addWeeks, format, isSameDay } from 'date-fns'

export default function WeekStrip({ selectedDate, onDateSelect }) {
  // Week starts on Monday (weekStartsOn: 1)
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(selectedDate, { weekStartsOn: 1 })
  )

  // Generate 7 days starting from Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, -1))
  }

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1))
  }

  const handleDayClick = (day) => {
    onDateSelect(day)
  }

  return (
    <div className="md:hidden bg-charcoal border-b border-secondary py-3 px-4">
      <div className="flex items-center justify-between gap-2">
        {/* Left Arrow */}
        <button
          onClick={handlePreviousWeek}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-text-light hover:text-accent transition-colors"
          aria-label="Previous week"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Week Days */}
        <div className="flex-1 flex justify-between gap-1">
          {weekDays.map((day, index) => {
            const isSelected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())

            return (
              <button
                key={index}
                onClick={() => handleDayClick(day)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-accent text-white'
                    : isToday
                    ? 'bg-secondary text-text-light ring-1 ring-accent'
                    : 'text-text-light hover:bg-secondary'
                }`}
              >
                {/* Abbreviated day name */}
                <span className="text-xs font-body uppercase mb-1">
                  {format(day, 'EEE')}
                </span>
                {/* Numeric date */}
                <span className="text-lg font-body font-semibold">
                  {format(day, 'd')}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNextWeek}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-text-light hover:text-accent transition-colors"
          aria-label="Next week"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

WeekStrip.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  onDateSelect: PropTypes.func.isRequired,
}
