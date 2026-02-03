import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * TimePicker - A custom time picker component for selecting times in 15-minute increments
 *
 * Features:
 * - 12-hour format with AM/PM
 * - 15-minute increments only (6:00, 6:15, 6:30, 6:45, etc.)
 * - Range: 6:00 AM - 8:00 PM
 * - Dark theme matching design system (#2A2A2A background, orange accents)
 * - Scrollable time list for easy selection
 * - Touch-friendly on mobile (large tap targets)
 * - Closes on selection or outside click
 */
export default function TimePicker({
  id,
  label,
  value, // Expected format: "HH:MM" (24-hour, e.g., "09:00")
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const selectedRef = useRef(null)

  // Generate time options (6:00 AM - 8:00 PM in 15-minute increments)
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 6; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Don't include times after 8:00 PM
        if (hour === 20 && minute > 0) break

        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const period = hour >= 12 ? 'PM' : 'AM'
        const displayStr = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`

        options.push({ value: timeStr, label: displayStr })
      }
    }
    return options
  }

  const timeOptions = generateTimeOptions()

  // Find the currently selected option
  const selectedOption = timeOptions.find(opt => opt.value === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Scroll to selected option when dropdown opens
  useEffect(() => {
    if (isOpen && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleSelect = (timeValue) => {
    onChange(timeValue)
    setIsOpen(false)
  }

  const handleKeyDown = (e, timeValue) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect(timeValue)
    }
  }

  return (
    <div className="mb-4">
      {/* Label */}
      {label && (
        <label htmlFor={id} className="block text-sm font-body text-text-dark font-semibold mb-2">
          {label}
        </label>
      )}

      {/* Time Picker Container */}
      <div ref={dropdownRef} className="relative">
        {/* Trigger Button */}
        <button
          id={id}
          type="button"
          onClick={handleToggle}
          className="w-full px-4 py-3 bg-secondary text-text-light rounded-lg font-body text-sm text-left flex items-center justify-between hover:brightness-110 transition-all"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>{selectedOption?.label || 'Select time...'}</span>
          {/* Clock icon */}
          <svg
            className="w-5 h-5 text-text-light"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Time Options Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-secondary rounded-lg shadow-lg max-h-64 overflow-y-auto">
            <ul role="listbox" className="py-2">
              {timeOptions.map((option) => {
                const isSelected = option.value === value
                return (
                  <li
                    key={option.value}
                    ref={isSelected ? selectedRef : null}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => handleSelect(option.value)}
                    onKeyDown={(e) => handleKeyDown(e, option.value)}
                    className={`px-4 py-3 font-body text-sm cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-accent/20 text-accent font-semibold'
                        : 'text-text-light hover:bg-accent/10'
                    }`}
                  >
                    <span>{option.label}</span>
                    {/* Checkmark for selected option */}
                    {isSelected && (
                      <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

TimePicker.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.string.isRequired, // Format: "HH:MM" (24-hour)
  onChange: PropTypes.func.isRequired,
}
