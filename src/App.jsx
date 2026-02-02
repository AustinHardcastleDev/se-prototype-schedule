import { useEffect } from 'react'
import {
  getAllMembers,
  getMemberById,
  getEventsForMember,
  getEventsForDate,
  getEventTypes,
  getEventTypeByKey
} from './utils/dataAccess'

function App() {
  useEffect(() => {
    console.log('=== Testing Data Access Functions ===')
    console.log('getAllMembers():', getAllMembers())
    console.log('getMemberById("tm-1"):', getMemberById('tm-1'))
    console.log('getEventsForMember("tm-1", "2025-02-03"):', getEventsForMember('tm-1', '2025-02-03'))
    console.log('getEventsForDate("2025-02-03"):', getEventsForDate('2025-02-03'))
    console.log('getEventTypes():', getEventTypes())
    console.log('getEventTypeByKey("job-occupied"):', getEventTypeByKey('job-occupied'))
  }, [])

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="font-heading text-6xl text-accent mb-4">
          SE SCHEDULE
        </h1>
        <p className="font-body text-text-light text-xl mb-8">
          Surface Experts Schedule Management
        </p>
        <div className="bg-card-bg border border-accent rounded-lg p-6 max-w-md mx-auto">
          <h2 className="font-heading text-3xl text-text-dark mb-3">
            DATA ACCESS LAYER READY
          </h2>
          <p className="font-body text-text-dark mb-4">
            Mock data files and centralized data access utility configured. Check browser console for test output.
          </p>
          <ul className="font-body text-text-dark text-sm space-y-1">
            <li>✓ {getAllMembers().length} team members loaded</li>
            <li>✓ {getEventTypes().length} event types configured</li>
            <li>✓ {getEventsForDate('2025-02-03').length} events on 2025-02-03</li>
          </ul>
        </div>
        <div className="mt-8 space-x-4">
          <button className="bg-accent text-text-light px-6 py-3 rounded-full font-body font-semibold hover:brightness-110 transition-all">
            Primary Button
          </button>
          <button className="bg-secondary text-text-light px-6 py-3 rounded-full font-body font-semibold hover:brightness-110 transition-all">
            Secondary Button
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
