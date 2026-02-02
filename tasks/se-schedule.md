# PRD: SE Schedule

## Overview
A schedule management prototype for Surface Experts, a surface repair company. The app displays tech and sales team schedules in a mobile-first day view (single person) and a desktop multi-column view (all team members). Built with mock JSON data, the app supports event creation, drag-and-drop rescheduling, conflict detection, and role-based event type distribution. The design follows a dark chrome, orange accent, industrial aesthetic.

## Tech Stack
- **Frontend:** React with Vite
- **Deployment:** Vercel
- **Data Layer:** Mock/Local Data (JSON files in src/data/)
- **Key Libraries:** react-router-dom, date-fns, @dnd-kit/core, @dnd-kit/sortable, react-hot-toast

## Data Architecture

### Mock/Local Data
- Location: `src/data/*.json`
- Access: Centralized through `src/utils/dataAccess.js`
- Team members, events, and event types all defined in JSON
- All components pull from the same shared data source
- State managed in React with useState/useReducer for runtime mutations

### Data Schemas

#### Team Members (`src/data/teamMembers.json`)
```json
[
  {
    "id": "tm-1",
    "name": "Mike Torres",
    "role": "tech",
    "avatar": "MT",
    "color": "#3B82F6"
  }
]
```
Fields: id, name, role (tech|sales|ops), avatar (initials), color

#### Events (`src/data/events.json`)
```json
[
  {
    "id": "evt-1",
    "title": "Oakwood Apartments - Unit 12B",
    "type": "job-occupied",
    "assigneeId": "tm-1",
    "date": "2025-02-03",
    "startTime": "08:00",
    "endTime": "09:30",
    "status": "open"
  }
]
```
Fields: id, title, type (event type key), assigneeId (FK to team member), date (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM), status (open|closed-no-invoice|closed-invoiced)

#### Event Types (`src/data/eventTypes.json`)
```json
[
  {
    "key": "job-occupied",
    "label": "Job (Occupied)",
    "color": "#3B82F6",
    "borderColor": "#2563EB"
  }
]
```
Event types with colors:
- `job-occupied`: Blue (#3B82F6)
- `job-vacant`: Teal (#14B8A6)
- `callback-job`: Amber (#F59E0B)
- `sales-stop`: Purple (#8B5CF6)
- `meeting`: Slate (#64748B)
- `time-off`: Rose (#F43F5E)

#### Mock Data Distribution
- 5–6 team members: 3 techs, 2 sales, 1 ops
- 25–30 events across current week
- Tech schedules: mostly job-occupied and job-vacant, a few callback-jobs and meetings
- Sales schedules: mostly sales-stops, a few meetings
- Mix of statuses on job events: mostly open, some closed-no-invoice, some closed-invoiced

## Design System

### Colors
- Main background: `#1A1A1A` (near-black charcoal)
- Brand accent: `#F47A20` (orange)
- Content cards: `#FFFFFF` with `1px solid #F47A20` border, `border-radius: 8px`
- Secondary button fill: `#2A2A2A`
- Text on dark: `#FFFFFF`
- Text on light: `#1A1A1A`
- Muted text: `#9CA3AF`

### Typography
- Headings: Bebas Neue (Google Fonts), bold, uppercase
- Body/labels: Open Sans (Google Fonts), weight 400
- Hierarchy via size and weight only, no color variation

### Components
- Buttons: rounded pill (`border-radius: 9999px`), orange fill + white text (primary), dark fill + white text (secondary)
- Hover/active: slight brightness shift, no color changes
- No gradients, no shadows, minimal decoration

### Job Status Indicators
- No indicator: open (not closed)
- Yellow dot (`#EAB308`): closed, no invoice sent
- Purple dot (`#8B5CF6`): closed, invoice sent

## Calendar Configuration
- Time range: 6:00 AM – 8:00 PM
- Minimum event duration: 15 minutes
- Time increments: 15 minutes
- Each hour = 4 slots

## Development Commands
- Dev: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`

## User Stories

### Story 1: Project Scaffolding and Configuration
**Description:** Initialize React + Vite project with Tailwind CSS, Google Fonts (Bebas Neue, Open Sans), ESLint, and folder structure. Configure base styles matching the dark chrome design system.

**Priority:** high

**Acceptance Criteria:**
- Vite project created with React template
- Tailwind CSS installed and configured with custom colors (charcoal: #1A1A1A, accent: #F47A20, etc.)
- Google Fonts loaded: Bebas Neue for headings, Open Sans for body
- ESLint configured with React rules
- Folder structure: src/components/, src/data/, src/utils/, src/hooks/, src/layouts/
- index.css sets dark background (#1A1A1A) and default font (Open Sans)
- App.jsx renders a placeholder with correct fonts and colors visible
- npm run dev starts without errors
- npm run lint passes

**Tests (must pass before complete):**
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts dev server successfully
- [ ] `npm run lint` passes
- [ ] App loads in browser showing dark background and correct fonts
- [ ] Verify in browser using dev-browser skill

**Technical Notes:**
- Files: vite.config.js, tailwind.config.js, src/index.css, src/App.jsx
- Add fonts via `<link>` in index.html, not @import
- Tailwind config should extend theme with project colors

### Story 2: Mock Data Files and Data Access Layer
**Description:** Create all JSON mock data files (team members, events, event types) and a centralized data access utility. All components will import from this single access layer.

**Priority:** high

**Acceptance Criteria:**
- src/data/teamMembers.json with 5–6 team members (3 techs, 2 sales, 1 ops)
- src/data/events.json with 25–30 events across the current week following role-based distribution
- src/data/eventTypes.json with all 6 event types and their colors
- src/utils/dataAccess.js exports: getAllMembers(), getMemberById(id), getEventsForMember(memberId, date), getEventsForDate(date), getEventTypes(), getEventTypeByKey(key)
- Events use realistic titles (apartment names, unit numbers for jobs; company names for sales stops)
- Mix of job statuses: ~60% open, ~25% closed-no-invoice, ~15% closed-invoiced
- src/data/README.md documenting all schemas

**Tests (must pass before complete):**
- [ ] All JSON files parse without errors
- [ ] dataAccess.js functions return correct data types
- [ ] getEventsForMember filters correctly by member ID and date
- [ ] Verify in browser: import and console.log data from App.jsx

**Technical Notes:**
- Files: src/data/teamMembers.json, src/data/events.json, src/data/eventTypes.json, src/utils/dataAccess.js, src/data/README.md
- Use current week dates (dynamically calculated or hardcoded to week of 2025-02-03)
- dataAccess.js should be the ONLY import point for data — components never import JSON directly

### Story 3: App Layout Shell and Routing
**Description:** Create the responsive app shell with mobile top bar and desktop sidebar. Set up React Router with a main schedule route.

**Priority:** high

**Acceptance Criteria:**
- React Router configured with / route for schedule view
- Desktop sidebar: fixed left, dark background (#1A1A1A), logo placeholder at top, nav links in middle, user avatar/name at bottom, search bar with dark fill and rounded shape
- Mobile top bar: dark background, hamburger icon on right, logo on left, current month/year in center (e.g., "February 2025")
- Hamburger menu opens a slide-out drawer with same nav as desktop sidebar
- Responsive breakpoint: sidebar shows at md (768px+), top bar shows below md
- Active nav item highlighted with orange accent
- Sidebar and top bar use Bebas Neue for headings, Open Sans for labels

**Tests (must pass before complete):**
- [ ] Desktop shows sidebar, mobile shows top bar
- [ ] Hamburger menu opens and closes drawer
- [ ] Active nav link is highlighted orange
- [ ] Verify in browser using dev-browser skill at both mobile and desktop widths

**Technical Notes:**
- Files: src/layouts/AppLayout.jsx, src/layouts/Sidebar.jsx, src/layouts/MobileTopBar.jsx, src/layouts/HamburgerDrawer.jsx
- Use Tailwind responsive classes (hidden md:block, etc.)
- Default user shown in sidebar: first team member from mock data

### Story 4: Mobile Week Strip Navigation
**Description:** Build the week strip component that shows 7 day squares for the current week with navigation arrows to cycle between weeks. Current day selected by default.

**Priority:** high

**Acceptance Criteria:**
- Seven squares in a row, each showing abbreviated day name (Mon, Tue, etc.) on top and numeric date on bottom
- Left and right arrows on either side to navigate to previous/next week
- Current day selected by default with orange background and white text
- Tapping a day selects it (orange background) and deselects the previous one
- Selected date is passed up to parent via callback
- Component is mobile-only (hidden on desktop)
- Uses date-fns for date calculations

**Tests (must pass before complete):**
- [ ] Week strip renders 7 days with correct day names and dates
- [ ] Arrows navigate to previous/next week
- [ ] Current day is selected by default
- [ ] Tapping a day changes selection
- [ ] Verify in browser using dev-browser skill at mobile width

**Technical Notes:**
- Files: src/components/schedule/WeekStrip.jsx
- Install date-fns: `npm install date-fns`
- Week starts on Monday
- Use startOfWeek, addDays, format from date-fns

### Story 5: Mobile Day Agenda Calendar Grid
**Description:** Build the day agenda view for mobile that displays time slots from 6 AM to 8 PM with 15-minute increments. This is the empty grid only — no events rendered yet.

**Priority:** high

**Acceptance Criteria:**
- Vertical time grid from 6:00 AM to 8:00 PM
- Hour labels on the left side (6 AM, 7 AM, ... 8 PM)
- 15-minute grid lines (lighter lines for quarter hours, heavier for hours)
- Grid takes up remaining screen height below the week strip
- Grid is scrollable vertically
- Current time indicator: a horizontal orange line showing the current time (if within visible range)
- Grid cell height is consistent and proportional (each 15-min slot = same height)

**Tests (must pass before complete):**
- [ ] Time grid renders from 6 AM to 8 PM
- [ ] Hour labels display correctly on the left
- [ ] Grid is scrollable
- [ ] Current time indicator shows at correct position
- [ ] Verify in browser using dev-browser skill at mobile width

**Technical Notes:**
- Files: src/components/schedule/TimeGrid.jsx
- Slot height recommendation: 16px per 15 minutes (64px per hour) — adjust for readability
- Current time line should auto-update every minute

### Story 6: Event Card Component
**Description:** Create the event card component that displays within time grid slots. Cards are colored by event type and show status indicators for jobs.

**Priority:** high

**Acceptance Criteria:**
- Card renders with white background, colored left border (4px, color from event type)
- Card height is proportional to event duration (15 min = 1 slot height)
- Card shows: event title, start–end time, event type label
- Job-type events (job-occupied, job-vacant, callback-job) show status indicator dot in top-right corner
- Status indicators: no dot for open, yellow dot (#EAB308) for closed-no-invoice, purple dot (#8B5CF6) for closed-invoiced
- Card text truncates with ellipsis if card is too small
- Cards for events shorter than 30 minutes show condensed layout (title only)
- Card has slight rounded corners (border-radius: 6px)

**Tests (must pass before complete):**
- [ ] Card renders with correct event type color border
- [ ] Status indicator dots display correctly for each status
- [ ] Card height scales with event duration
- [ ] Short events (<30 min) show condensed layout
- [ ] Verify in browser using dev-browser skill

**Technical Notes:**
- Files: src/components/schedule/EventCard.jsx
- Pull event type colors from dataAccess.getEventTypeByKey()
- Card should accept: event object, slotHeight (px per 15 min), onClick handler

### Story 7: Render Events on Mobile Calendar
**Description:** Integrate event cards into the mobile day agenda grid. Events for the selected person and selected date render as positioned blocks on the time grid.

**Priority:** high

**Acceptance Criteria:**
- Events render at correct vertical position based on start time
- Events span correct height based on duration
- Events are positioned in the right column area (to the right of time labels)
- Multiple non-overlapping events render without issues
- Changing the selected date (from week strip) updates displayed events
- Default view shows current user's events for today
- Empty state: helpful message when no events exist for selected day/person

**Tests (must pass before complete):**
- [ ] Events appear at correct time positions
- [ ] Event card heights match their durations
- [ ] Changing day in week strip updates the event list
- [ ] Empty state message appears when no events for the day
- [ ] Verify in browser using dev-browser skill at mobile width

**Technical Notes:**
- Files: src/components/schedule/MobileDayView.jsx
- Calculate top offset: (startHour - 6) * hourHeight + (startMinutes / 15) * slotHeight
- Import events via getEventsForMember(currentUserId, selectedDate)

### Story 8: Mobile FAB — Create Event Actions
**Description:** Build the floating action button (bottom-right) that expands to show event creation options, following the Google Calendar FAB pattern.

**Priority:** high

**Acceptance Criteria:**
- Orange circular FAB (56px) in bottom-right corner with a plus icon
- Pressing FAB: fades/dims the background, reveals action options above the FAB
- Action options: one button per event type (Job Occupied, Job Vacant, Callback, Sales Stop, Meeting, Time Off)
- Each action button shows event type icon/label with its color
- Pressing an action opens the create event modal (Story 10) with that type pre-selected
- Pressing the dimmed background or an X button closes the FAB menu
- FAB has subtle scale animation on open/close

**Tests (must pass before complete):**
- [ ] FAB renders in bottom-right corner
- [ ] Pressing FAB shows overlay and action buttons
- [ ] Each event type has a labeled action button
- [ ] Pressing backdrop closes the menu
- [ ] Verify in browser using dev-browser skill at mobile width

**Technical Notes:**
- Files: src/components/schedule/FloatingActionButton.jsx
- Use CSS transitions/animations for fade and scale effects
- z-index layering: FAB menu above calendar, backdrop between

### Story 9: Mobile FAB — Team Member Switcher
**Description:** Build the bottom-left floating action button that shows a list of team members to switch whose schedule is displayed. Current user always appears at the bottom.

**Priority:** high

**Acceptance Criteria:**
- Circular button (48px) in bottom-left corner showing current user's initials/avatar
- Pressing button: shows a vertical list of team members above the button
- Each team member option shows avatar/initials and name
- Current user always appears at the bottom of the list (in the position of the original button)
- Selecting a team member switches the calendar to show that person's schedule
- Currently selected member is highlighted with orange accent
- Pressing backdrop closes the member list

**Tests (must pass before complete):**
- [ ] Member switcher button renders in bottom-left with current user's initials
- [ ] Pressing button shows team member list
- [ ] Selecting a member switches the displayed schedule
- [ ] Current user is always at the bottom of the list
- [ ] Verify in browser using dev-browser skill at mobile width

**Technical Notes:**
- Files: src/components/schedule/TeamMemberSwitcher.jsx
- Pull team members from getAllMembers()
- Lift selected member state to parent (MobileDayView or schedule page)

### Story 10: Create Event Modal — Mobile
**Description:** Build the bottom-sheet modal for creating new events on mobile. Slides up from the bottom of the screen.

**Priority:** high

**Acceptance Criteria:**
- Modal slides up from bottom with a drag handle at top
- Fields: Event Type (dropdown), Person (dropdown, defaults to current viewed person), Date (date picker, defaults to selected date), Start Time (time picker, 15-min increments), End Time (time picker, 15-min increments), Title (text input)
- Event Type dropdown shows colored indicators next to each option
- Time pickers only allow 15-minute increments (6:00, 6:15, 6:30, 6:45, etc.)
- Time range: 6:00 AM to 8:00 PM
- End time must be after start time — show inline validation error if not
- Save button (orange pill) and Cancel button (dark pill)
- Saving adds event to the local state and closes modal
- Backdrop click closes modal

**Tests (must pass before complete):**
- [ ] Modal slides up from bottom on mobile
- [ ] All form fields render and accept input
- [ ] Time pickers enforce 15-minute increments
- [ ] Validation prevents end time before start time
- [ ] Saving an event adds it to the calendar view
- [ ] Verify in browser using dev-browser skill at mobile width

**Technical Notes:**
- Files: src/components/schedule/CreateEventModal.jsx
- Use React state at the schedule page level to manage events array
- Generate unique IDs for new events (e.g., `evt-${Date.now()}`)
- Modal should accept: isOpen, onClose, onSave, defaults (type, person, date, startTime)

### Story 11: Edit Event Modal — Mobile
**Description:** Build the bottom-sheet modal for editing existing events. Same layout as create modal but pre-populated with event data and includes a delete option.

**Priority:** high

**Acceptance Criteria:**
- Opens when tapping an existing event card
- Same slide-up bottom sheet as create modal
- All fields pre-populated with event's current values
- Same validation rules as create modal (end after start, 15-min increments)
- Save button updates the event in local state
- Delete button (red text) with confirmation prompt removes the event
- Cancel closes without changes

**Tests (must pass before complete):**
- [ ] Tapping an event card opens the edit modal
- [ ] Fields are pre-populated with correct event data
- [ ] Saving updates the event on the calendar
- [ ] Delete removes the event after confirmation
- [ ] Verify in browser using dev-browser skill at mobile width

**Technical Notes:**
- Files: src/components/schedule/EditEventModal.jsx (or extend CreateEventModal with an editing mode)
- Reuse form fields from CreateEventModal — consider a shared EventForm component
- Confirmation for delete: simple "Are you sure?" dialog

### Story 12: Long-Press to Create Event on Mobile
**Description:** Implement long-press (press and hold) on an empty time slot to auto-create an event at that time and open the create modal.

**Priority:** medium

**Acceptance Criteria:**
- Long-pressing (500ms hold) on an empty time slot opens the create event modal
- Start time is set to the slot that was pressed
- End time defaults to start time + 1 hour (or next occupied slot, whichever is sooner)
- Person defaults to currently viewed team member
- Visual feedback during long press (subtle highlight on the slot)
- Only works on empty slots — long-pressing an event card opens edit modal instead

**Tests (must pass before complete):**
- [ ] Long-pressing empty slot opens create modal with correct time
- [ ] Default end time is start + 1 hour
- [ ] Visual feedback shows during long press
- [ ] Long-pressing an event card opens edit modal, not create
- [ ] Verify in browser using dev-browser skill at mobile width

**Technical Notes:**
- Files: Update src/components/schedule/TimeGrid.jsx, src/components/schedule/MobileDayView.jsx
- Use onTouchStart/onTouchEnd with a 500ms timer
- Also support onMouseDown/onMouseUp for desktop testing
- Calculate time from touch/click Y position relative to grid

### Story 13: Mobile Drag-and-Drop — Move Events
**Description:** Implement drag-and-drop to move events to different time slots on the mobile day view.

**Priority:** medium

**Acceptance Criteria:**
- Touch-drag an event card to move it to a different time slot
- Event snaps to nearest 15-minute increment on drop
- Visual ghost/preview shows where the event will land while dragging
- Invalid drop targets (conflicting times) are visually indicated (red highlight or opacity change)
- Dropping on a conflicting time slot shows a toast error and reverts the event to its original position
- Event data updates in state on successful drop

**Tests (must pass before complete):**
- [ ] Dragging an event shows a ghost preview at the target position
- [ ] Dropping on valid slot moves the event and updates state
- [ ] Dropping on conflicting slot shows toast error and reverts
- [ ] Events snap to 15-minute increments
- [ ] Verify in browser using dev-browser skill at mobile width

**Technical Notes:**
- Files: src/components/schedule/DraggableEvent.jsx, update MobileDayView.jsx
- Use @dnd-kit/core for drag-and-drop: `npm install @dnd-kit/core @dnd-kit/sortable`
- Use react-hot-toast for conflict errors: `npm install react-hot-toast`
- Conflict check: new time range must not overlap any other event for the same person on the same day

### Story 14: Mobile Drag-to-Resize Events
**Description:** Allow dragging the bottom edge of an event card to extend or shorten its duration.

**Priority:** medium

**Acceptance Criteria:**
- A small resize handle (grabber line or dots) appears at the bottom of each event card
- Dragging the handle down extends the event's end time
- Dragging the handle up shortens the event's end time
- Minimum duration is 15 minutes — cannot resize below that
- End time snaps to 15-minute increments
- Resizing into a conflicting event shows visual feedback and prevents the resize
- Toast error on conflict

**Tests (must pass before complete):**
- [ ] Resize handle is visible at the bottom of event cards
- [ ] Dragging handle down extends the event visually and updates state
- [ ] Dragging handle up shortens the event
- [ ] Cannot resize below 15 minutes
- [ ] Conflicting resize is blocked with feedback
- [ ] Verify in browser using dev-browser skill at mobile width

**Technical Notes:**
- Files: src/components/schedule/ResizableEvent.jsx or extend DraggableEvent.jsx
- Track touch/mouse Y delta, convert to 15-min increments
- Separate this from the move drag — resize only triggers from the handle, move from the card body

### Story 15: Desktop Date Picker Bar
**Description:** Build the top date picker bar for desktop that shows the current date and allows day-by-day navigation. Updates when scrolling through days.

**Priority:** high

**Acceptance Criteria:**
- Horizontal bar at the top of the main content area (right of sidebar)
- Shows current selected date prominently (e.g., "Monday, February 3, 2025") in Bebas Neue
- Left/right arrows for previous/next day navigation
- "Today" button to jump back to the current date
- Date picker accepts external updates (for scroll-sync in Story 18)
- Desktop only (hidden on mobile)

**Tests (must pass before complete):**
- [ ] Date picker bar renders on desktop with current date
- [ ] Left/right arrows change the selected date
- [ ] Today button returns to current date
- [ ] Date is displayed in Bebas Neue font
- [ ] Verify in browser using dev-browser skill at desktop width

**Technical Notes:**
- Files: src/components/schedule/DesktopDatePicker.jsx
- Use date-fns format for display
- Expose a way to set date externally (controlled component pattern with selectedDate prop and onChange)

### Story 16: Desktop Multi-Column Time Grid
**Description:** Build the desktop calendar grid that shows one day at a time with each team member as a column.

**Priority:** high

**Acceptance Criteria:**
- Column header row showing each team member's name and avatar/initials
- One column per team member
- Time labels (6 AM – 8 PM) on the far left, shared across all columns
- 15-minute grid lines within each column
- Grid is vertically scrollable
- Columns are evenly distributed across available width
- Current time indicator line spans across all columns

**Tests (must pass before complete):**
- [ ] One column renders per team member with name headers
- [ ] Time labels show on the left from 6 AM to 8 PM
- [ ] Grid lines are visible at 15-minute increments
- [ ] Grid scrolls vertically
- [ ] Current time indicator line is visible
- [ ] Verify in browser using dev-browser skill at desktop width

**Technical Notes:**
- Files: src/components/schedule/DesktopDayGrid.jsx
- Reuse time calculation logic from TimeGrid.jsx where possible
- Column header should be sticky (position: sticky, top: 0)

### Story 17: Render Events on Desktop Grid
**Description:** Render event cards within the desktop multi-column grid, positioned correctly in each team member's column.

**Priority:** high

**Acceptance Criteria:**
- Events render in the correct team member's column
- Events are positioned at the correct vertical time offset
- Event cards use the same EventCard component as mobile
- All team member events for the selected date are visible simultaneously
- Empty columns show no events (no error state needed — just empty)

**Tests (must pass before complete):**
- [ ] Events appear in the correct team member column
- [ ] Events are at the correct time positions
- [ ] Event cards show type colors and status indicators
- [ ] Changing the date updates all columns
- [ ] Verify in browser using dev-browser skill at desktop width

**Technical Notes:**
- Files: Update src/components/schedule/DesktopDayGrid.jsx
- For each column, filter events by getEventsForMember(memberId, selectedDate)
- Reuse the same vertical positioning math as mobile

### Story 18: Desktop Continuous Day Scroll with Sticky Headers
**Description:** Enable scrolling down past the end of one day into the next day on desktop. A sticky day header appears between days and the date picker updates as you scroll into a new day.

**Priority:** high

**Acceptance Criteria:**
- After 8 PM of the current day, the grid continues with a day separator header for the next day
- Day separator header shows the date (e.g., "Tuesday, February 4, 2025") in Bebas Neue
- Day separator header is sticky — stays at top of viewport while scrolling through that day's slots
- Scrolling into a new day updates the DesktopDatePicker to show that day's date
- Navigating via the date picker scrolls the grid to that day's section
- At least 5 days rendered below the selected day for smooth scrolling

**Tests (must pass before complete):**
- [ ] Scrolling past 8 PM reveals the next day's time grid
- [ ] Sticky day header shows and sticks at top while scrolling through a day
- [ ] Date picker updates when scrolling into a new day
- [ ] Clicking a date in the date picker scrolls the grid to that day
- [ ] Verify in browser using dev-browser skill at desktop width

**Technical Notes:**
- Files: src/components/schedule/DesktopScrollView.jsx (wrapper around DesktopDayGrid)
- Use IntersectionObserver on day header elements to detect which day is in view
- Use scrollIntoView or ref-based scrolling for date picker → grid sync
- Render multiple days: selectedDate and the next 4–5 days

### Story 19: Desktop Click-to-Create Event
**Description:** Clicking on an empty time slot in any team member's column opens the create event modal with that time and person pre-selected.

**Priority:** high

**Acceptance Criteria:**
- Clicking an empty slot opens a centered modal (not bottom sheet) for creating an event
- The clicked time is pre-set as start time
- End time defaults to start time + 1 hour
- The team member whose column was clicked is pre-set as the person
- Modal uses same form fields as mobile create modal
- Modal appears centered on screen with backdrop overlay
- Save adds event, Cancel closes modal

**Tests (must pass before complete):**
- [ ] Clicking empty slot opens create modal with correct time and person
- [ ] Modal appears centered on desktop
- [ ] Saving creates an event in the correct column
- [ ] Cancel closes without changes
- [ ] Verify in browser using dev-browser skill at desktop width

**Technical Notes:**
- Files: src/components/schedule/DesktopCreateModal.jsx (or reuse CreateEventModal with a `variant` prop for centered vs bottom-sheet)
- Determine clicked time from mouse Y position relative to grid
- Determine team member from the column index

### Story 20: Desktop Edit Event Modal
**Description:** Clicking an existing event on desktop opens a centered edit modal with pre-populated data and delete option.

**Priority:** high

**Acceptance Criteria:**
- Clicking an event card on desktop opens a centered edit modal
- All fields pre-populated with event data
- Same validation as mobile edit modal
- Save updates the event, Delete removes it with confirmation
- Cancel closes without changes

**Tests (must pass before complete):**
- [ ] Clicking an event opens centered edit modal with correct data
- [ ] Saving updates the event visually on the grid
- [ ] Deleting removes the event after confirmation
- [ ] Verify in browser using dev-browser skill at desktop width

**Technical Notes:**
- Files: Reuse EditEventModal.jsx or EventForm component with centered variant
- Consider extracting a shared EventFormModal component that handles both create/edit in both mobile/desktop variants

### Story 21: Desktop Drag-and-Drop Within Column
**Description:** Enable drag-and-drop of events within the same team member's column to change the event's time.

**Priority:** medium

**Acceptance Criteria:**
- Drag an event card up or down within its column to change the time
- Event snaps to nearest 15-minute increment on drop
- Ghost/preview shows target position while dragging
- Conflict detection: invalid targets highlighted, drop blocked with toast error
- Event time updates in state on successful drop

**Tests (must pass before complete):**
- [ ] Dragging an event within column shows ghost preview
- [ ] Dropping on valid slot updates time in state
- [ ] Dropping on conflicting slot shows toast and reverts
- [ ] Verify in browser using dev-browser skill at desktop width

**Technical Notes:**
- Files: src/components/schedule/DesktopDraggableEvent.jsx, update DesktopDayGrid.jsx
- Reuse @dnd-kit setup from mobile stories
- Conflict check: same logic as mobile — no overlap with other events for the same person

### Story 22: Desktop Drag-and-Drop Between Columns
**Description:** Enable dragging events between team member columns on desktop, which reassigns the event to a different team member.

**Priority:** medium

**Acceptance Criteria:**
- Drag an event card from one column to another to reassign it
- Dropping in a different column changes the event's assigneeId
- Time can change simultaneously (drop in different column at different time)
- Conflict detection: check against the TARGET person's existing events
- Invalid targets shown with visual feedback, drop blocked with toast on conflict
- Event data (assignee and time) updates in state on successful drop

**Tests (must pass before complete):**
- [ ] Dragging an event to a different column reassigns it
- [ ] Event appears in the new column after drop
- [ ] Conflict with target person's events blocks the drop
- [ ] Toast error shown on conflict
- [ ] Verify in browser using dev-browser skill at desktop width

**Technical Notes:**
- Files: Update DesktopDraggableEvent.jsx and DesktopDayGrid.jsx
- @dnd-kit droppable zones: one per column, detect which column the event is dropped in
- On drop: update both assigneeId and time

### Story 23: Polish and Responsive Transitions
**Description:** Final polish pass — ensure smooth transitions between mobile and desktop layouts, consistent styling, proper loading states, and overall visual quality matching the design system.

**Priority:** medium

**Acceptance Criteria:**
- Resizing browser between mobile and desktop transitions cleanly (no layout breaks)
- All text uses correct fonts (Bebas Neue headings, Open Sans body)
- All buttons match pill style from design system
- Orange accent used consistently across active states, borders, and primary buttons
- No visible UI bugs: overlapping elements, text overflow, broken scroll
- Toast notifications styled to match design system (dark background, orange accent)
- All interactive elements have hover/active states (brightness shifts)
- Scroll behavior is smooth and performant

**Tests (must pass before complete):**
- [ ] Resizing between mobile and desktop does not break layout
- [ ] All fonts, colors, and button styles match design system
- [ ] No visible UI bugs at common viewport sizes (375px, 768px, 1280px)
- [ ] Toast notifications are styled consistently
- [ ] Verify in browser using dev-browser skill at both mobile and desktop widths

**Technical Notes:**
- Files: Various — this is a cross-cutting polish story
- Check Tailwind classes for consistency
- Test at 375px (mobile), 768px (tablet/breakpoint), 1280px (desktop)
- Ensure z-index layering is correct: sidebar > modals > FABs > calendar

## Out of Scope
- Real backend / API integration
- User authentication and login
- Push notifications
- Real-time collaboration / live updates
- Vonigo data import
- Week or month calendar views
- Recurring events
- Search functionality (search bar is visual placeholder only)
- PostHog analytics (can be added later)
