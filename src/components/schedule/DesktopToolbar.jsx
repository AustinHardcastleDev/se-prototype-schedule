import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { format } from 'date-fns'
import CalendarPopup from '../ui/CalendarPopup'

export default function DesktopToolbar({ roleFilter, onRoleFilterChange, selectedDate, onDateChange, children }) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setCalendarOpen(false)
      }
    }
    if (calendarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [calendarOpen])

  const handleDateSelect = (date) => {
    onDateChange(date)
    setCalendarOpen(false)
  }

  const handleTodayClick = () => {
    onDateChange(new Date())
  }

  return (
    <div className="hidden md:flex md:flex-col flex-1 min-h-0 bg-stone-200">
      {/* Page Title - white bar */}
      <div className="px-8 py-7 bg-white flex-shrink-0">
        <h1 className="font-body text-3xl font-bold uppercase tracking-wide text-gray-800">
          Schedule
        </h1>
      </div>

      {/* Content Panel with dark header bar */}
      <div className="flex-1 min-h-0 flex flex-col mx-6 mt-4 mb-6 overflow-hidden">
        {/* Dark panel header bar */}
        <div className="bg-charcoal rounded-t-2xl px-5 py-4 flex items-center gap-3 flex-shrink-0">
          {/* Date Picker */}
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded font-body text-sm text-text-light hover:text-accent transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold">{format(selectedDate, 'MMM d, yyyy')}</span>
              <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {calendarOpen && (
              <div className="absolute top-full mt-2 left-0 z-50">
                <CalendarPopup
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  onClose={() => setCalendarOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Today Button */}
          <button
            onClick={handleTodayClick}
            className="px-3 py-1.5 rounded font-body text-sm text-text-light hover:text-accent transition-colors font-semibold"
          >
            Today
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Role Filter */}
          <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-lg p-0.5">
            {[
              { value: 'all', label: 'All' },
              { value: 'tech', label: 'Tech' },
              { value: 'sales', label: 'Sales' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => onRoleFilterChange(filter.value)}
                className={`px-3.5 py-1.5 rounded-md font-body text-xs font-semibold transition-all duration-200 ${
                  roleFilter === filter.value
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel body - grid content goes here */}
        <div className="flex-1 min-h-0 flex flex-col bg-white border-x border-b border-gray-200 rounded-b-2xl overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

DesktopToolbar.propTypes = {
  roleFilter: PropTypes.oneOf(['all', 'tech', 'sales']).isRequired,
  onRoleFilterChange: PropTypes.func.isRequired,
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  onDateChange: PropTypes.func.isRequired,
  children: PropTypes.node,
}
