import teamMembers from '../data/teamMembers.json'
import events from '../data/events.json'
import eventTypes from '../data/eventTypes.json'

/**
 * Get all team members
 * @returns {Array} Array of team member objects
 */
export const getAllMembers = () => teamMembers

/**
 * Get a team member by ID
 * @param {string} id - Team member ID
 * @returns {Object|undefined} Team member object or undefined if not found
 */
export const getMemberById = (id) => teamMembers.find(m => m.id === id)

/**
 * Get all events for a specific team member on a specific date
 * @param {string} memberId - Team member ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} Array of event objects
 */
export const getEventsForMember = (memberId, date) =>
  events.filter(e => e.assigneeId === memberId && e.date === date)

/**
 * Get all events
 * @returns {Array} Array of all event objects
 */
export const getAllEvents = () => events

/**
 * Get all events for a specific date (across all team members)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} Array of event objects
 */
export const getEventsForDate = (date) =>
  events.filter(e => e.date === date)

/**
 * Get all event types
 * @returns {Array} Array of event type objects
 */
export const getEventTypes = () => eventTypes

/**
 * Get an event type by key
 * @param {string} key - Event type key (e.g., 'job-occupied')
 * @returns {Object|undefined} Event type object or undefined if not found
 */
export const getEventTypeByKey = (key) => eventTypes.find(t => t.key === key)

/**
 * Get all events with lat/lng for a specific date (geo-enabled events only)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} Array of event objects that have coordinates
 */
export const getGeoEventsForDate = (date) =>
  events.filter(e => e.date === date && e.lat != null && e.lng != null)
