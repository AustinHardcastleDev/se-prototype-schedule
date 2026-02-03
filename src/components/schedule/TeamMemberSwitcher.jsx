import { useState } from 'react'
import PropTypes from 'prop-types'
import { getAllMembers } from '../../utils/dataAccess'

export default function TeamMemberSwitcher({ selectedMember, onMemberSelect }) {
  const [isOpen, setIsOpen] = useState(false)
  const allMembers = getAllMembers()

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleBackdropClick = () => {
    setIsOpen(false)
  }

  const handleMemberClick = (member) => {
    setIsOpen(false)
    onMemberSelect(member)
  }

  // Mike Torres (tm-1) is the current user and always appears at bottom
  const CURRENT_USER_ID = 'tm-1'
  const currentUser = allMembers.find(m => m.id === CURRENT_USER_ID)

  // Sort members: Mike Torres at bottom, others alphabetically by first name
  const sortedMembers = [...allMembers].sort((a, b) => {
    // Mike Torres always goes to bottom
    if (a.id === CURRENT_USER_ID) return 1
    if (b.id === CURRENT_USER_ID) return -1
    // Sort others alphabetically by first name
    return a.name.localeCompare(b.name)
  })

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
        {isOpen && (
          <div className="absolute bottom-16 left-0 flex flex-col gap-2 mb-2 animate-fadeIn">
            {sortedMembers.map((member) => {
              const isSelected = member.id === selectedMember.id
              return (
                <button
                  key={member.id}
                  onClick={() => handleMemberClick(member)}
                  className={`flex items-center gap-3 bg-white rounded-full px-4 py-3 shadow-lg hover:brightness-95 transition-all ${
                    isSelected ? 'ring-2 ring-accent' : ''
                  }`}
                  style={{ minWidth: '200px' }}
                >
                  {/* Avatar/Initials */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-body font-semibold flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.avatar}
                  </div>
                  {/* Name */}
                  <span className="text-sm font-body text-text-dark font-semibold text-left flex-1">
                    {member.name}
                  </span>
                  {/* Orange indicator for selected */}
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Main Switcher Button - Always shows current user (Mike Torres) */}
        <button
          onClick={handleToggle}
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white hover:brightness-110 transition-all"
          style={{ backgroundColor: currentUser.color }}
          aria-label={isOpen ? 'Close member list' : 'Switch team member'}
        >
          {/* Current user initials */}
          <span className="text-sm font-body font-semibold">{currentUser.avatar}</span>
        </button>
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
}
