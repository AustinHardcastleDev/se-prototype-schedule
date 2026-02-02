# Project Context for AI Agents

## Project Overview
SE Schedule — a schedule management prototype for Surface Experts, a surface repair company. Shows tech and sales team schedules with mobile day-view and desktop multi-column view. Uses mock JSON data with drag-and-drop, conflict detection, and a dark chrome industrial design system.

## Tech Stack
- **Frontend:** React 18 + Vite
- **Data Layer:** Mock/Local Data (JSON files in src/data/)
- **Deployment:** Vercel
- **Key Libraries:** react-router-dom, date-fns, @dnd-kit/core, @dnd-kit/sortable, react-hot-toast

## Project Structure
```
/
├── src/
│   ├── components/
│   │   ├── schedule/        - Calendar/schedule components
│   │   └── ui/              - Shared UI components (buttons, modals)
│   ├── layouts/
│   │   ├── AppLayout.jsx    - Responsive shell
│   │   ├── Sidebar.jsx      - Desktop sidebar
│   │   ├── MobileTopBar.jsx - Mobile top bar
│   │   └── HamburgerDrawer.jsx - Mobile nav drawer
│   ├── data/
│   │   ├── teamMembers.json - Team member definitions
│   │   ├── events.json      - Mock schedule events
│   │   ├── eventTypes.json  - Event type definitions with colors
│   │   └── README.md        - Data schema docs
│   ├── utils/
│   │   └── dataAccess.js    - Centralized data access (ONLY import point for data)
│   ├── hooks/               - Custom React hooks
│   ├── App.jsx
│   └── main.jsx
├── public/
├── scripts/ralph/
│   ├── ralph-claude.sh      - Ralph runner script
│   └── prompt.md            - Ralph instructions
├── tasks/
│   └── se-schedule.md       - Refined PRD
├── prd.json                 - Ralph task configuration
└── AGENTS.md                - This file
```

## Design System (CRITICAL — follow exactly)

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| charcoal | #1A1A1A | Main background, sidebar, top bar |
| accent | #F47A20 | Borders, primary buttons, active states |
| card-bg | #FFFFFF | Content cards, event cards |
| secondary | #2A2A2A | Secondary buttons, input fills |
| text-light | #FFFFFF | Text on dark backgrounds |
| text-dark | #1A1A1A | Text on light backgrounds |
| muted | #9CA3AF | Secondary/muted text |

### Typography
- **Headings:** Bebas Neue (Google Fonts), bold, uppercase
- **Body/Labels:** Open Sans (Google Fonts), weight 400
- Load via `<link>` in index.html

### Components
- **Buttons:** `border-radius: 9999px` (pill shape)
  - Primary: orange fill (#F47A20), white text
  - Secondary: dark fill (#2A2A2A), white text
- **Cards:** white bg, `border: 1px solid #F47A20`, `border-radius: 8px`
- **Hover/Active:** brightness shift only, no color changes
- **No gradients, no shadows, minimal decoration**

### Event Type Colors
| Type | Color | Border |
|------|-------|--------|
| job-occupied | #3B82F6 | #2563EB |
| job-vacant | #14B8A6 | #0D9488 |
| callback-job | #F59E0B | #D97706 |
| sales-stop | #8B5CF6 | #7C3AED |
| meeting | #64748B | #475569 |
| time-off | #F43F5E | #E11D48 |

### Job Status Indicators
- Open: no indicator
- Closed, no invoice: yellow dot (#EAB308)
- Closed, invoiced: purple dot (#8B5CF6)

## Code Patterns

### Data Access (CRITICAL)
**ALL data access goes through `src/utils/dataAccess.js`.** Components NEVER import JSON files directly.

```javascript
// src/utils/dataAccess.js
import teamMembers from '../data/teamMembers.json'
import events from '../data/events.json'
import eventTypes from '../data/eventTypes.json'

export const getAllMembers = () => teamMembers
export const getMemberById = (id) => teamMembers.find(m => m.id === id)
export const getEventsForMember = (memberId, date) =>
  events.filter(e => e.assigneeId === memberId && e.date === date)
export const getEventsForDate = (date) =>
  events.filter(e => e.date === date)
export const getEventTypes = () => eventTypes
export const getEventTypeByKey = (key) => eventTypes.find(t => t.key === key)
```

### State Management
Events are loaded from JSON into React state at the schedule page level. All mutations (create, edit, delete, drag-drop) update this state. No persistence — data resets on page reload.

```javascript
const [events, setEvents] = useState(getEventsForDate(selectedDate))
```

### Time Calculations
```javascript
// Convert time string "HH:MM" to pixel offset
const timeToOffset = (timeStr, slotHeight = 16) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const slotsFromStart = (hours - 6) * 4 + minutes / 15
  return slotsFromStart * slotHeight
}

// Event card height
const eventHeight = (startTime, endTime, slotHeight = 16) => {
  const startOffset = timeToOffset(startTime, slotHeight)
  const endOffset = timeToOffset(endTime, slotHeight)
  return endOffset - startOffset
}
```

### Conflict Detection
```javascript
const hasConflict = (events, newEvent) => {
  return events.some(existing =>
    existing.id !== newEvent.id &&
    existing.assigneeId === newEvent.assigneeId &&
    existing.date === newEvent.date &&
    existing.startTime < newEvent.endTime &&
    existing.endTime > newEvent.startTime
  )
}
```

### Responsive Pattern
- Mobile: below 768px (md breakpoint)
- Desktop: 768px and above
- Use Tailwind: `hidden md:block` for desktop-only, `md:hidden` for mobile-only

## Calendar Configuration
- Time range: 6:00 AM – 8:00 PM (14 hours × 4 slots = 56 slots)
- Slot duration: 15 minutes
- Minimum event duration: 15 minutes

## Development Workflow
```bash
npm run dev      # Start dev server
npm run lint     # Run linter
npm run build    # Build for production
```

## Quality Standards
- [ ] All story-specific tests pass
- [ ] ESLint passes (`npm run lint`)
- [ ] Browser verification (for frontend) at mobile (375px) and desktop (1280px)
- [ ] Design system followed: correct fonts, colors, component styles
- [ ] No console errors

## Ralph Workflow
- Stories marked complete by setting `passes: true` in prd.json
- Progress logged in progress.txt
- Update this file with learnings during implementation

## Learnings from Implementation
<!-- Updated by Ralph during execution -->

### Story 1: Project Scaffolding (2026-02-02)
**ESLint 9 Flat Config:** Modern ESLint uses `eslint.config.js` with flat config format, not `.eslintrc`. Export an array of config objects with `files`, `languageOptions`, `plugins`, and `rules`.

**Tailwind Content Paths:** Must explicitly set `content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]` in tailwind.config.js for purging to work correctly.

**Google Fonts Loading:** Use `<link>` tags in index.html with preconnect for better performance:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
```

**Tailwind Font Families:** Define custom font families in theme.extend:
```js
fontFamily: {
  heading: ['"Bebas Neue"', 'sans-serif'],
  body: ['"Open Sans"', 'sans-serif'],
}
```

**Custom Colors in Tailwind:** All project colors (including event types and status indicators) are defined in tailwind.config.js for consistency. Use kebab-case for multi-word color names (e.g., `job-occupied`, `text-light`).

### Story 2: Mock Data and Data Access Layer (2026-02-02)
**JSON Import in Vite:** Vite supports native JSON imports using ES6 import syntax. JSON files are automatically parsed and can be imported directly: `import data from './data.json'`. No additional configuration needed.

**Centralized Data Access Pattern:** Create a single `dataAccess.js` utility that imports all JSON data files and exports typed accessor functions. This provides a single source of truth and prevents components from directly importing JSON files, making it easier to swap data sources later.

**Event Status Field:** The `status` field on events only applies to job-type events (job-occupied, job-vacant, callback-job). Values are: `open` (no indicator), `closed-no-invoice` (yellow dot), `closed-invoiced` (purple dot). Non-job events always use status "open".

**Realistic Mock Data Patterns:**
- Job titles use format: "{Property Name} - Unit {Unit Number}"
- Callback jobs prefix with "Callback: "
- Sales stops use company names
- Events span multiple days with realistic time distributions
- Status distribution: ~60% open, ~25% closed-no-invoice, ~15% closed-invoiced

**Testing Data Access in Development:** Using `useEffect` hook in App.jsx with console.log statements is an effective way to verify data access functions during development. Display stats in the UI (team member count, event counts) provides visual confirmation without needing to open console.

### Story 3: App Layout Shell and Routing (2026-02-02)
**React Router v6 Nested Routes:** Use `<Outlet />` in layout component to render child routes. Wrap routes with layout component using nested Route structure. The layout persists across all child routes.

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<AppLayout />}>
      <Route index element={<SchedulePage />} />
      <Route path="team" element={<TeamPage />} />
    </Route>
  </Routes>
</BrowserRouter>
```

**Responsive Layout Pattern:** Use Tailwind responsive classes for clean mobile/desktop switching:
- Sidebar: `hidden md:flex` (hidden on mobile, flex on desktop)
- Top bar: `md:hidden` (visible on mobile, hidden on desktop)
- Main content: `md:ml-64` to account for fixed sidebar width on desktop

**Slide-out Drawer Animation:** Controlled with state and Tailwind transitions:
```jsx
className={`fixed right-0 top-0 transform transition-transform duration-300 ${
  isOpen ? 'translate-x-0' : 'translate-x-full'
}`}
```

**Fixed Mobile Top Bar:** Use `fixed top-0 left-0 right-0 z-50` to keep header visible during scroll. Add `pt-14` to main content area to prevent content from hiding behind the fixed header.

**NavLink Active States:** React Router's `NavLink` provides `isActive` boolean in className function for conditional styling:
```jsx
<NavLink
  to="/"
  className={({ isActive }) =>
    `block px-4 py-3 rounded-lg ${isActive ? 'bg-accent text-white' : 'text-text-light hover:bg-secondary'}`
  }
>
```

**PropTypes Validation:** ESLint with React rules requires PropTypes for all component props. Import from 'prop-types' package and define at component bottom:
```jsx
import PropTypes from 'prop-types'

function MyComponent({ prop1, prop2 }) { ... }

MyComponent.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.func.isRequired
}

export default MyComponent
```

**date-fns for Date Display:** Use `format(date, 'MMMM yyyy')` for clean month/year display. Lighter and more flexible than moment.js.

### Story 4: Mobile Week Strip Navigation (2026-02-02)
**date-fns Week Calculations:** Use `startOfWeek(date, { weekStartsOn: 1 })` to start weeks on Monday (required for this project). The `addWeeks(date, n)` and `addDays(date, n)` functions make week navigation and day generation straightforward:
```jsx
const [currentWeekStart, setCurrentWeekStart] = useState(
  startOfWeek(selectedDate, { weekStartsOn: 1 })
)
const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
```

**isSameDay for Date Comparison:** Always use `isSameDay(date1, date2)` from date-fns instead of comparing date strings or using equality operators. Handles time portions and timezone issues correctly:
```jsx
const isSelected = isSameDay(day, selectedDate)
const isToday = isSameDay(day, new Date())
```

**Multiple Visual States in Components:** The WeekStrip shows three distinct states: selected (orange bg), today but not selected (orange ring), and default (gray text). Use nested ternary operators with clear logic:
```jsx
className={`... ${
  isSelected
    ? 'bg-accent text-white'
    : isToday
    ? 'bg-secondary text-text-light ring-1 ring-accent'
    : 'text-text-light hover:bg-secondary'
}`}
```

**Controlled Week Navigation Pattern:** Store week navigation state (`currentWeekStart`) separately from the selected date prop. This allows users to navigate weeks independently while maintaining their selected day across week changes. The component manages its own week state but delegates date selection to parent via callback.

**PropTypes for Date Objects:** Use `PropTypes.instanceOf(Date)` for date props, not `PropTypes.object`:
```jsx
WeekStrip.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  onDateSelect: PropTypes.func.isRequired,
}
```

### Story 5: Mobile Day Agenda Calendar Grid (2026-02-02)
**Absolute Positioning for Time Grids:** Use a container with `position: relative` and explicit height, then absolutely position time labels and grid lines. This allows pixel-perfect positioning for time slots:
```jsx
<div className="relative" style={{ height: `${TOTAL_SLOTS * SLOT_HEIGHT}px` }}>
  <div className="absolute left-0 right-0" style={{ top: `${topPosition}px` }}>
    {/* Time label and grid line */}
  </div>
</div>
```

**Time-to-Pixel Calculations:** Convert time strings to pixel offsets using slot-based math:
```javascript
const SLOT_HEIGHT = 16 // px per 15-min slot
const START_HOUR = 6
const slotsFromStart = (hours - START_HOUR) * 4 + minutes / 15
const pixelOffset = slotsFromStart * SLOT_HEIGHT
```
This formula is reusable for positioning events in future stories.

**Grid Line Visual Hierarchy:** Use Tailwind opacity modifiers for different line weights without defining new colors:
```jsx
<div className="border-t border-secondary" /> {/* Full hour: solid */}
<div className="border-t border-secondary/30" /> {/* Quarter hour: 30% opacity */}
```

**Auto-Updating Current Time Indicator:** Use `setInterval` in `useEffect` with cleanup to keep real-time indicators fresh:
```jsx
const [currentTime, setCurrentTime] = useState(new Date())

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(new Date())
  }, 60000) // Update every minute

  return () => clearInterval(interval)
}, [])
```

**Scrollable Grid Layout Pattern:** Container needs `flex-1` and `overflow-y-auto` to fill remaining height. Inner content has explicit pixel height for proper scroll behavior:
```jsx
<div className="flex-1 overflow-y-auto"> {/* Parent: fills remaining space */}
  <div className="relative" style={{ height: '896px' }}> {/* Child: explicit height enables scroll */}
```

**date-fns Time Formatting for AM/PM:** Use `format(date, 'h a')` for 12-hour time with space before AM/PM:
```javascript
import { format } from 'date-fns'
const date = new Date()
date.setHours(6, 0, 0, 0)
format(date, 'h a') // "6 AM"
```
Apply uppercase styling via CSS classes.

**Event Rendering Area Preparation:** Reserve space to the right of time labels for future event rendering:
```jsx
<div className="absolute left-16 right-0 top-0 bottom-0">
  {/* Events will be rendered here */}
</div>
```
The `left-16` offset (4rem/64px) accounts for time label width.

### Story 6: Event Card Component (2026-02-02)
**Proportional Event Card Sizing:** Calculate card height using the same slot-based math as time grid positioning:
```javascript
const SLOT_HEIGHT = 16 // Must match TimeGrid constant
const durationMinutes = endTime - startTime
const slots = durationMinutes / 15
const cardHeight = slots * SLOT_HEIGHT
```
This ensures pixel-perfect alignment with the time grid.

**Conditional Layout Based on Duration:** Use a 30-minute threshold to switch between condensed (title only) and full (title + time + type) layouts:
```jsx
const isShortEvent = durationMinutes < 30

{isShortEvent ? (
  <div className="text-xs font-body text-text-dark font-semibold truncate pr-3">
    {event.title}
  </div>
) : (
  <div className="flex flex-col gap-0.5 h-full">
    <div className="text-xs font-body text-text-dark font-semibold truncate pr-3">
      {event.title}
    </div>
    <div className="text-xs font-body text-muted truncate">
      {formatTime(event.startTime)} – {formatTime(event.endTime)}
    </div>
    <div className="text-xs font-body text-muted truncate">
      {eventType.label}
    </div>
  </div>
)}
```
Short events need condensed layouts to avoid visual clutter in small spaces.

**Status Indicator Dots Logic:** Only job-type events have status fields and should show status dots:
```javascript
const JOB_TYPES = ['job-occupied', 'job-vacant', 'callback-job']
const isJobType = JOB_TYPES.includes(event.type)
const statusColor = isJobType ? STATUS_COLORS[event.status] : null

// In render:
{statusColor && (
  <div
    className="absolute top-1 right-1 w-2 h-2 rounded-full"
    style={{ backgroundColor: statusColor }}
  />
)}
```
Status colors: `open` = no dot, `closed-no-invoice` = yellow (#EAB308), `closed-invoiced` = purple (#8B5CF6).

**Border Color vs Fill Color:** Event types define both `color` (background fill) and `borderColor` (darker variant). Use `borderColor` for the 4px left border on white card backgrounds:
```jsx
style={{
  height: `${cardHeight}px`,
  borderLeft: `4px solid ${eventType.borderColor}`,
}}
```
The darker border provides better contrast than using the lighter fill color.

**Text Truncation with Status Dots:** Apply `pr-3` (padding-right: 0.75rem) to titles to prevent text overlap with status indicator dots in top-right:
```jsx
<div className="text-xs font-body text-text-dark font-semibold truncate pr-3">
  {event.title}
</div>
```
The `truncate` class handles ellipsis automatically when text overflows.

**Time Formatting for Display:** Convert 24-hour HH:MM format to 12-hour h:MM AM/PM:
```javascript
const formatTime = (timeStr) => {
  const [hour, minute] = timeStr.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
}
```
Example: "08:00" → "8:00 AM", "14:30" → "2:30 PM"

**Interactive Card Styling:** Add hover brightness for click affordance:
```jsx
className="... hover:brightness-95 transition-all cursor-pointer"
```
Prepares for click handlers in edit/detail modals (Stories 11, 20).

### Story 7: Render Events on Mobile Calendar (2026-02-02)
**Date Formatting for Data Filtering:** When filtering events by date, convert the JavaScript Date object to match the JSON string format:
```javascript
import { format } from 'date-fns'

const selectedDate = new Date() // Date object from state
const formattedDate = format(selectedDate, 'yyyy-MM-dd') // "2026-02-03"
const events = getEventsForMember(memberId, formattedDate)
```
The events.json uses "YYYY-MM-DD" format, so always format the Date object before filtering.

**Controlled Component Pattern for Data Display:** TimeGrid is now a controlled component that receives both `selectedDate` and `selectedMember` as props rather than managing its own data. This makes it reusable and allows the parent (SchedulePage) to control what data is displayed:
```jsx
// Parent manages state
const [selectedDate, setSelectedDate] = useState(new Date())
const [selectedMember, setSelectedMember] = useState(allMembers[0])

// Child receives state and displays filtered data
<TimeGrid selectedDate={selectedDate} selectedMember={selectedMember} />
```
This pattern separates concerns: parent handles state, child handles display.

**Empty State Positioning in Absolute Layout:** When the event rendering area uses absolute positioning, the empty state message needs careful positioning:
```jsx
<div className="absolute left-16 right-0 top-0 bottom-0 px-1">
  {events.length === 0 ? (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted font-body text-sm">
        No events scheduled for {selectedMember.name} on {format(selectedDate, 'MMM d, yyyy')}
      </p>
    </div>
  ) : (
    // Render events
  )}
</div>
```
The wrapper div fills the available space (left-16 to right-0, top-0 to bottom-0), and the empty state uses flex centering to appear in the middle.

**PropTypes for Complex Objects:** When passing complex objects as props, define the shape explicitly:
```jsx
TimeGrid.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  selectedMember: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
}
```
This provides clear documentation and runtime validation of the expected prop structure.

**Handling Unused State Setters:** When adding state that will be used in future stories (like `setSelectedMember` for Story 9), use eslint-disable to suppress warnings:
```jsx
// eslint-disable-next-line no-unused-vars
const [selectedMember, setSelectedMember] = useState(allMembers[0])
```
This keeps the setter in place for future use while passing current linting checks.

**Reactive Data Updates:** When the parent component's state changes (selectedDate from WeekStrip), the child component automatically re-renders with filtered data because:
1. Parent state change triggers parent re-render
2. Parent passes new props to child
3. Child re-renders and re-filters data based on new props
4. No manual re-fetching needed — React's reactivity handles it

This is why TimeGrid doesn't need useEffect to watch for prop changes — the component function re-runs whenever props change.

### Story 8: Mobile FAB - Create Event Actions (2026-02-02)
**Tailwind Custom Animations:** To add custom animations, define keyframes in `theme.extend.keyframes` and reference them in `theme.extend.animation`:
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
      },
    },
  },
}
```
Then use in components: `className="animate-fadeIn"`

**FAB Menu Pattern (Google Calendar Style):** Floating Action Button with expanding menu:
- FAB container: `fixed bottom-6 right-6 z-50` for bottom-right positioning
- Action buttons: absolutely positioned above FAB (`absolute bottom-16 right-0`)
- Backdrop overlay: `fixed inset-0 bg-black/50 z-40` for dimmed background
- z-index layering: backdrop (z-40) → FAB container (z-50)
- Backdrop click handler closes menu

**Transform Animations with Tailwind:** Combine rotation and scale for smooth FAB icon transitions:
```jsx
className={`... ${
  isOpen ? 'rotate-45 scale-110' : 'rotate-0 scale-100'
}`}
```
The `transition-all` class smoothly animates between states. 45-degree rotation turns the plus icon into an X.

**Mobile-Only Fixed Positioning:** Use `md:hidden` on both FAB and backdrop to ensure they only appear on mobile:
```jsx
<div className="fixed inset-0 bg-black/50 z-40 md:hidden" />
<div className="fixed bottom-6 right-6 z-50 md:hidden">
```
This prevents FAB from appearing on desktop where different UI patterns are used.

**Dynamic Event Type Buttons:** Use `getEventTypes()` to generate action buttons dynamically:
```jsx
const eventTypes = getEventTypes()
{eventTypes.map((eventType) => (
  <button key={eventType.key} style={{ backgroundColor: eventType.color }}>
    {eventType.label}
  </button>
))}
```
Maintains single source of truth — event types defined once in JSON, used everywhere.

**Pill-Shaped Action Buttons:** White buttons with colored indicators and pill shape:
```jsx
<button className="flex items-center gap-3 bg-white rounded-full px-4 py-3 shadow-lg">
  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: eventType.color }} />
  <span className="text-sm font-body text-text-dark font-semibold">{eventType.label}</span>
</button>
```
`rounded-full` creates pill shape, colored dot shows event type, shadow provides depth.

**Callback Props for Event Handlers:** Pass callbacks to child components for user interactions:
```jsx
// Parent (SchedulePage)
const handleEventTypeSelect = (eventType) => {
  // TODO: Open create event modal (Story 10)
  console.log('Selected event type:', eventType)
}
<FloatingActionButton onEventTypeSelect={handleEventTypeSelect} />

// Child (FloatingActionButton)
const handleEventTypeClick = (eventType) => {
  setIsOpen(false)
  onEventTypeSelect(eventType)
}
```
Close menu first, then notify parent. Console.log serves as placeholder for future modal integration.

### Story 9: Mobile FAB - Team Member Switcher (2026-02-02)
**Sorting Current User to Bottom of List:** To keep the current user at the bottom (matching the FAB button position), use array sorting with conditional ID comparison:
```javascript
const sortedMembers = [...allMembers].sort((a, b) => {
  if (a.id === selectedMember.id) return 1  // Move selected to end
  if (b.id === selectedMember.id) return -1
  return 0  // Keep others in original order
})
```
This creates a new sorted array where the selected member always appears last, while other members maintain their original order.

**Multiple Visual Indicators for Selection:** Combine two visual cues for better UX:
1. Orange ring around the entire button: `ring-2 ring-accent`
2. Small orange dot indicator next to the name: `<div className="w-2 h-2 rounded-full bg-accent" />`

This dual indication makes it immediately clear which team member is currently selected, even when scanning the list quickly.

**Dynamic FAB Button Styling:** Use inline styles to set the FAB button's background color to match the selected member's color:
```jsx
<button
  style={{ backgroundColor: selectedMember.color }}
  className="w-12 h-12 rounded-full..."
>
  <span>{selectedMember.avatar}</span>
</button>
```
This provides instant visual feedback about whose schedule is being viewed without needing to open the menu.

**Reusing FAB Pattern:** The TeamMemberSwitcher follows the same structure as FloatingActionButton:
- Backdrop overlay: `fixed inset-0 bg-black/50 z-40`
- FAB container: `fixed bottom-6 left-6 z-50` (left instead of right)
- Action buttons: `absolute bottom-16` positioned above FAB
- Mobile-only: `md:hidden` on both backdrop and container

This pattern consistency makes the codebase easier to understand and maintain.

**Controlled Component for Team Member Selection:** The parent (SchedulePage) owns the selectedMember state and passes it down with an onMemberSelect callback. The switcher displays the current selection but doesn't manage its own state:
```jsx
// Parent
const [selectedMember, setSelectedMember] = useState(allMembers[0])
<TeamMemberSwitcher selectedMember={selectedMember} onMemberSelect={setSelectedMember} />

// Child
const handleMemberClick = (member) => {
  setIsOpen(false)
  onMemberSelect(member)  // Notify parent
}
```
This allows multiple components (TimeGrid, TeamMemberSwitcher) to react to the same state changes.

### Story 10: Create Event Modal - Mobile (2026-02-02)
**Bottom Sheet Modal Pattern:** Use `transform translate-y-full` for off-screen initial positioning and `translate-y-0` with transition for slide-up animation from bottom. The `rounded-t-2xl` on the modal container creates the characteristic bottom-sheet appearance with rounded top corners:
```jsx
<div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden transform transition-transform duration-300 ${
  isOpen ? 'translate-y-0' : 'translate-y-full'
}`}>
```
Combine with a backdrop overlay (`fixed inset-0 bg-black/50 z-40`) to dim the background.

**Drag Handle Visual Affordance:** A small gray bar at the top of bottom-sheet modals provides visual feedback that the sheet can be dragged/dismissed, following mobile design conventions:
```jsx
<div className="flex justify-center py-3">
  <div className="w-12 h-1 bg-muted rounded-full" />
</div>
```
This is a visual-only element in Story 10 (no drag functionality yet), but prepares for future enhancements.

**Time Picker Options Generation:** For 15-minute increment time pickers, loop through hours (6-20) and minutes (0, 15, 30, 45) to generate all valid options:
```javascript
const generateTimeOptions = () => {
  const options = []
  for (let hour = 6; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 20 && minute > 0) break // Stop after 8:00 PM
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const period = hour >= 12 ? 'PM' : 'AM'
      const displayStr = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
      options.push({ value: timeStr, label: displayStr })
    }
  }
  return options
}
```
Store values in 24-hour HH:MM format for data consistency, display in 12-hour format with AM/PM for UX.

**Colored Dropdown Indicators:** For event type dropdowns, position colored indicator dots absolutely at the left side of the select element:
```jsx
<div className="relative">
  <select value={eventType} onChange={...} className="w-full px-4 py-3 bg-secondary text-text-light rounded-lg appearance-none">
    {eventTypes.map(et => <option key={et.key} value={et.key}>{et.label}</option>)}
  </select>
  <div
    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
    style={{ backgroundColor: selectedEventType?.borderColor }}
  />
</div>
```
The `pointer-events-none` ensures the dot doesn't interfere with dropdown clicks. Use `borderColor` (darker shade) for better visibility.

**Inline Validation Pattern:** Use local component state for validation errors and display them conditionally in a styled container:
```jsx
const [validationError, setValidationError] = useState('')

// In validate function
if (!validateTimes(startTime, endTime)) {
  setValidationError('End time must be after start time')
  return
}

// In render
{validationError && (
  <div className="mb-4 px-4 py-2 bg-rose-100 text-time-off rounded-lg text-sm font-body">
    {validationError}
  </div>
)}
```
Clear the error when user modifies relevant fields (onChange handlers) to provide immediate feedback and prevent persistent error states.

**Form Pre-population with Defaults:** Accept a `defaults` prop to pre-populate form fields. Use `useEffect` to reset fields when modal opens with new defaults:
```jsx
const [eventType, setEventType] = useState(defaults.eventType || eventTypes[0].key)
// ... other fields

useEffect(() => {
  if (isOpen) {
    setEventType(defaults.eventType || eventTypes[0].key)
    setAssigneeId(defaults.assigneeId || allMembers[0].id)
    setDate(defaults.date || format(new Date(), 'yyyy-MM-dd'))
    setStartTime(defaults.startTime || '09:00')
    setEndTime(defaults.endTime || '10:00')
    setTitle('')
    setValidationError('')
  }
}, [isOpen, defaults, eventTypes, allMembers])
```
This ensures clean state for each modal invocation and handles cases where defaults change between openings.

**Event State Management Pattern:** Manage the events array at the page level (SchedulePage), not within individual components:
```jsx
// SchedulePage.jsx
const initialEvents = getEventsForDate(format(new Date(), 'yyyy-MM-dd'))
const [events, setEvents] = useState(initialEvents)

const handleCreateEvent = (newEvent) => {
  setEvents([...events, newEvent])
}

<TimeGrid events={events} selectedDate={selectedDate} selectedMember={selectedMember} />
<CreateEventModal onSave={handleCreateEvent} />
```
TimeGrid filters the events it receives based on selected member and date. This centralized state management allows future components (EditModal, DesktopGrid) to share the same event data and updates.

**Lifting State for Shared Data:** When multiple components need to interact with the same data (events, selected member, selected date), lift the state to the nearest common ancestor. The parent manages state and passes down both data and updater functions:
```jsx
// Parent manages state
const [events, setEvents] = useState(initialEvents)
const [selectedMember, setSelectedMember] = useState(allMembers[0])

// Children receive controlled props
<TimeGrid events={events} selectedMember={selectedMember} />
<TeamMemberSwitcher selectedMember={selectedMember} onMemberSelect={setSelectedMember} />
<CreateEventModal onSave={handleCreateEvent} />
```

**Date Formatting for Data Consistency:** Always format JavaScript Date objects to 'yyyy-MM-dd' string format when creating events or filtering data:
```javascript
import { format } from 'date-fns'

const newEvent = {
  id: `evt-${Date.now()}`,
  date: format(selectedDate, 'yyyy-MM-dd'), // Not selectedDate.toISOString()
  // ... other fields
}
```
This matches the JSON schema format and ensures consistent string-based date comparisons throughout the app.

**Generating Unique IDs for Local State:** For client-side-only event creation, use timestamp-based IDs:
```javascript
const newEvent = {
  id: `evt-${Date.now()}`,
  // ... other fields
}
```
This provides reasonable uniqueness for local development. In production, IDs would come from the backend.

**Backdrop Click Handler Safety:** When handling backdrop clicks to close modals, check that the click target is the backdrop itself, not a bubbled event from children:
```jsx
const handleBackdropClick = (e) => {
  if (e.target === e.currentTarget) {
    onClose()
  }
}

<div className="fixed inset-0 bg-black/50 z-40" onClick={handleBackdropClick} />
```
Without this check, clicking anywhere inside the modal (including form fields) would close it.

**Mobile-Only Modal Pattern:** Use `md:hidden` on both backdrop and modal container to restrict to mobile views:
```jsx
<div className="fixed inset-0 bg-black/50 z-40 md:hidden" />
<div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden">
```
Desktop views will use centered modals (Stories 19-20) instead of bottom sheets.