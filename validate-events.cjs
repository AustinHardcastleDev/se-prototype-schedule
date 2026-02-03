const events = require('./src/data/events.json');
const teamMembers = require('./src/data/teamMembers.json');

// Filter new events (Feb 6-20)
const newEvents = events.filter(e => e.date >= '2026-02-06' && e.date <= '2026-02-20');
console.log('Total new events (Feb 6-20):', newEvents.length);

// Create role map
const roleMap = {};
teamMembers.forEach(tm => roleMap[tm.id] = tm.role);

// Distribution by role and type
const byRole = { tech: {}, sales: {}, ops: {} };
const statusDist = { open: 0, 'closed-no-invoice': 0, 'closed-invoiced': 0 };

newEvents.forEach(e => {
  const role = roleMap[e.assigneeId];
  if (!byRole[role][e.type]) byRole[role][e.type] = 0;
  byRole[role][e.type]++;

  if (e.status) statusDist[e.status]++;
});

console.log('\nEvent type distribution by role:');
console.log('Tech:', byRole.tech);
console.log('Sales:', byRole.sales);
console.log('Ops:', byRole.ops);

console.log('\nStatus distribution:', statusDist);
const total = statusDist.open + statusDist['closed-no-invoice'] + statusDist['closed-invoiced'];
console.log(`Status %: open=${Math.round(statusDist.open/total*100)}%, closed-no-invoice=${Math.round(statusDist['closed-no-invoice']/total*100)}%, closed-invoiced=${Math.round(statusDist['closed-invoiced']/total*100)}%`);

// Check date coverage
const dates = new Set(newEvents.map(e => e.date));
const sortedDates = Array.from(dates).sort();
console.log('\nDates with events:', sortedDates.join(', '));
