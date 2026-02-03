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

### Story 12: Long-Press to Create Event on Mobile (2026-02-02)
**Pointer Events for Cross-Platform Input:** Using pointer events (`onPointerDown`, `onPointerUp`, `onPointerLeave`) provides unified handling for touch, mouse, and pen input. This is more future-proof and cleaner than maintaining separate touch and mouse event handlers:
```jsx
<div
  onPointerDown={handlePointerDown}
  onPointerUp={handlePointerUp}
  onPointerLeave={handlePointerLeave}
>
```
Pointer events abstract away the input device, making code work consistently across desktop and mobile.

**Timer-Based Long Press Pattern:** Implement long press detection using setTimeout with cleanup:
```javascript
const [longPressTimer, setLongPressTimer] = useState(null)
const [isLongPressing, setIsLongPressing] = useState(false)

const handlePointerDown = (e) => {
  setIsLongPressing(true)
  const timer = setTimeout(() => {
    // Long press detected after 500ms
    onLongPress()
    setIsLongPressing(false)
  }, 500)
  setLongPressTimer(timer)
}

const handlePointerUp = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    setLongPressTimer(null)
    // If released before 500ms, treat as regular click
    if (isLongPressing) {
      onClick()
    }
  }
  setIsLongPressing(false)
}

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (longPressTimer) clearTimeout(longPressTimer)
  }
}, [longPressTimer])
```
Key aspects: track timer reference, track long-press state for visual feedback, clear timer on up/leave, distinguish long press from click.

**Visual Feedback During Long Press:** Use state to conditionally apply styles while long press is active:
```jsx
// TimeGrid: Highlight the slot being pressed
{longPressSlot !== null && (
  <div
    className="absolute left-0 right-0 bg-accent/20 pointer-events-none"
    style={{ top: `${longPressSlot * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
  />
)}

// EventCard: Dim the card during long press
<div className={`... ${isLongPressing ? 'brightness-90' : ''}`}>
```
The `pointer-events-none` on the feedback overlay prevents it from interfering with pointer events.

**Preventing Event Bubbling in Nested Handlers:** When you have nested interactive areas (events within a time grid), prevent child events from triggering parent handlers:
```javascript
// EventCard: Stop propagation to prevent slot handler from firing
const handlePointerDown = (e) => {
  e.stopPropagation() // Critical!
  // ... long press logic
}

// TimeGrid: Also check if click is on an event as fallback
const handlePointerDown = (e) => {
  if (e.target.closest('[data-event-card]')) return
  // ... slot long press logic
}
```
Use both `stopPropagation()` and a `data-event-card` attribute check for robust event handling.

**Touch-Action CSS for Mobile:** Add `touch-none` class to prevent browser scroll interference during long press on touch devices:
```jsx
<div className="... touch-none" onPointerDown={...}>
```
Without this, attempting to long-press on mobile would often trigger scrolling instead of the long-press action. `touch-none` disables all default touch behaviors (pan, zoom, etc.) on that element.

**Y-Position to Time Calculation:** Convert pixel Y offset within the grid to a time string:
```javascript
const calculateTimeFromY = (yPosition) => {
  const slots = Math.floor(yPosition / SLOT_HEIGHT) // Which 15-min slot?
  const totalMinutes = slots * 15
  const hours = Math.floor(totalMinutes / 60) + START_HOUR
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
```
This reuses the same slot-based math as event positioning, ensuring consistency. The `getBoundingClientRect()` on the grid container gives us the reference point for calculating relative Y position from `e.clientY`.

**Default End Time Logic:** When creating an event from a long-press, default the end time to start + 1 hour:
```javascript
const [startHour, startMin] = startTime.split(':').map(Number)
const endHour = startHour + 1
const endTime = `${endHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`
```
Edge case: if start is 7:30 PM or later, end time may exceed 8 PM (grid boundary). The modal validation will catch this, or you can clamp it to END_HOUR in the calculation.

**Dual-Purpose Long Press on Events:** Long-pressing an event card should open the edit modal (same as a regular click in this implementation). The EventCard component accepts both `onClick` and `onLongPress` props:
```jsx
// TimeGrid passes onEventClick for both
<EventCard
  event={event}
  onClick={() => onEventClick(event)}
  onLongPress={() => onEventClick(event)}
/>
```
This keeps the UX consistent—both actions lead to editing. In other scenarios, you might use long-press for a different action (e.g., delete confirmation menu).

### Story 13: Mobile Drag-and-Drop - Move Events (2026-02-02)
**@dnd-kit Library Integration:** Use @dnd-kit/core for drag-and-drop instead of manual touch event handling. The library handles both touch and mouse automatically via pointer events. Install with:
```bash
npm install @dnd-kit/core @dnd-kit/sortable react-hot-toast
```

**DndContext Setup:** Wrap the draggable area with DndContext and implement drag handlers:
```jsx
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core'

<DndContext
  onDragStart={handleDragStart}
  onDragMove={handleDragMove}
  onDragEnd={handleDragEnd}
  onDragCancel={handleDragCancel}
  collisionDetection={pointerWithin}
>
  {/* Draggable content */}
  <DragOverlay dropAnimation={null}>
    {activeEvent ? <EventCard event={activeEvent} /> : null}
  </DragOverlay>
</DndContext>
```
The DragOverlay shows a copy of the dragged element following the cursor for visual feedback.

**DraggableEvent Wrapper Component:** Create a wrapper that uses the useDraggable hook:
```jsx
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

export default function DraggableEvent({ event, onEventClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: { event },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <EventCard event={event} disableInteraction={true} />
    </div>
  )
}
```
The wrapper receives drag attributes/listeners from @dnd-kit and passes them to the DOM element. Set opacity to 0.5 during drag for visual feedback.

**Pointer Event Conflicts:** Components with `e.stopPropagation()` in pointer handlers will block @dnd-kit's drag detection. Solution: Add a `disableInteraction` prop to conditionally disable pointer handlers when component is wrapped in DraggableEvent:
```jsx
const pointerHandlers = disableInteraction
  ? {}
  : {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
    }

<div {...pointerHandlers}>
```
This pattern allows EventCard to work both standalone (clickable/long-pressable) and in drag context (draggable only).

**Drag Ghost Preview:** Show a visual indicator at the target drop location during drag:
```jsx
{dragOverSlot !== null && activeEvent && (
  <div
    className="absolute left-0 right-0 pointer-events-none z-20 border-2 border-dashed border-accent bg-accent/10"
    style={{ top: `${dragOverSlot * SLOT_HEIGHT}px`, height: `${eventHeight}px` }}
  >
    <div className="p-1.5 text-xs text-accent font-semibold truncate">
      {activeEvent.title}
    </div>
  </div>
)}
```
Use dashed orange border with 10% opacity background. Update dragOverSlot in onDragMove based on delta.y.

**Drag Handlers - onDragStart:** Store the active dragged element ID:
```javascript
const handleDragStart = (event) => {
  setActiveId(event.active.id)
}
```

**Drag Handlers - onDragMove:** Calculate which slot is being hovered over:
```javascript
const handleDragMove = (event) => {
  const { delta } = event
  const draggedEvent = events.find((e) => e.id === activeId)
  const originalOffset = calculateEventOffset(draggedEvent.startTime)
  const newOffset = originalOffset + delta.y
  const newSlot = Math.max(0, Math.min(TOTAL_SLOTS - 1, Math.floor(newOffset / SLOT_HEIGHT)))
  setDragOverSlot(newSlot)
}
```
Clamp slot to valid range (0 to TOTAL_SLOTS - 1).

**Drag Handlers - onDragEnd:** Calculate new time, check conflicts, update state:
```javascript
const handleDragEnd = (event) => {
  const { active, delta } = event

  // Calculate new slot and time
  const draggedEvent = events.find((e) => e.id === active.id)
  const originalOffset = calculateEventOffset(draggedEvent.startTime)
  const newSlot = Math.floor((originalOffset + delta.y) / SLOT_HEIGHT)
  const newStartTime = calculateTimeFromSlot(newSlot)

  // Preserve duration
  const durationMinutes = /* calculate */
  const newEndTime = /* add duration to newStartTime */

  // Check bounds
  if (newStartHour < START_HOUR || newEndHour > END_HOUR) {
    toast.error('Event cannot be moved outside of 6 AM - 8 PM')
    return
  }

  // Check conflicts
  if (hasConflict(draggedEvent.id, newStartTime, newEndTime, draggedEvent.date)) {
    toast.error('Cannot move event - time slot conflicts with another event')
    return
  }

  // Update event
  onEventUpdate({ ...draggedEvent, startTime: newStartTime, endTime: newEndTime })
}
```

**Conflict Detection:** Check if two time ranges overlap:
```javascript
const eventsOverlap = (event1Start, event1End, event2Start, event2End) => {
  return event1Start < event2End && event1End > event2Start
}

const hasConflict = (eventId, newStartTime, newEndTime, newDate) => {
  return events.some((existingEvent) => {
    if (existingEvent.id === eventId) return false // Don't check against self
    if (existingEvent.date !== newDate || existingEvent.assigneeId !== selectedMember.id) {
      return false // Only check same date/person
    }
    return eventsOverlap(newStartTime, newEndTime, existingEvent.startTime, existingEvent.endTime)
  })
}
```
Check both time range overlap and same date/assignee.

**Time Snapping to 15-Minute Increments:** Round calculated times to nearest 15-minute slot:
```javascript
const roundToNearestSlot = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes
  const roundedMinutes = Math.round(totalMinutes / 15) * 15
  const roundedHours = Math.floor(roundedMinutes / 60)
  const roundedMins = roundedMinutes % 60
  return `${roundedHours.toString().padStart(2, '0')}:${roundedMins.toString().padStart(2, '0')}`
}
```

**Toast Notifications with react-hot-toast:** Configure Toaster with design system styles:
```jsx
import { Toaster, toast } from 'react-hot-toast'

<Toaster
  position="top-center"
  toastOptions={{
    duration: 3000,
    style: {
      background: '#2A2A2A',
      color: '#FFFFFF',
      border: '1px solid #F47A20',
    },
  }}
/>
```
Show errors with `toast.error('message')`. Position at top-center to avoid FABs at bottom.

**Duration Preservation During Drag:** Calculate original duration and add to new start time:
```javascript
const [oldStartHour, oldStartMin] = draggedEvent.startTime.split(':').map(Number)
const [oldEndHour, oldEndMin] = draggedEvent.endTime.split(':').map(Number)
const durationMinutes = (oldEndHour * 60 + oldEndMin) - (oldStartHour * 60 + oldStartMin)

const [newStartHour, newStartMin] = newStartTime.split(':').map(Number)
const endTotalMinutes = (newStartHour * 60 + newStartMin) + durationMinutes
const newEndHour = Math.floor(endTotalMinutes / 60)
const newEndMin = endTotalMinutes % 60
const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`
```
This ensures event duration stays constant when moved to a new time.

**State Management for Drag Updates:** Pass an onEventUpdate callback from parent page to TimeGrid:
```jsx
// SchedulePage.jsx
const handleUpdateEvent = (updatedEvent) => {
  setEvents(events.map((evt) => (evt.id === updatedEvent.id ? updatedEvent : evt)))
}

<TimeGrid onEventUpdate={handleUpdateEvent} />

// TimeGrid.jsx - in onDragEnd
if (onEventUpdate) {
  onEventUpdate({ ...draggedEvent, startTime: newStartTime, endTime: newEndTime })
}
```
Keep state management centralized at the page level.

### Story 15: Desktop Date Picker Bar (2026-02-02)
**Controlled Date Component Pattern:** The DesktopDatePicker is a controlled component receiving `selectedDate` as a prop and calling `onDateChange` callback. This allows the parent (SchedulePage) to manage date state centrally and share it with other components:
```jsx
// Parent (SchedulePage)
const [selectedDate, setSelectedDate] = useState(new Date())

<DesktopDatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
<WeekStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />
<TimeGrid selectedDate={selectedDate} ... />
```
Both mobile (WeekStrip) and desktop (DesktopDatePicker) date pickers use the same state and callback, ensuring consistency.

**Conditional Today Button:** Use `isSameDay(selectedDate, new Date())` to determine if the Today button should be shown:
```jsx
const isToday = isSameDay(selectedDate, new Date())

{!isToday && (
  <button onClick={handleToday}>Today</button>
)}
```
Only show when viewing a date other than today. This reduces UI clutter and provides clear affordance for returning to today's date.

**date-fns Navigation Helpers:** The `addDays(date, 1)` and `subDays(date, 1)` functions provide clean day-by-day navigation:
```jsx
const handlePreviousDay = () => onDateChange(subDays(selectedDate, 1))
const handleNextDay = () => onDateChange(addDays(selectedDate, 1))
const handleToday = () => onDateChange(new Date())
```
These handle month boundaries and edge cases automatically, unlike manual date arithmetic.

**Full Date Format Display:** Use `format(selectedDate, 'EEEE, MMMM d, yyyy')` for the complete date format:
```jsx
<h1 className="font-heading text-3xl uppercase">
  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
</h1>
```
Output: "MONDAY, FEBRUARY 2, 2026". The uppercase styling is applied via CSS class on the Bebas Neue heading.

**Desktop-Only Component Pattern:** Use `hidden md:flex` to show only on desktop:
```jsx
<div className="hidden md:flex items-center justify-between ...">
```
Component is invisible on mobile (<768px) and visible as flexbox on desktop (≥768px). Cleaner than conditional rendering and keeps component in DOM for future enhancements like scroll-sync (Story 18).

**Preparing for External Updates:** The controlled component pattern with props makes external date updates possible. In Story 18, scroll position can update the `selectedDate` state in the parent, which automatically propagates to DesktopDatePicker. No changes to the component needed - it's already prepared for this use case.

**SVG Arrow Icons:** Using inline SVG with Tailwind classes provides crisp rendering and keeps components self-contained:
```jsx
<svg className="w-6 h-6 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
</svg>
```
No external icon library dependencies needed.

**Accessibility for Icon Buttons:** Always add `aria-label` to icon-only buttons:
```jsx
<button aria-label="Previous day" onClick={handlePreviousDay}>
  <svg>...</svg>
</button>
```
Critical for screen reader users who can't see the visual icon.

### Story 16: Desktop Multi-Column Time Grid (2026-02-02)
**Desktop Multi-Column Pattern:** The desktop grid uses a fundamentally different layout than mobile. Instead of filtering events for one person, it shows all team members simultaneously. This requires a flexible column system where each column has the same time scale but different event content:
```jsx
<div className="hidden md:flex md:flex-col flex-1">
  {/* Sticky header row with team member columns */}
  <div className="sticky top-0 z-30">
    <div className="flex">
      <div className="w-16 flex-shrink-0" /> {/* Time label spacer */}
      {teamMembers.map(member => (
        <div key={member.id} className="flex-1">
          {/* Avatar and name */}
        </div>
      ))}
    </div>
  </div>

  {/* Grid body with time labels and columns */}
  <div className="relative" style={{ height: TOTAL_HEIGHT }}>
    {/* Time labels and grid lines for each column */}
  </div>
</div>
```
The desktop view is hidden on mobile with `hidden md:flex`, while the mobile single-column view uses `md:hidden`.

**Sticky Column Headers:** Using `sticky top-0 z-30` on the header row keeps team member names visible during scroll. The z-index (30) ensures headers stay above grid content (z-10 for current time indicator, z-20 for drag previews) but below modals (z-40+):
```jsx
<div className="sticky top-0 z-30 bg-charcoal border-b border-secondary">
  {/* Column headers */}
</div>
```
Without `bg-charcoal`, the grid content would show through the transparent sticky header during scroll.

**Flexbox for Even Column Distribution:** Using `flex-1` on each column div ensures all columns have equal width regardless of the number of team members:
```jsx
{teamMembers.map((member, index) => (
  <div
    key={member.id}
    className="flex-1 relative"
    style={{ borderLeft: index === 0 ? 'none' : '1px solid #2A2A2A' }}
  >
    {/* Column content */}
  </div>
))}
```
The `flex-shrink-0` on the time label column (`w-16`) prevents it from shrinking when columns compete for space.

**Shared Grid Lines Pattern:** Grid lines are rendered within each column div, not globally. This ensures each column has its own set of lines that stay aligned with the column boundaries:
```jsx
<div className="flex ml-16"> {/* ml-16 accounts for time label width */}
  {teamMembers.map((member, index) => (
    <div key={member.id} className="flex-1 relative">
      {/* Hour line */}
      <div className="absolute left-0 right-0 border-t border-secondary" />

      {/* Quarter hour lines (lighter) */}
      <div className="absolute left-0 right-0 border-t border-secondary/30"
        style={{ top: `${SLOT_HEIGHT}px` }}
      />
      {/* ... more quarter lines */}
    </div>
  ))}
</div>
```
Each column's grid lines are positioned absolutely within the column's relative container.

**Border Management Between Columns:** The first column (index 0) has no left border to avoid double-border with the time label area. Subsequent columns have `border-left: 1px solid #2A2A2A` for visual separation:
```jsx
style={{ borderLeft: index === 0 ? 'none' : '1px solid #2A2A2A' }}
```
This creates clean vertical dividers between columns without doubling up at the edges.

**Responsive Grid Switching:** The mobile TimeGrid is wrapped in a responsive container to ensure proper height management and visibility control:
```jsx
{/* Mobile: Single-column view */}
<div className="md:hidden flex flex-col flex-1">
  <TimeGrid selectedDate={selectedDate} selectedMember={selectedMember} ... />
</div>

{/* Desktop: Multi-column view */}
<DesktopTimeGrid selectedDate={selectedDate} />
```
The mobile container uses `flex flex-col flex-1` to ensure TimeGrid takes full available height. DesktopTimeGrid has its own `hidden md:flex md:flex-col flex-1` classes built-in.

**Reusing Time Grid Constants:** The same SLOT_HEIGHT (16px), START_HOUR (6), END_HOUR (20), SLOTS_PER_HOUR (4), TOTAL_SLOTS constants should be used across mobile TimeGrid and DesktopTimeGrid for consistency:
```javascript
const SLOT_HEIGHT = 16 // pixels per 15-minute slot
const SLOTS_PER_HOUR = 4
const START_HOUR = 6 // 6 AM
const END_HOUR = 20 // 8 PM
const TOTAL_HOURS = END_HOUR - START_HOUR
const TOTAL_SLOTS = TOTAL_HOURS * SLOTS_PER_HOUR
```
This ensures events will align correctly at the same pixel positions when rendered in Story 17, regardless of which grid view is active.

**Current Time Indicator Spanning Columns:** The current time line must be positioned outside the column loop to span all columns:
```jsx
{/* Current time indicator - positioned at grid level, spans all columns */}
{currentTimeOffset !== null && (
  <div className="absolute left-16 right-0 z-10" style={{ top: `${currentTimeOffset}px` }}>
    <div className="flex items-center">
      <div className="w-2 h-2 rounded-full bg-accent" />
      <div className="flex-1 h-0.5 bg-accent" />
    </div>
  </div>
)}
```
The `left-16` offset accounts for time labels, and `right-0` extends to the right edge, spanning all columns. The dot marker on the left provides a visual anchor point.

**Event Rendering Area Preparation:** Create placeholder divs for each column positioned absolutely within the grid to prepare for event rendering:
```jsx
<div className="absolute left-16 right-0 top-0 bottom-0 flex">
  {teamMembers.map((member, index) => (
    <div
      key={member.id}
      className="flex-1 relative px-1"
      style={{ borderLeft: index === 0 ? 'none' : '1px solid #2A2A2A' }}
    >
      {/* Events for this member will be rendered here in Story 17 */}
    </div>
  ))}
</div>
```
The `px-1` horizontal padding ensures events don't touch column borders. The `relative` positioning allows events to be positioned absolutely within each column.

**ESLint Unused Variable Pattern for Future Props:** When a prop is needed for future stories but currently unused, add an inline eslint-disable comment and a code comment explaining its future use:
```jsx
export default function DesktopTimeGrid({ selectedDate }) { // eslint-disable-line no-unused-vars
  // ...
  // selectedDate will be used in Story 17 to filter events by date
```
This passes linting while documenting the prop's intended future use, avoiding the need to add/remove props between stories.

### Story 17: Render Events on Desktop Grid (2026-02-02)
**Reusing EventCard Component Across Views:** The same EventCard component works seamlessly in both mobile (TimeGrid) and desktop (DesktopTimeGrid) contexts without modification. The card handles its own height calculation and styling based on event data. Using `disableInteraction={false}` and `disableResize={true}` for desktop prepares for future click handlers (Stories 19-20) while disabling mobile-specific resize functionality:
```jsx
// Desktop rendering
<EventCard
  event={event}
  disableInteraction={false}  // Enable clicks for future stories
  disableResize={true}        // Resize is mobile-only (Story 14)
/>
```
This pattern allows the same component to adapt to different interaction models per platform.

**Filtering Events Per Column:** Each team member column independently filters the events array in the render loop:
```jsx
const getEventsForMember = (memberId) => {
  return events.filter(
    (event) => event.assigneeId === memberId && event.date === formattedDate
  )
}

// In render
{teamMembers.map((member) => {
  const memberEvents = getEventsForMember(member.id)
  return (
    <div key={member.id} className="flex-1 relative">
      {memberEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
})}
```
This approach is performant for the current dataset size and keeps filtering logic simple. Each column gets its own filtered subset without needing complex memoization.

**Date Formatting for Filtering:** Convert Date objects to 'yyyy-MM-dd' format before filtering to match JSON schema:
```javascript
import { format } from 'date-fns'

const formattedDate = format(selectedDate, 'yyyy-MM-dd')
const memberEvents = events.filter(e => e.assigneeId === memberId && e.date === formattedDate)
```
This pattern is consistent across mobile TimeGrid and desktop DesktopTimeGrid.

**Vertical Event Positioning Reuse:** The `calculateEventOffset()` function uses the same slot-based math as mobile TimeGrid:
```javascript
const calculateEventOffset = (startTime) => {
  const [hours, minutes] = startTime.split(':').map(Number)
  const slotsFromStart = (hours - START_HOUR) * SLOTS_PER_HOUR + minutes / 15
  return slotsFromStart * SLOT_HEIGHT
}
```
This ensures pixel-perfect alignment across both mobile and desktop views. Events always render at the same vertical position relative to the time grid, regardless of view.

**Absolute Positioning Within Columns:** Events are positioned absolutely within each column's relative container:
```jsx
<div className="flex-1 relative px-1">
  {memberEvents.map((event) => {
    const topOffset = calculateEventOffset(event.startTime)
    return (
      <div
        key={event.id}
        className="absolute left-0 right-0"
        style={{ top: `${topOffset}px` }}
      >
        <EventCard event={event} />
      </div>
    )
  })}
</div>
```
The outer column container uses `flex-1` for even width distribution, while the inner event wrappers use absolute positioning for vertical placement. The `px-1` padding prevents events from touching column borders.

**PropTypes for Events Array:** Validate array of event objects with full shape definition:
```jsx
DesktopTimeGrid.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      assigneeId: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
      status: PropTypes.string,
    })
  ).isRequired,
}
```
This provides clear documentation and runtime validation of the expected data structure.

**Empty Columns Handle Gracefully:** When a team member has no events for the selected date, the column rendering naturally handles it:
```jsx
{memberEvents.map((event) => (...))}  // If memberEvents is [], nothing renders
```
No special empty state message needed at the column level - data-driven rendering handles this elegantly. Empty columns simply show grid lines without events.

**Column Layout Independence:** Each column's layout is independent - event positioning in one column doesn't affect others. This is achieved through:
1. Flexbox for horizontal column distribution (`flex-1` on each column)
2. Relative positioning on column container
3. Absolute positioning on events within the column
4. No shared state between columns (each filters independently)

This architecture makes it easy to add features like column-specific drag-drop zones in future stories.

### Story 18: Desktop Continuous Day Scroll with Sticky Headers (2026-02-02)
**Multi-Day Scroll Pattern with Sticky Headers:** The key to continuous day scrolling is rendering multiple day sections vertically, each with its own complete grid and a sticky header. Using `position: sticky` with appropriate `top` offsets creates a layered sticky effect:
```jsx
{/* Team headers: sticky at very top */}
<div className="sticky top-0 z-40 bg-charcoal">
  {/* Team member columns */}
</div>

{/* Day sections: each with sticky header */}
{daysToRender.map((dayDate) => (
  <div key={dateKey}>
    {/* Day header: sticky below team headers */}
    <div className="sticky top-14 z-30 bg-charcoal border-b-2 border-accent">
      <h2 className="font-heading text-xl uppercase">
        {format(dayDate, 'EEEE, MMMM d, yyyy')}
      </h2>
    </div>
    {/* Day grid: 6 AM - 8 PM */}
    <div className="relative" style={{ height: '896px' }}>
      {/* Time slots and events */}
    </div>
  </div>
))}
```
Team headers stay at the very top (top-0, z-40), day headers stick below them (top-14 to account for team header height, z-30). The `top-14` offset ensures day headers slide under the team headers when scrolling.

**IntersectionObserver for Scroll-to-Date Sync:** IntersectionObserver is perfect for detecting which day section is currently in view and updating the date picker accordingly:
```javascript
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries.find(
        (entry) => entry.isIntersecting && entry.intersectionRatio > 0.5
      )
      if (visibleEntry) {
        const dateStr = visibleEntry.target.dataset.date
        const newDate = new Date(dateStr)
        if (format(newDate, 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')) {
          onDateChange(newDate)
        }
      }
    },
    {
      root: scrollContainerRef.current,
      threshold: [0, 0.5, 1],
      rootMargin: '-10% 0px -80% 0px', // Trigger when header is near top
    }
  )

  Object.values(dayRefs.current).forEach((ref) => {
    if (ref) observer.observe(ref)
  })

  return () => observer.disconnect()
}, [selectedDate, onDateChange])
```
The `rootMargin: '-10% 0px -80% 0px'` configuration triggers when a day header enters the top 10% of the viewport, ensuring the date picker updates early during scroll rather than waiting for the entire header to be visible. The 50% intersection threshold prevents rapid toggling between days.

**Bidirectional Sync Pattern (Date Picker ↔ Scroll):** The date picker and scroll position are bidirectionally synced using two separate mechanisms:
1. **Date picker → scroll**: useEffect watches selectedDate and scrolls to the corresponding day
2. **Scroll → date picker**: IntersectionObserver detects visible day and updates selectedDate

```javascript
// Direction 1: Date picker changes → scroll to day
useEffect(() => {
  const dateKey = format(selectedDate, 'yyyy-MM-dd')
  const dayRef = dayRefs.current[dateKey]

  if (dayRef && scrollContainerRef.current) {
    dayRef.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}, [selectedDate])

// Direction 2: Scroll changes → update date picker (via IntersectionObserver above)
```
This creates seamless navigation whether the user clicks date picker arrows (triggers Direction 1) or manually scrolls (triggers Direction 2). The key is preventing infinite loops by checking if the date actually changed before calling onDateChange.

**scrollIntoView with Smooth Behavior:** Using `scrollIntoView({ behavior: 'smooth', block: 'start' })` provides smooth animated scrolling when navigating via date picker. The `block: 'start'` option ensures the day header aligns at the top of the scrollable container, not at some arbitrary position.

**useRef Pattern for Multiple DOM References:** Storing refs to multiple day headers in an object allows both the IntersectionObserver (to observe them) and the scroll effect (to scroll to them) to access the same DOM elements:
```jsx
const dayRefs = useRef({})

// In render:
<div
  ref={(el) => (dayRefs.current[dateKey] = el)}
  data-date={dateKey}
  className="sticky top-14 z-30"
>
```
This is cleaner than querying the DOM with `querySelector` because refs remain valid across re-renders and don't require complex CSS selectors. The `data-date` attribute allows the IntersectionObserver callback to identify which day header is visible.

**Z-Index Layering Strategy for Multi-Level Sticky:** Proper z-index layering is critical when multiple elements need to stick at different levels:
- z-40: Team member headers (highest priority, always visible at top)
- z-30: Day separator headers (second priority, stick below team headers)
- z-10: Current time indicator (above grid content but below headers)
- default (0): Events and grid lines (lowest priority)

Without proper z-index, day headers would appear above team headers during scroll, obscuring the team member names. The higher z-index on team headers ensures they always stay on top.

**Conditional Current Time Indicator by Day:** The current time indicator (orange line with dot) should only render on today's grid section, not on future days:
```jsx
const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey

{isToday && currentTimeOffset !== null && (
  <div className="absolute left-16 right-0 z-10" style={{ top: `${currentTimeOffset}px` }}>
    <div className="flex items-center">
      <div className="w-2 h-2 rounded-full bg-accent" />
      <div className="flex-1 h-0.5 bg-accent" />
    </div>
  </div>
)}
```
Showing the time indicator on future days would be confusing - the current time hasn't happened yet on those days. This check ensures the indicator only appears where it makes temporal sense.

**Generating Consecutive Dates with addDays:** The `addDays` function from date-fns makes it trivial to generate an array of consecutive dates:
```javascript
import { addDays } from 'date-fns'

const daysToRender = []
for (let i = 0; i < 6; i++) {
  daysToRender.push(addDays(selectedDate, i))
}
```
This generates 6 Date objects starting from selectedDate (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday). The loop pattern is clear and handles month/year boundaries automatically.

**Event Filtering Per Day Section:** Each day section independently filters events by both team member and date:
```javascript
const getEventsForMember = (memberId, date) => {
  const formattedDate = format(date, 'yyyy-MM-dd')
  return events.filter(
    (event) => event.assigneeId === memberId && event.date === formattedDate
  )
}

// In each day section's render:
{teamMembers.map((member) => {
  const memberEvents = getEventsForMember(member.id, dayDate)
  // Render memberEvents in this column
})}
```
This allows the same events array to be filtered and rendered correctly across multiple day sections. Each day/member combination gets its own filtered subset without complex state management or memoization.

**Performance Considerations:** Rendering 6 days × 6 team members × 14 hours = 504 grid sections is manageable with React's virtual DOM and efficient reconciliation. The IntersectionObserver efficiently handles scroll detection without performance issues. For production scenarios requiring more days (e.g., 2 weeks or a month), consider:
1. Virtual scrolling libraries (react-window, react-virtualized) to render only visible days
2. Memoizing day sections with React.memo to prevent unnecessary re-renders
3. Lazy loading events for future days only when they become visible

**Memory and Ref Cleanup:** When using IntersectionObserver and refs, always clean up in the useEffect return function:
```javascript
useEffect(() => {
  const observer = new IntersectionObserver(...)
  Object.values(dayRefs.current).forEach((ref) => {
    if (ref) observer.observe(ref)
  })
  return () => observer.disconnect() // Critical: cleanup on unmount
}, [selectedDate, onDateChange])
```
Failing to disconnect the observer can cause memory leaks and unexpected behavior if the component unmounts and remounts.
### Story 22: Desktop Drag-and-Drop Between Columns (2026-02-02)
**React Hooks Rules Violation:** React Hooks MUST be called at the component level, never inside loops, conditions, or callbacks. When ESLint reports "React Hook cannot be called inside a callback", it means a hook is being called in a `.map()`, `.forEach()`, conditional block, or other non-component context:
```jsx
// ❌ WRONG - Hook called inside .map() callback:
{teamMembers.map((member) => {
  const { setNodeRef } = useDroppable({ id: member.id }) // Violates Rules of Hooks
  return <div ref={setNodeRef}>...</div>
})}

// ✅ CORRECT - Extract component, use hook at component level:
function DroppableColumn({ memberId }) {
  const { setNodeRef } = useDroppable({ id: memberId })
  return <div ref={setNodeRef}>...</div>
}

{teamMembers.map((member) => (
  <DroppableColumn key={member.id} memberId={member.id} />
))}
```
The fix is always the same: extract a component that uses the hook, then map over your data to render multiple instances of that component.

**Component Extraction Pattern for Hooks in Lists:** When you need to use a hook for each item in a mapped list:
1. Create a new component that accepts the item data as props
2. Use the hook inside that component at the top level
3. Map over your list to render the component multiple times
4. Each component instance gets its own isolated hook call

This pattern applies to all hooks: `useState`, `useEffect`, `useDroppable`, `useDraggable`, custom hooks, etc.

**dnd-kit Droppable Zone Registration:** Each droppable zone requires:
- Unique `id` (typically `${itemId}-${contextId}` for multi-dimensional drops)
- Optional `data` payload accessible in drag handlers via `over.data.current`
```jsx
const { setNodeRef } = useDroppable({
  id: `${memberId}-${date}`,
  data: { memberId, date }, // Available in onDragEnd as event.over.data.current
})
```

The data payload enables intelligent drop handling — you can determine which column AND which day section received the drop.

**Cross-Column Drag Implementation:** For dragging between columns (reassignment):
1. Track hover state: `onDragMove` detects which droppable zone is active via `event.over.data.current`
2. Visual feedback: Apply highlight class to hovered column (`bg-accent/10` when `dragOverColumn === memberId`)
3. Ghost preview: Render dashed preview in target column showing where event will land
4. Conflict detection: In `onDragEnd`, check for conflicts against TARGET assignee's events, not source
5. Update event: Set new `assigneeId`, `date`, and `time` based on drop location
6. User feedback: Toast success message with target member's name

**Dual State Tracking for Reliability:** The implementation tracks which column is being hovered in two ways:
1. Component state (`dragOverColumn`, `dragOverDate`) updated in `onDragMove`
2. Direct check of `event.over.data.current` in `onDragEnd`

This dual approach provides a fallback if the `over` object becomes null or undefined during the drop event. The console logs show both values being checked: "over.data:", "prevDragOverColumn:".

**Conflict Detection for Cross-Column Drops:** When dragging between columns, the conflict check MUST compare against the target assignee's schedule:
```javascript
const hasConflict = (eventId, newStartTime, newEndTime, newDate, newAssigneeId) => {
  return events.some((existingEvent) => {
    if (existingEvent.id === eventId) return false
    if (existingEvent.date !== newDate || existingEvent.assigneeId !== newAssigneeId) {
      return false // Only check events for the TARGET assignee on the TARGET date
    }
    return eventsOverlap(newStartTime, newEndTime, existingEvent.startTime, existingEvent.endTime)
  })
}
```
Checking against the source assignee would allow invalid drops. Always filter by the target assignee ID when validating cross-column drops.

**Visual Feedback Coordination:** Multiple visual elements must coordinate to show drag state:
- Column highlight: `isColumnOver ? 'bg-accent/10' : ''` where `isColumnOver = dragOverColumn === memberId && dragOverDate === date`
- Ghost preview: Dashed border preview rendered only in the column where `isColumnOver === true`
- Dragged event opacity: `isDragging ? 'opacity-50' : 'opacity-100'` on source event
- Drag overlay: `<DragOverlay>` shows a floating copy of the event following the cursor

All these elements use the same `activeId`, `dragOverColumn`, and `isDragging` state to stay synchronized.

**Playwright Drag Testing Best Practices:**
- Use `page.locator().dragTo()` instead of manual mouse events for more reliable drag testing
- Add console listeners with `page.on('console', msg => ...)` to capture debug logs during drag
- Wait 1500-2000ms after drag completes to allow for animations and toast messages
- Take screenshots during drag (`await page.mouse.move()` then `await page.screenshot()`) to verify visual feedback
- Check column counts before and after to verify state updates correctly

**Event Handler Propagation in dnd-kit:** When wrapping draggable events with click handlers, ensure clicks don't trigger during drag:
```jsx
const handleClick = (e) => {
  if (!isDragging && e.detail === 1) { // Only single-click when not dragging
    onEventClick(event)
  }
}
```
The `e.detail === 1` check prevents double-click handling, and `!isDragging` prevents clicks during drag operations.

### Story 1-2: Font and Mock Data Updates (2026-02-03)
**Font Replacement:** Successfully replaced Bebas Neue with uppercase Open Sans throughout the application. All headings now use `font-body uppercase` styling instead of `font-heading`. The design system was updated in index.html, tailwind.config.js, and index.css. Visual hierarchy is maintained through size and weight rather than font family.

**Mock Data Extension:** Added two additional weeks of events (2026-02-06 through 2026-02-20) following the existing distribution patterns. Maintained ~60% open, ~25% closed-no-invoice, ~15% closed-invoiced status distribution. Tech schedules favor job types, sales schedules favor sales-stops, ops schedules favor meetings.

### Story 3: Change Default Event Duration to 15 Minutes (2026-02-03)
**Multiple Event Creation Entry Points:** Applications can have multiple paths to the same action. For SE Schedule, there are 4 distinct event creation paths:
1. FAB button on mobile → uses SchedulePage `handleEventTypeSelect` defaults
2. Long-press on mobile grid → TimeGrid calculates `endTime` from pointer position
3. Click on desktop grid → DesktopTimeGrid calculates `endTime` from click position
4. Modal defaults → CreateEventModal fallback when no defaults provided

When changing default behavior, audit ALL entry points. Missing even one creates inconsistent UX.

**Time Calculation with Minute Overflow:** When adding minutes to a time, handle overflow into the next hour correctly:
```javascript
// ❌ Wrong - creates invalid times like 10:60
const endHour = startHour + (startMin === 45 ? 1 : 0)
const endMin = startMin + 15

// ✅ Correct - handles overflow with modulo arithmetic
const endMinutes = startMin + 15
const endHour = startHour + Math.floor(endMinutes / 60)
const endMin = endMinutes % 60
```
Examples: 10:00 + 15 = 10:15, 10:45 + 15 = 11:00, 10:30 + 15 = 10:45. The modulo pattern works for any minute value.

**Testing Event Creation Flows:** Use dev-browser to verify all event creation paths programmatically:
- FAB: Click FAB → click event type → check modal time values
- Desktop click: Calculate grid click position → verify modal time values
- Mobile long-press: Dispatch pointer events with 500ms+ duration → check modal times

Browser automation catches edge cases that manual testing might miss (e.g., time calculations at hour boundaries).

### Story 23: Polish and Responsive Transitions (2026-02-02)
**Design System Consistency Audit:** A final polish pass ensures all components follow the same patterns. Key areas to audit:
- **Fonts:** Verify Bebas Neue used for all headings (h1-h6, .font-heading), Open Sans for all body text (.font-body, default)
- **Buttons:** Confirm all use rounded-full (pill shape), correct background colors (accent/secondary), and hover states (brightness-110/95)
- **Colors:** Check orange accent (#F47A20) consistently applied to active states, borders, primary buttons, highlights
- **Hover states:** Verify all interactive elements have hover:brightness-* transitions
- **Spacing:** Ensure consistent padding/margin patterns across similar components

Use grep to find all instances: `grep -r "font-heading\|font-body" src/` to audit font usage across codebase.

**Responsive Breakpoint Testing Strategy:** Test at exact breakpoint values and common device widths to catch edge cases:
- **375px (mobile):** Standard mobile width, tests mobile-only components (FAB, week strip, bottom sheets)
- **768px (breakpoint):** md breakpoint where layout switches from mobile to desktop
- **1280px (desktop):** Standard desktop width, tests multi-column layout with full content visibility

Testing AT the breakpoint (768px) is critical - off-by-one errors in Tailwind classes (md:block vs md:hidden) cause layout issues exactly at the transition point.

**Browser Automation for Visual QA:** Using dev-browser with configured viewports enables systematic visual regression testing:
```javascript
const page = await client.page("mobile", { viewport: { width: 375, height: 812 } });
await page.goto("http://localhost:5174");
await page.waitForTimeout(2000); // Let content render
await page.screenshot({ path: "tmp/mobile-375px.png", fullPage: true });
```

Taking fullPage screenshots captures scroll behavior and ensures nothing is cut off. Save screenshots with descriptive names (viewport width in filename) for easy comparison during code review.

**Toaster Styling for Custom Design Systems:** react-hot-toast requires explicit styling via `toastOptions` to match custom design systems:
```jsx
<Toaster
  position="top-center"
  toastOptions={{
    duration: 3000,
    style: {
      background: '#2A2A2A',      // Secondary dark background
      color: '#FFFFFF',            // White text
      border: '1px solid #F47A20', // Orange accent border
    },
  }}
/>
```

Place the `<Toaster>` component at the root level of the page that triggers toasts (e.g., TimeGrid for mobile, DesktopTimeGrid for desktop). Each Toaster instance manages its own toast queue independently.

**Hover State Brightness Pattern:** Consistent use of Tailwind brightness utilities creates predictable interactive feedback:
- `hover:brightness-110` for dark backgrounds (accent buttons, secondary buttons) - makes them lighter
- `hover:brightness-95` for light backgrounds (white cards, white buttons) - makes them slightly darker
- Never change colors on hover (no bg-accent to bg-orange transition) - only brightness

This pattern maintains color consistency while providing clear visual feedback. The `transition-all` class smooths the brightness change for polish.

**Responsive Component Visibility Pattern:** Use Tailwind responsive prefixes consistently:
- Mobile-only: `md:hidden` (visible below 768px, hidden at/above)
- Desktop-only: `hidden md:block` (hidden below 768px, visible at/above)
- Both: No responsive prefix

Never use negative logic like `max-md:block` - positive prefixes (md:, lg:) are clearer and more maintainable. The pattern "default mobile, add desktop" is more intuitive than "default desktop, override mobile".

**Typography Scale Hierarchy:** Maintain clear type hierarchy using size and weight, not color:
- Headings: font-heading class + text-2xl/3xl/4xl + uppercase
- Body text: font-body class + text-sm/base
- Labels: font-body + text-xs/sm + font-semibold
- Muted text: font-body + text-muted color

Avoid using color to establish hierarchy (e.g., blue headings, gray body) in dark chrome designs - size and weight are more effective.

**Pill Button Implementation Checklist:**
```jsx
// ✅ Primary Button (Orange):
className="px-6 py-3 bg-accent text-white rounded-full font-body font-semibold text-sm hover:brightness-110 transition-all"

// ✅ Secondary Button (Dark):
className="px-6 py-3 bg-secondary text-text-light rounded-full font-body font-semibold text-sm hover:brightness-110 transition-all"

// ✅ Text Button (No background):
className="px-6 py-3 text-accent font-body font-semibold text-sm hover:brightness-110 transition-all"
```

All buttons should include: rounded-full, font-body, font-semibold, hover:brightness-*, transition-all. Consistent padding (px-6 py-3) ensures buttons have similar hit targets.

**Verifying Design System Compliance:** Before marking polish story complete, verify:
1. Run `npm run lint` (should pass with 0 errors)
2. Run `npm run build` (should succeed without warnings)
3. Browser test at 375px, 768px, 1280px viewports
4. Check fonts in browser DevTools (Elements → Computed → font-family)
5. Inspect hover states on all interactive elements
6. Verify no console errors during normal usage
7. Test all modals, dropdowns, and overlays for consistent styling

**Screenshot-Based Code Review:** Save viewport screenshots in a consistent location (e.g., `docs/screenshots/`) with naming convention like `{feature}-{viewport}px.png`. These serve as:
- Visual regression test baseline
- Design review artifacts
- Documentation for future developers
- QA verification reference

Include screenshots in PRs to show exact visual output at different breakpoints without requiring reviewers to run the code locally.

### Story 4: Fix Short Event Card Display (2026-02-03)
**Multi-Threshold Layout Pattern:** When a component needs to display differently based on continuous values (like duration), use multiple thresholds for clear visual hierarchy:
```javascript
const isTinyEvent = durationMinutes === 15      // Title only
const isShortEvent = durationMinutes < 45       // Title + time
// else: 45+ minutes                            // Title + time + type
```
This creates distinct layouts at meaningful boundaries. Using `===` for the smallest case (15 min) ensures it gets the most minimal treatment, while `<` for mid-range cases captures everything below the threshold.

**Inline Styles for Exact Sizing:** When design specs require exact pixel values that don't align with Tailwind's spacing scale, use inline styles:
```jsx
// ❌ Tailwind w-2 h-2 = 8px (not precise enough)
<div className="w-2 h-2 rounded-full" />

// ✅ Inline style for exact 10px spec
<div className="rounded-full" style={{ width: '10px', height: '10px' }} />
```
This is especially important when implementing design system specs that call out exact measurements (e.g., "10px diameter status dot").

**Test Data for Boundary Conditions:** When verifying layout changes, ensure test data includes edge cases at critical thresholds. For event cards with duration-based layouts:
- 15-minute events (minimum duration)
- 30-minute events (mid-range short)
- 45-minute events (threshold between short and full layout)
- 60+ minute events (full layout)

Without test data at these boundaries, you can't verify the conditional logic works correctly. Add temporary test events to the JSON data during development.

**Browser Automation for Style Verification:** Use dev-browser to programmatically verify CSS properties that are hard to check manually:
```javascript
const borderLeft = card.style.borderLeft  // "6px solid rgb(37, 99, 235)"
const dotWidth = statusDot.style.width    // "10px"
const textLineCount = visibleLines.length // 1, 2, or 3
```
This provides concrete evidence that acceptance criteria are met and catches subtle issues like "border is 5.5px instead of 6px" that visual inspection might miss.

**Nested Conditional Rendering:** Use ternary operators for multi-way conditional rendering when layouts have clear precedence:
```jsx
{isTinyEvent ? (
  // Most specific case first
  <TitleOnly />
) : isShortEvent ? (
  // Mid-range case
  <TitleAndTime />
) : (
  // Default/fallback case
  <FullLayout />
)}
```
Order from most specific to most general. The first condition (`isTinyEvent`) is the most restrictive (exactly 15 min), the second is broader (< 45 min), and the else is the catch-all (everything else).

### Story 7: Fix Mobile Scroll vs Tap Interaction Conflict (2026-02-03)
**touch-none Blocks All Touch Behaviors:** The Tailwind `touch-none` class sets `touch-action: none`, which disables ALL browser-managed touch interactions including scroll, pinch-zoom, and pan gestures. This was blocking mobile scroll in the calendar grid.

**Solution:** Remove `touch-none` from the event rendering area. The pointer event handlers (`onPointerDown/Up/Leave`) do NOT inherently block scrolling when `touch-action` is set to `auto` (the default).

**Long-Press Compatible with Scroll:** The long-press pattern using setTimeout works correctly alongside native scroll:
```javascript
handlePointerDown → start 500ms timer
handlePointerUp → cancel timer (quick tap)
handlePointerLeave → cancel timer (finger moves during scroll)
```

When scrolling, the finger movement triggers `pointerleave`, canceling the timer. Only a stationary 500ms hold triggers the long-press callback.

**Touch Action Values:**
- `auto` (default): Browser handles scroll, zoom, pan; app receives pointer events
- `none`: Disables all touch behaviors; app must handle everything
- `pan-y`: Allows vertical scroll only
- `pan-x`: Allows horizontal scroll only

For calendar grids that need both scroll AND custom interactions (long-press, drag), use `touch-action: auto` and let the browser manage scroll natively.

**Testing Touch Interactions:** Automated browser testing (Playwright) has limitations for touch:
- Programmatic CSS checks are reliable (`touchAction: 'auto'`)
- Simulating long-press with timers is difficult
- Manual device testing confirms UX for touch-specific behaviors

Verify fixes by checking computed styles (`window.getComputedStyle`) and testing programmatic scroll (`element.scrollTop = value`).

### Story 8: Fix Person Switcher Ordering and Highlight (2026-02-03)
**Current User vs Selected Member Pattern:** In team collaboration apps, distinguish between:
- **Current User:** The logged-in user (identity anchor)
- **Selected Member:** The person whose data is currently being viewed

The UI should maintain both concepts simultaneously:
```javascript
const CURRENT_USER_ID = 'tm-1' // Mike Torres
const currentUser = allMembers.find(m => m.id === CURRENT_USER_ID)

// FAB always shows current user
<button style={{ backgroundColor: currentUser.color }}>
  {currentUser.avatar}
</button>

// List shows selection indicator on viewed member
{sortedMembers.map(member => {
  const isSelected = member.id === selectedMember.id
  return (
    <button className={isSelected ? 'ring-2 ring-accent' : ''}>
      {member.name}
      {isSelected && <div className="bg-accent" />}
    </button>
  )
})}
```

**Sorting with Fixed Item Positioning:** When one item must always appear in a specific position (e.g., current user at bottom), use special-case logic before applying general sorting:
```javascript
const sortedMembers = [...allMembers].sort((a, b) => {
  // Special case: Mike Torres always to bottom
  if (a.id === CURRENT_USER_ID) return 1
  if (b.id === CURRENT_USER_ID) return -1
  // General case: alphabetize others
  return a.name.localeCompare(b.name)
})
```

Result: `[David, James, Jennifer, Rachel, Sarah, Mike]` - Mike always at end, others alphabetical.

**localeCompare for Alphabetical Sorting:** Use `string.localeCompare()` instead of manual comparison:
```javascript
// ✅ Correct: handles accents, case, locale rules
return a.name.localeCompare(b.name)

// ❌ Avoid: breaks with special characters
return a.name < b.name ? -1 : 1
```

`localeCompare()` correctly sorts names like "José" vs "John" and respects locale-specific alphabetization rules.

**FAB as Identity Anchor:** The FAB (Floating Action Button) represents the current user's identity in mobile UIs. Even when viewing other members' data, the FAB shows the logged-in user's avatar/color. This provides a persistent visual anchor for "whose account am I using?"

**Dual Indicators When Current User is Selected:** When Mike Torres (current user) is also the selected member (viewing his own schedule), BOTH indicators appear:
- Blue FAB button (current user identity)
- Orange ring + dot on list item (selection state)

This is expected behavior - the dual indication shows "I am viewing my own schedule."


### Story 10: Replace Time Dropdowns with Time Picker Component (2026-02-03)
**TimePicker Component Pattern:** Created a reusable time picker following the same architecture as CustomDropdown:
- Self-contained component with internal time option generation
- Dark theme styling matching design system (#2A2A2A, orange accents)
- Clock icon for semantic clarity (distinguishes from regular dropdowns)
- Scrollable list with auto-scroll to selected time
- Touch-friendly design with large tap targets (py-3 = 48px+ height)

**Auto-Scroll to Selected Option:**
```javascript
const selectedRef = useRef(null)

useEffect(() => {
  if (isOpen && selectedRef.current) {
    selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}, [isOpen])

// Attach ref only to selected item:
<li ref={isSelected ? selectedRef : null}>
```
This pattern improves UX for long scrollable lists by ensuring the current selection is visible when opening.

**Eliminating Code Duplication:** Moving `generateTimeOptions()` from both modals into TimePicker component:
- Removes ~30 lines of duplicate code from each modal
- Ensures consistency in time options across the app
- Single source of truth for time range and increment configuration
- Makes modals simpler and more focused on their specific concerns

**12-Hour Time Format Conversion:** Proper handling of edge cases when converting 24-hour to 12-hour:
```javascript
const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
const period = hour >= 12 ? 'PM' : 'AM'
```
Key cases: 0 → 12 AM, 12 → 12 PM, 13 → 1 PM, 23 → 11 PM.

**Touch Target Sizing for Mobile:** Using `py-3` (12px vertical padding) creates ~48px touch targets, meeting accessibility guidelines for mobile interaction. This is more important for time pickers than regular dropdowns because:
1. Users scroll through many options
2. Selecting the wrong time has direct consequences
3. Mobile users expect generous spacing for precise selection

**Icon Choice for Context:** Clock icon instead of down arrow provides semantic clarity. The icon choice signals "this is a time selection" rather than "this is a generic dropdown", helping users understand the control's purpose at a glance.

### Story 11: Desktop Sticky Headers (2026-02-03)
**Nested Sticky Context Pattern:** CSS `position: sticky` behaves differently depending on the scroll container:
- Elements sticky within the viewport (page scroll) vs elements sticky within a scrollable div
- DesktopDatePicker: `sticky top-0` as direct child of SchedulePage → sticks to viewport during window.scroll
- Column Headers: `sticky top-0` inside DesktopTimeGrid (which has `overflow-y: auto`) → sticks within that container
- Result: Date picker always visible at top, column headers stick within their grid container

**Z-Index Layering Across Contexts:** Even though sticky elements are in different scroll contexts, z-index determines visual stacking order:
```jsx
// Page-level sticky (viewport)
<DesktopDatePicker className="sticky top-0 z-50" />

// Container-level sticky (grid scroll)
<DesktopTimeGrid className="overflow-y-auto">
  <ColumnHeaders className="sticky top-0 z-40" />
  <DaySeparator className="sticky top-14 z-30" />
</DesktopTimeGrid>
```
Layering: z-50 > z-40 > z-30 ensures proper visual hierarchy during scroll.

**Sticky Top Offset Calculation:** When multiple sticky elements stack, use `top` offset to position them:
- Column headers: `top-0` (0px) → stick at top of container
- Day separators: `top-14` (56px = 3.5rem) → stick below column headers
- The offset should match or exceed the height of elements above to prevent overlap

**One-Line Fix Principle:** Sometimes a story's description implies more work than needed. Story-11 mentioned "make date picker AND column headers sticky" but the column headers were already sticky within their context. Only the date picker needed the change. Always verify existing implementation before making changes.

### Story 12: Date Picker Scroll-to-Day (2026-02-03)
**Expanded Day Window for scrollIntoView:** When implementing scroll-to-section functionality, ensure enough content exists in the DOM for scrollIntoView to work. The original implementation rendered only 6 days (selectedDate + 5), which prevented scrolling because:
- Clicking "next" changed selectedDate from Feb 3 → Feb 4
- The grid re-rendered showing Feb 4-9 (new range)
- Feb 4 was now at position 0 (top of grid)
- scrollIntoView had nowhere to scroll TO

Solution: Render 21 days centered on selectedDate (-10 to +10). This creates a "window" where the target day already exists in the DOM before the click, allowing smooth scroll to occur.

**scrollIntoView Prerequisites:**
1. Target element MUST exist in DOM before calling
2. Target element MUST be in a different scroll position than current
3. Scroll container must have overflow and sufficient content

**Bidirectional Date-Scroll Sync:** Two-way synchronization pattern:
```javascript
// Direction 1: Date Change → Scroll
useEffect(() => {
  dayRefs.current[dateKey]?.scrollIntoView({ behavior: 'smooth' })
}, [selectedDate])

// Direction 2: Scroll → Date Change
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    const visibleEntry = entries.find(e => e.isIntersecting)
    if (visibleEntry) onDateChange(new Date(visibleEntry.target.dataset.date))
  })
  // ... observe day headers
}, [selectedDate])
```

This creates synchronized behavior: clicking arrows scrolls the grid, manual scrolling updates the date picker.

### Story 13: Horizontal Scroll with Fixed Column (2026-02-03)
**Horizontal Scroll with Fixed Columns Pattern:** The key architectural difference from vertical scroll:
- **Vertical sticky**: Use `position: sticky` - elements stay in DOM flow, CSS handles positioning
- **Horizontal fixed**: Separate DOM structure - fixed column outside scroll container

Structure for horizontal scroll with fixed left column:
```jsx
<div className="flex">
  <div className="w-16 flex-shrink-0">Fixed column (time labels)</div>
  <div className="flex-1 overflow-x-auto">
    <div style={{ minWidth: 'calculated-width' }}>
      Scrollable content
    </div>
  </div>
</div>
```

The fixed column is a SIBLING to the scroll container, not a child with `position: sticky`.

**Bidirectional Scroll Synchronization Pattern:**
When two containers need synchronized horizontal scroll (headers and grid):
```javascript
useEffect(() => {
  const sync = (source, target) => {
    // CRITICAL: Check before setting to prevent infinite loop
    if (target.scrollLeft !== source.scrollLeft) {
      target.scrollLeft = source.scrollLeft
    }
  }

  headerRef.current.addEventListener('scroll', () => sync(headerRef.current, gridRef.current))
  gridRef.current.addEventListener('scroll', () => sync(gridRef.current, headerRef.current))

  return () => {
    // Cleanup listeners
  }
}, [])
```

The conditional `if (target.scrollLeft !== source.scrollLeft)` is CRITICAL. Without it, setting `scrollLeft` triggers another scroll event, creating an infinite loop that freezes the browser.

**flex-shrink-0 for Minimum Width Enforcement:**
In flexbox with `overflow-x-auto`, child elements will shrink by default even with `minWidth`. You MUST add `flex-shrink-0`:
```jsx
<div style={{ minWidth: '150px' }} className="flex-shrink-0">
  Column content
</div>
```

Without `flex-shrink-0`, the browser ignores minWidth and shrinks columns to fit the viewport, preventing horizontal scroll from ever appearing.

**scrollbar-hide Utility:**
Hide scrollbars while maintaining scroll functionality for cleaner UI:
```css
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;      /* Firefox */
}
```

Apply to both scroll containers for consistent appearance.

**Restructuring for Scroll Requirements:** The original DesktopTimeGrid used absolute positioning:
```jsx
// Original (vertical scroll only)
<div className="relative">
  <div className="absolute left-0 w-16">Time labels</div>
  <div className="ml-16">Grid content</div>
</div>
```

This doesn't work for horizontal scroll because `ml-16` (margin-left) scrolls with the parent.

Restructured for horizontal scroll:
```jsx
// New (horizontal + vertical scroll)
<div className="flex">
  <div className="w-16 flex-shrink-0">Time labels</div>
  <div className="flex-1 overflow-x-auto">
    <div className="flex" style={{ minWidth: 'total-width' }}>
      {columns.map(col => <div style={{ minWidth: '150px' }} />)}
    </div>
  </div>
</div>
```

**Minimum Width Calculation for Scroll Trigger:**
Calculate total width to determine when scroll appears:
- 6 team members × 150px min-width = 900px
- + 64px fixed time labels = 964px total
- Viewports < 964px → horizontal scroll appears
- Viewports >= 964px → columns stretch to fill available space

The grid gracefully adapts: narrow viewports get scroll, wide viewports get expanded columns.

**Event Positioning in Scrollable Grid:** Events positioned absolutely within their parent columns scroll WITH the grid because they're inside the scroll container. The absolute positioning is relative to the column, not the viewport, so horizontal scroll maintains correct alignment.

