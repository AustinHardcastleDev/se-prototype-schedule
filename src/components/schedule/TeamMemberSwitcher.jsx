import PropTypes from 'prop-types'
import { getAllMembers } from '../../utils/dataAccess'

export default function TeamMemberSwitcher({
  selectedMember,
  onMemberSelect,
  splitMember = null,
  onEnterSplitView,
  onExitSplitView,
  onSwapSplitMember,
  isOpen = false,
  onOpenChange,
}) {
  const setOpenState = (open) => {
    if (onOpenChange) onOpenChange(open)
  }
  const allMembers = getAllMembers()
  const isSplitView = splitMember !== null

  const handleToggle = () => {
    setOpenState(!isOpen)
  }

  const handleBackdropClick = () => {
    setOpenState(false)
  }

  const handleMemberClick = (member) => {
    setOpenState(false)
    onMemberSelect(member)
  }

  const handleSplitIconClick = (e, member) => {
    e.stopPropagation()
    setOpenState(false)
    if (onEnterSplitView) onEnterSplitView(member)
  }

  const handleExitSplit = () => {
    setOpenState(false)
    if (onExitSplitView) onExitSplitView()
  }

  const handleSwapMember = (side, member) => {
    setOpenState(false)
    if (onSwapSplitMember) onSwapSplitMember(side, member)
  }

  // Mike Torres (tm-1) is the current user and always appears at bottom
  const CURRENT_USER_ID = 'tm-1'

  // Sort members: Mike Torres at bottom, others alphabetically by first name
  const sortedMembers = [...allMembers].sort((a, b) => {
    if (a.id === CURRENT_USER_ID) return 1
    if (b.id === CURRENT_USER_ID) return -1
    return a.name.localeCompare(b.name)
  })

  // Split-screen icon SVG
  const SplitIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  )

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={handleBackdropClick}
        />
      )}

      {/* Member Switcher Container */}
      <div className="fixed bottom-6 left-6 z-50 md:hidden">
        {/* Member list - shown when open */}
        {isOpen && !isSplitView && (
          <div className="absolute bottom-16 left-0 flex flex-col gap-2 mb-2 animate-fadeIn">
            {sortedMembers.map((member) => {
              const isSelected = member.id === selectedMember.id
              return (
                <div
                  key={member.id}
                  className={`flex items-center bg-white rounded-full shadow-lg hover:brightness-95 transition-all ${
                    isSelected ? 'ring-2 ring-accent' : ''
                  }`}
                  style={{ minWidth: '200px' }}
                >
                  {/* Main click area - select member */}
                  <button
                    onClick={() => handleMemberClick(member)}
                    className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-body font-semibold flex-shrink-0"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.avatar}
                    </div>
                    <span className="text-sm font-body text-text-dark font-semibold text-left flex-1 truncate">
                      {member.name}
                    </span>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    )}
                  </button>

                  {/* Split icon - only for non-selected members */}
                  {!isSelected && (
                    <button
                      onClick={(e) => handleSplitIconClick(e, member)}
                      className="pr-3 pl-2.5 py-3 text-gray-400 hover:text-accent transition-colors border-l border-gray-300 flex-shrink-0"
                      aria-label={`Compare with ${member.name}`}
                    >
                      <SplitIcon />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Split mode menu — two-column layout anchored to bottom of screen */}
        {isOpen && isSplitView && (
          <div className="fixed bottom-20 left-3 right-3 flex flex-col gap-4 mb-2 animate-fadeIn">
            {/* Two-column row: Left picks | Right picks */}
            <div className="flex gap-2">
              {/* Left column */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="px-2 pb-0.5 border-b border-gray-300 mb-0.5">
                  <span className="text-xs font-body text-white font-bold uppercase tracking-wider">Left</span>
                </div>
                {sortedMembers
                  .filter((m) => m.id !== splitMember.id)
                  .map((member) => {
                    const isLeftSelected = member.id === selectedMember.id
                    return (
                      <button
                        key={`left-${member.id}`}
                        onClick={() => handleSwapMember('left', member)}
                        className={`flex items-center gap-2 bg-white rounded-full px-3 py-2 shadow-lg hover:brightness-95 transition-all ${
                          isLeftSelected ? 'ring-2 ring-accent' : ''
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-body font-semibold flex-shrink-0"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.avatar}
                        </div>
                        <span className="text-xs font-body text-text-dark font-semibold text-left flex-1 truncate">
                          {member.name}
                        </span>
                        {isLeftSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
              </div>

              {/* Right column */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="px-2 pb-0.5 border-b border-gray-300 mb-0.5">
                  <span className="text-xs font-body text-white font-bold uppercase tracking-wider">Right</span>
                </div>
                {sortedMembers
                  .filter((m) => m.id !== selectedMember.id)
                  .map((member) => {
                    const isRightSelected = member.id === splitMember.id
                    return (
                      <button
                        key={`right-${member.id}`}
                        onClick={() => handleSwapMember('right', member)}
                        className={`flex items-center gap-2 bg-white rounded-full px-3 py-2 shadow-lg hover:brightness-95 transition-all ${
                          isRightSelected ? 'ring-2 ring-accent' : ''
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-body font-semibold flex-shrink-0"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.avatar}
                        </div>
                        <span className="text-xs font-body text-text-dark font-semibold text-left flex-1 truncate">
                          {member.name}
                        </span>
                        {isRightSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>

            {/* Exit Split View button — full width at bottom */}
            <button
              onClick={handleExitSplit}
              className="flex items-center justify-center gap-2 bg-white rounded-full px-4 py-3 shadow-lg hover:brightness-95 transition-all"
            >
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
              <span className="text-sm font-body text-text-dark font-semibold">Exit Split View</span>
              <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Main Switcher Button */}
        {isSplitView ? (
          // Split mode: dual-avatar button
          <button
            onClick={handleToggle}
            className="h-12 rounded-full shadow-lg flex items-center px-1.5 gap-0 bg-charcoal hover:brightness-110 transition-all"
            aria-label={isOpen ? 'Close split menu' : 'Open split menu'}
          >
            {/* Left member avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-body font-semibold border-2 border-charcoal relative z-10"
              style={{ backgroundColor: selectedMember.color }}
            >
              {selectedMember.avatar}
            </div>
            {/* Right member avatar (overlapping) */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-body font-semibold border-2 border-charcoal relative -ml-3"
              style={{ backgroundColor: splitMember.color }}
            >
              {splitMember.avatar}
            </div>
          </button>
        ) : (
          // Normal mode: single avatar button
          <button
            onClick={handleToggle}
            className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white hover:brightness-110 transition-all"
            style={{ backgroundColor: selectedMember.color }}
            aria-label={isOpen ? 'Close member list' : 'Switch team member'}
          >
            <span className="text-sm font-body font-semibold">{selectedMember.avatar}</span>
          </button>
        )}
      </div>
    </>
  )
}

TeamMemberSwitcher.propTypes = {
  selectedMember: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
  onMemberSelect: PropTypes.func.isRequired,
  splitMember: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }),
  onEnterSplitView: PropTypes.func,
  onExitSplitView: PropTypes.func,
  onSwapSplitMember: PropTypes.func,
  isOpen: PropTypes.bool,
  onOpenChange: PropTypes.func,
}
