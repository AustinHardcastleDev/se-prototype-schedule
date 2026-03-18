import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * CustomDropdown - A styled dropdown component matching the dark chrome design system
 *
 * Features:
 * - Dark background (#2A2A2A) with white text
 * - Orange accent on hover/selected
 * - Optional color dots for options (event types)
 * - Closes on selection or outside click
 * - Keyboard accessible
 */
export default function CustomDropdown({
  id,
  label,
  value,
  onChange,
  options,
  showColorDots = false,
  getColorForOption = null,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Find the currently selected option
  const selectedOption = options.find(opt => opt.value === value)

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

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const handleKeyDown = (e, optionValue) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect(optionValue)
    }
  }

  return (
    <div className="mb-4">
      {/* Label */}
      {label && (
        <label htmlFor={id} className="block text-sm font-body text-text-light font-semibold mb-2">
          {label}
        </label>
      )}

      {/* Dropdown Container */}
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
          <span className="flex items-center gap-2">
            {/* Color dot for selected option (event types) */}
            {showColorDots && getColorForOption && (
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getColorForOption(value) }}
              />
            )}
            {selectedOption?.label || 'Select...'}
          </span>
          {/* Down arrow */}
          <svg
            className={`w-4 h-4 text-text-light transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-secondary rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <ul role="listbox" className="py-2">
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => handleSelect(option.value)}
                    onKeyDown={(e) => handleKeyDown(e, option.value)}
                    className={`px-4 py-2.5 font-body text-sm text-text-light cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-accent/20 text-accent'
                        : 'hover:bg-accent/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {/* Color dot for option (event types) */}
                      {showColorDots && getColorForOption && (
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getColorForOption(option.value) }}
                        />
                      )}
                      {option.label}
                    </span>
                    {/* Checkmark for selected option */}
                    {isSelected && (
                      <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
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

CustomDropdown.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  showColorDots: PropTypes.bool,
  getColorForOption: PropTypes.func,
}
