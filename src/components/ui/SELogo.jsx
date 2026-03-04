export default function SELogo({ className = '' }) {
  return (
    <div className={className}>
      {/* SE Logo Mark - Orange block with white SE letters */}
      <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Orange background with rounded corners */}
        <rect width="80" height="80" rx="8" fill="#F47A20" />
        {/* S letter */}
        <path
          d="M14 52.5C14 52.5 18.5 57 27.5 57C36.5 57 40 52.5 40 48C40 38 14 42 14 32C14 27.5 18.5 23 27.5 23C36.5 23 40 27.5 40 27.5"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* E letter */}
        <path
          d="M48 57V23H70M48 40H66M48 57H70"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {/* SURFACE EXPERTS text */}
      <div className="font-body text-[10px] text-accent font-bold tracking-[0.2em] uppercase mt-1">
        Surface Experts<span className="align-super text-[6px]">&reg;</span>
      </div>
    </div>
  )
}
