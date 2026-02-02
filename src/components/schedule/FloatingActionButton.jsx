import { useState } from 'react'
import PropTypes from 'prop-types'
import { getEventTypes } from '../../utils/dataAccess'

export default function FloatingActionButton({ onEventTypeSelect }) {
  const [isOpen, setIsOpen] = useState(false)
  const eventTypes = getEventTypes()

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleBackdropClick = () => {
    setIsOpen(false)
  }

  const handleEventTypeClick = (eventType) => {
    setIsOpen(false)
    onEventTypeSelect(eventType)
  }

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={handleBackdropClick}
        />
      )}

      {/* FAB Container */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        {/* Action buttons - shown when open */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2 animate-fadeIn">
            {eventTypes.map((eventType) => (
              <button
                key={eventType.key}
                onClick={() => handleEventTypeClick(eventType)}
                className="flex items-center gap-3 bg-white rounded-full px-4 py-3 shadow-lg hover:brightness-95 transition-all"
                style={{ minWidth: '200px' }}
              >
                {/* Color indicator */}
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: eventType.color }}
                />
                {/* Label */}
                <span className="text-sm font-body text-text-dark font-semibold text-left flex-1">
                  {eventType.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={handleToggle}
          className={`w-14 h-14 bg-accent rounded-full shadow-lg flex items-center justify-center text-white hover:brightness-110 transition-all ${
            isOpen ? 'rotate-45 scale-110' : 'rotate-0 scale-100'
          }`}
          aria-label={isOpen ? 'Close menu' : 'Create event'}
        >
          {/* Plus Icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </>
  )
}

FloatingActionButton.propTypes = {
  onEventTypeSelect: PropTypes.func.isRequired,
}
