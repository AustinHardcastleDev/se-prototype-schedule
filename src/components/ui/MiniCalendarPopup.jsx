import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import PropTypes from 'prop-types'

export default function MiniCalendarPopup({ selectedDate, onDateSelect, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate)

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
    <>
      {/* Transparent backdrop to dismiss */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="absolute top-full mt-1 bg-secondary rounded-lg shadow-2xl p-2 z-50 border border-accent/20"
        style={{ minWidth: '200px', maxWidth: '200px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Month/Year Header with Navigation */}
        <div className="flex items-center justify-between mb-1.5">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-accent/10 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-3.5 h-3.5 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="font-body text-xs text-text-light font-semibold uppercase">
            {format(currentMonth, 'MMM yyyy')}
          </span>

          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-accent/10 transition-colors"
            aria-label="Next month"
          >
            <svg className="w-3.5 h-3.5 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Single-letter day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, i) => (
            <div key={i} className="text-center text-[9px] text-muted font-body font-semibold py-0.5">
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((d, index) => {
            const isSelected = isSameDay(d, selectedDate)
            const isDayToday = isSameDay(d, today)
            const isCurrentMonth = isSameMonth(d, currentMonth)

            return (
              <button
                type="button"
                key={index}
                onClick={() => handleDateClick(d)}
                className={`
                  flex items-center justify-center w-7 h-7 rounded font-body text-[11px] transition-colors
                  ${isSelected ? 'bg-accent text-white font-bold' : ''}
                  ${!isSelected && isDayToday ? 'border border-accent/50 text-text-light' : ''}
                  ${!isSelected && !isDayToday && isCurrentMonth ? 'text-text-light hover:bg-accent/10' : ''}
                  ${!isSelected && !isDayToday && !isCurrentMonth ? 'text-muted/40 hover:bg-accent/5' : ''}
                `}
                aria-label={format(d, 'MMMM d, yyyy')}
              >
                {format(d, 'd')}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

MiniCalendarPopup.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  onDateSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}
