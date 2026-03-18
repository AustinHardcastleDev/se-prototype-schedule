import { useState, useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useDraggable, useDroppable, useDndContext } from '@dnd-kit/core'
import { getEventTypes, getEventTypeByKey } from '../../utils/dataAccess'

// Draggable wrapper for panel cards (holding pin or earlier pin)
function DraggableHoldingCard({ event, source = 'holding-pin', children }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${source}-${event.id}`,
    data: { event, source },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none',
      }}
    >
      {children}
    </div>
  )
}

DraggableHoldingCard.propTypes = {
  event: PropTypes.object.isRequired,
  source: PropTypes.string,
  children: PropTypes.node.isRequired,
}

// Horizontal carousel with programmatic scroll via arrow buttons
const CARD_WIDTH = 220
const CARD_GAP = 10

function HorizontalCarousel({ children, itemCount }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(checkScroll)
    return () => cancelAnimationFrame(frame)
  }, [checkScroll, itemCount])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  const scroll = (direction) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction * (CARD_WIDTH + CARD_GAP) * 2, behavior: 'smooth' })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => { e.stopPropagation(); scroll(-1) }}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          canScrollLeft ? 'bg-white/15 hover:bg-white/25 text-white cursor-pointer' : 'text-white/20 pointer-events-none'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <div ref={scrollRef} className="flex-1 overflow-x-hidden scrollbar-hide">
        <div className="flex" style={{ gap: `${CARD_GAP}px` }}>
          {children}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); scroll(1) }}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          canScrollRight ? 'bg-white/15 hover:bg-white/25 text-white cursor-pointer' : 'text-white/20 pointer-events-none'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  )
}

HorizontalCarousel.propTypes = {
  children: PropTypes.node.isRequired,
  itemCount: PropTypes.number.isRequired,
}

export default function DesktopFloatingPanel({ onEventTypeSelect, events = [], onEventClick, hidden = false }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isUnassignedOpen, setIsUnassignedOpen] = useState(false)
  const [isEarlierOpen, setIsEarlierOpen] = useState(false)
  const eventTypes = getEventTypes()
  const barRef = useRef(null)
  const carouselRef = useRef(null)

  const earlierOpeningEvents = events.filter(e => e.earlierOpening === true)
  const unassignedEvents = events.filter(e => e.assigneeId === null)

  const handleEventTypeClick = (eventType) => {
    setIsCreateOpen(false)
    onEventTypeSelect(eventType)
  }

  const handleHoldingCardClick = (event) => {
    setIsUnassignedOpen(false)
    if (onEventClick) onEventClick(event)
  }

  const handleEarlierCardClick = (event) => {
    setIsEarlierOpen(false)
    if (onEventClick) onEventClick(event)
  }

  // Close expanded panels when a panel drag starts so user can see the grid
  const { active } = useDndContext()
  const isDraggingFromPanel = active?.data?.current?.source === 'holding-pin' || active?.data?.current?.source === 'earlier-pin'
  const isAnyDragActive = !!active

  useEffect(() => {
    if (isDraggingFromPanel) {
      setIsUnassignedOpen(false)
      setIsEarlierOpen(false)
    }
  }, [isDraggingFromPanel])

  // Close trays and hide panel when a modal opens
  useEffect(() => {
    if (hidden) {
      setIsCreateOpen(false)
      setIsUnassignedOpen(false)
      setIsEarlierOpen(false)
    }
  }, [hidden])

  // Make Unassigned pill a droppable target for calendar events
  const { setNodeRef: setUnassignedDropRef, isOver: isOverUnassigned } = useDroppable({
    id: 'holding-pin-unassigned',
    data: { target: 'unassigned' },
  })

  const anyOpen = isCreateOpen || isUnassignedOpen || isEarlierOpen

  // Click-outside handler replaces the full-screen backdrop so the calendar stays scrollable
  useEffect(() => {
    if (!anyOpen) return
    const handleClickOutside = (e) => {
      const inBar = barRef.current?.contains(e.target)
      const inCarousel = carouselRef.current?.contains(e.target)
      if (!inBar && !inCarousel) {
        setIsCreateOpen(false)
        setIsUnassignedOpen(false)
        setIsEarlierOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [anyOpen])

  // Format time for display
  const formatTime = (timeStr) => {
    const [hour, minute] = timeStr.split(':').map(Number)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  // Format date for compact display
  const formatDateShort = (dateStr) => {
    const [, month, day] = dateStr.split('-')
    return `${parseInt(month)}/${parseInt(day)}`
  }

  // Render a full-width carousel tray for a set of events
  const renderCarouselBar = (carouselEvents, label, dotClass, labelClass, source, onCardClick) => (
    <div
      ref={carouselRef}
      className="hidden md:block fixed z-50 animate-fadeIn"
      style={{
        left: 'calc(16rem + 1.5rem)',
        right: '1.5rem',
        bottom: '100px',
      }}
    >
      <div className="bg-charcoal/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 px-3 pt-3 pb-3">
        {/* Header row */}
        <div className="flex items-center justify-between px-12 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dotClass}`} />
            <span className="text-xs font-body font-semibold text-white/80 tracking-wide uppercase">
              {label}
            </span>
          </div>
          <span className="text-xs font-body text-white/40">
            {carouselEvents.length} {carouselEvents.length === 1 ? 'job' : 'jobs'}
          </span>
        </div>

        {/* Carousel */}
        <HorizontalCarousel itemCount={carouselEvents.length}>
          {carouselEvents.map((event) => {
            const cardEventType = getEventTypeByKey(event.type)
            return (
              <div key={event.id} style={{ width: `${CARD_WIDTH}px`, flexShrink: 0 }}>
                <DraggableHoldingCard event={event} source={source}>
                  <button
                    onClick={() => onCardClick(event)}
                    className="rounded-xl px-4 py-3 hover:ring-2 hover:ring-accent/50 hover:shadow-md transition-all text-left w-full"
                    style={{ backgroundColor: cardEventType?.color || '#6B7280' }}
                  >
                    <div className="text-sm font-body text-white font-semibold truncate">{event.title}</div>
                    <div className="text-xs font-body text-white/70 mt-0.5">
                      {formatDateShort(event.date)}{event.startTime ? ` \u00b7 ${formatTime(event.startTime)}` : ''}
                    </div>
                    <div className="text-xs font-body text-white/80 font-semibold mt-0.5">{label}</div>
                    {event.notes && (
                      <div className="flex items-start gap-1 mt-1.5">
                        <svg className="w-2.5 h-2.5 text-white/60 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                          <rect x="9" y="3" width="6" height="4" rx="1"/>
                        </svg>
                        <span className="text-xs font-body text-white/60 line-clamp-2">{event.notes}</span>
                      </div>
                    )}
                  </button>
                </DraggableHoldingCard>
              </div>
            )
          })}
        </HorizontalCarousel>
      </div>
    </div>
  )

  if (hidden) return null

  return (
    <>
      {/* Earlier carousel tray — full calendar width, fixed above the floating bar */}
      {isEarlierOpen && earlierOpeningEvents.length > 0 &&
        renderCarouselBar(earlierOpeningEvents, 'Earlier Opening', 'bg-amber-500', 'text-amber-600', 'earlier-pin', handleEarlierCardClick)
      }

      {/* Unassigned carousel tray */}
      {isUnassignedOpen && unassignedEvents.length > 0 &&
        renderCarouselBar(unassignedEvents, 'Unassigned', 'bg-rose-500', 'text-rose-500', 'holding-pin', handleHoldingCardClick)
      }

      {/* Floating Bottom Bar - Desktop Only */}
      <div ref={barRef} className="hidden md:flex fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 items-center gap-3 bg-charcoal/90 backdrop-blur-sm rounded-full px-4 py-2.5 shadow-2xl">
        {/* Earlier Opening Jobs */}
        {earlierOpeningEvents.length > 0 && (
          <button
            onClick={() => {
              setIsEarlierOpen(!isEarlierOpen)
              setIsUnassignedOpen(false)
              setIsCreateOpen(false)
            }}
            className={`flex items-center gap-2 rounded-full px-3 py-2 transition-all ${
              isEarlierOpen
                ? 'ring-1 ring-amber-400/50'
                : 'hover:bg-secondary'
            }`}
          >
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="font-body text-xs text-text-light font-semibold whitespace-nowrap">Earlier</span>
            <span className="font-body text-xs text-white bg-amber-500 rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {earlierOpeningEvents.length}
            </span>
          </button>
        )}

        {/* Create Event Button */}
        <div className="relative">
          {/* Event Type Menu - shown above button */}
          {isCreateOpen && (
            <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 animate-fadeIn">
              {eventTypes.map((eventType) => (
                <button
                  key={eventType.key}
                  onClick={() => handleEventTypeClick(eventType)}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-2.5 shadow-lg hover:border-accent hover:shadow-xl transition-all whitespace-nowrap"
                  style={{ minWidth: '200px' }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: eventType.color }}
                  />
                  <span className="text-sm font-body text-gray-700 font-semibold">
                    {eventType.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setIsCreateOpen(!isCreateOpen)
              setIsUnassignedOpen(false)
              setIsEarlierOpen(false)
            }}
            className={`flex items-center gap-2 bg-accent rounded-full px-5 py-2.5 text-white shadow-lg hover:shadow-xl transition-all ${
              isCreateOpen ? 'scale-105' : 'scale-100'
            }`}
            aria-label={isCreateOpen ? 'Close menu' : 'Create event'}
          >
            <svg className={`w-4 h-4 transition-transform ${isCreateOpen ? 'rotate-45' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-body text-sm font-semibold whitespace-nowrap">Add Event</span>
          </button>
        </div>

        {/* Unassigned Jobs */}
        {(unassignedEvents.length > 0 || isAnyDragActive) && (
          <button
            ref={setUnassignedDropRef}
            onClick={() => {
              setIsUnassignedOpen(!isUnassignedOpen)
              setIsCreateOpen(false)
              setIsEarlierOpen(false)
            }}
            className={`flex items-center gap-2 rounded-full transition-all duration-300 ease-out ${
              isOverUnassigned
                ? 'ring-2 ring-rose-400 scale-125 bg-rose-400/20 px-5 py-3'
                : isAnyDragActive
                  ? 'ring-2 ring-rose-400/60 scale-110 bg-rose-400/10 px-4 py-2.5'
                  : isUnassignedOpen
                    ? 'ring-1 ring-rose-400/50 px-3 py-2'
                    : 'hover:bg-secondary px-3 py-2'
            }`}
          >
            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span className="font-body text-xs text-text-light font-semibold whitespace-nowrap">Unassigned</span>
            <span className="font-body text-xs text-white bg-rose-500 rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unassignedEvents.length}
            </span>
          </button>
        )}
      </div>
    </>
  )
}

DesktopFloatingPanel.propTypes = {
  onEventTypeSelect: PropTypes.func.isRequired,
  events: PropTypes.array,
  onEventClick: PropTypes.func,
  hidden: PropTypes.bool,
}
