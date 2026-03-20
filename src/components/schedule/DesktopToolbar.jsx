import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { format } from 'date-fns'
import CalendarPopup from '../ui/CalendarPopup'
import { getAllMembers } from '../../utils/dataAccess'

export default function DesktopToolbar({ roleFilter, onRoleFilterChange, selectedDate, onDateChange, viewMode, onViewModeChange, hiddenMembers, onToggleMember, children }) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarRef = useRef(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setCalendarOpen(false)
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false)
      }
    }
    if (calendarOpen || filterOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [calendarOpen, filterOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setFilterOpen(false)
    }
    if (filterOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [filterOpen])

  const handleDateSelect = (date) => {
    onDateChange(date)
    setCalendarOpen(false)
  }

  const handleTodayClick = () => {
    onDateChange(new Date())
  }

  // Get filtered members for toggle chips
  const allMembers = getAllMembers()
  const filteredMembers = roleFilter === 'all'
    ? allMembers
    : allMembers.filter(m => m.role === roleFilter)
  const hiddenCount = filteredMembers.filter(m => hiddenMembers?.has(m.id)).length

  return (
    <div className="hidden md:flex md:flex-col flex-1 min-h-0 bg-stone-200" {...(calendarOpen ? { 'data-calendar-open': '' } : {})}>
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
              <span className="font-semibold hidden lg:inline">{format(selectedDate, 'MMM d, yyyy')}</span>
              <svg className="w-3 h-3 text-muted hidden lg:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {calendarOpen && (
              <div className="absolute top-full mt-2 left-0 z-[1100]">
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

          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-lg p-0.5 ml-2">
              <button
                onClick={() => onViewModeChange('calendar')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-body text-xs font-semibold transition-all duration-200 ${
                  viewMode === 'calendar'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Day
              </button>
              <button
                onClick={() => onViewModeChange('week')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-body text-xs font-semibold transition-all duration-200 ${
                  viewMode === 'week'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Week
              </button>
              <button
                onClick={() => onViewModeChange('map')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-body text-xs font-semibold transition-all duration-200 ${
                  viewMode === 'map'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Map
              </button>
            </div>
          )}

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

          {/* Filter Button + Popover */}
          <div className="relative ml-1" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-body text-xs font-semibold transition-all duration-200 ${
                filterOpen
                  ? 'bg-white/[0.12] text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
              {hiddenCount > 0 && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {hiddenCount}
                </span>
              )}
            </button>

            {filterOpen && (
              <div className="absolute top-full mt-2 right-0 z-[1100] w-[280px] bg-charcoal rounded-xl shadow-2xl border border-white/[0.08] overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
                  <span className="text-white/80 text-xs font-body font-semibold">Team Members</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        filteredMembers.forEach(m => {
                          if (hiddenMembers?.has(m.id)) onToggleMember?.(m.id)
                        })
                      }}
                      className="text-accent/80 hover:text-accent text-[11px] font-body font-semibold transition-colors"
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => {
                        filteredMembers.forEach(m => {
                          if (!hiddenMembers?.has(m.id)) onToggleMember?.(m.id)
                        })
                      }}
                      className="text-white/40 hover:text-white/60 text-[11px] font-body font-semibold transition-colors"
                    >
                      Hide All
                    </button>
                  </div>
                </div>
                {/* Member grid */}
                <div className="px-3 py-3 grid grid-cols-2 gap-1.5">
                  {filteredMembers.map((member) => {
                    const isHidden = hiddenMembers?.has(member.id)
                    return (
                      <button
                        key={member.id}
                        onClick={() => onToggleMember?.(member.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-body text-xs font-medium transition-all duration-150 text-left ${
                          isHidden
                            ? 'text-white/25 line-through bg-white/[0.02]'
                            : 'text-white/90 bg-white/[0.07]'
                        }`}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: isHidden ? 'rgba(255,255,255,0.12)' : member.color }}
                        />
                        {member.name.split(' ')[0]}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
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
  viewMode: PropTypes.oneOf(['calendar', 'map', 'week']),
  onViewModeChange: PropTypes.func,
  hiddenMembers: PropTypes.instanceOf(Set),
  onToggleMember: PropTypes.func,
  children: PropTypes.node,
}
