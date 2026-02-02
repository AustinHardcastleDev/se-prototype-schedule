# Mock Data Schemas

This directory contains all mock JSON data files for the SE Schedule application.

## Team Members (`teamMembers.json`)

Represents team members who can be assigned events.

**Schema:**
```json
{
  "id": "string",         // Unique identifier (e.g., "tm-1")
  "name": "string",       // Full name (e.g., "Mike Torres")
  "role": "string",       // Role: "tech" | "sales" | "ops"
  "avatar": "string",     // Initials for avatar display (e.g., "MT")
  "color": "string"       // Hex color code for visual identification
}
```

**Current Data:**
- 6 team members total
- 3 technicians (Mike Torres, Sarah Chen, James Rodriguez)
- 2 sales representatives (Rachel Kim, David Martinez)
- 1 operations manager (Jennifer Park)

## Event Types (`eventTypes.json`)

Defines the types of events that can be scheduled, along with their visual styling.

**Schema:**
```json
{
  "key": "string",        // Unique key (e.g., "job-occupied")
  "label": "string",      // Display label (e.g., "Job (Occupied)")
  "color": "string",      // Hex color code for event background
  "borderColor": "string" // Hex color code for event border
}
```

**Available Event Types:**
- `job-occupied` - Job at occupied property (Blue #3B82F6)
- `job-vacant` - Job at vacant property (Teal #14B8A6)
- `callback-job` - Follow-up job (Amber #F59E0B)
- `sales-stop` - Sales visit (Purple #8B5CF6)
- `meeting` - Team meeting (Slate #64748B)
- `time-off` - Personal time off (Rose #F43F5E)

## Events (`events.json`)

Represents scheduled events assigned to team members.

**Schema:**
```json
{
  "id": "string",         // Unique identifier (e.g., "evt-1")
  "title": "string",      // Event title/description
  "type": "string",       // Event type key (FK to eventTypes)
  "assigneeId": "string", // Team member ID (FK to teamMembers)
  "date": "string",       // Date in YYYY-MM-DD format
  "startTime": "string",  // Start time in HH:MM 24-hour format
  "endTime": "string",    // End time in HH:MM 24-hour format
  "status": "string"      // Job status: "open" | "closed-no-invoice" | "closed-invoiced"
}
```

**Title Conventions:**
- **Jobs**: "{Property Name} - Unit {Unit Number}" (e.g., "Oakwood Apartments - Unit 12B")
- **Callbacks**: "Callback: {Property Name} - Unit {Unit Number}"
- **Sales Stops**: "{Company Name}" (e.g., "Johnson & Sons Construction")
- **Meetings**: Descriptive title (e.g., "Weekly Team Meeting")

**Status Field:**
- Only applies to job-type events (job-occupied, job-vacant, callback-job)
- `open`: Job not yet completed (no indicator)
- `closed-no-invoice`: Job completed, invoice not sent (yellow dot indicator)
- `closed-invoiced`: Job completed, invoice sent (purple dot indicator)
- For non-job events (meetings, sales-stops, time-off), status is always "open"

**Current Data Distribution:**
- 30 events total across the week of 2025-02-03 to 2025-02-09
- Tech schedules: primarily job-occupied and job-vacant events, some callbacks and meetings
- Sales schedules: primarily sales-stop events, some meetings
- Ops schedule: primarily meetings
- Status distribution: ~60% open, ~25% closed-no-invoice, ~15% closed-invoiced

## Data Access

**IMPORTANT:** Components should NEVER import these JSON files directly. Always use the centralized data access layer at `src/utils/dataAccess.js`.

**Available Functions:**
- `getAllMembers()` - Returns all team members
- `getMemberById(id)` - Returns a specific team member
- `getEventsForMember(memberId, date)` - Returns events for a specific member on a specific date
- `getEventsForDate(date)` - Returns all events for a specific date
- `getEventTypes()` - Returns all event types
- `getEventTypeByKey(key)` - Returns a specific event type

**Example Usage:**
```javascript
import { getAllMembers, getEventsForMember, getEventTypeByKey } from '../utils/dataAccess'

// Get all team members
const members = getAllMembers()

// Get events for a specific member on a specific date
const events = getEventsForMember('tm-1', '2025-02-03')

// Get event type details
const eventType = getEventTypeByKey('job-occupied')
```
