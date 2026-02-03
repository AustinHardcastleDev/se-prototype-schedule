import { format, addDays, subDays, isSameDay } from 'date-fns'
import PropTypes from 'prop-types'

export default function DesktopDatePicker({ selectedDate, onDateChange }) {
  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1))
  }

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1))
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const isToday = isSameDay(selectedDate, new Date())

  return (
    <div className="hidden md:flex items-center justify-between px-6 py-4 bg-charcoal border-b border-secondary">
      {/* Left: Previous Day Arrow */}
      <button
        onClick={handlePreviousDay}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
        aria-label="Previous day"
      >
        <svg
          className="w-6 h-6 text-text-light"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Center: Date Display */}
      <div className="flex items-center gap-4">
        <h1 className="font-heading text-3xl text-text-light uppercase tracking-wide">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h1>

        {/* Today Button */}
        {!isToday && (
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-secondary text-text-light rounded-full font-body text-sm font-semibold hover:brightness-110 transition-all"
          >
            Today
          </button>
        )}
      </div>

      {/* Right: Next Day Arrow */}
      <button
        onClick={handleNextDay}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
        aria-label="Next day"
      >
        <svg
          className="w-6 h-6 text-text-light"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

DesktopDatePicker.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  onDateChange: PropTypes.func.isRequired,
}
