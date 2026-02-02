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
