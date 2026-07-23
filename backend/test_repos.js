require('dotenv').config();
const policeRepo = require('./repositories/police.repository');
const pool = require('./database/connection');

async function test() {
  try {
    const officerIdQuery = await pool.query('SELECT officer_id FROM police_officer LIMIT 1');
    if(officerIdQuery.rows.length === 0) { console.log('No officers found'); return; }
    const officerId = officerIdQuery.rows[0].officer_id;
    console.log('Testing with officerId:', officerId);

    console.log('--- Testing getDashboardStats ---');
    try {
      const stats = await policeRepo.getDashboardStats(officerId);
      console.log('Stats success', Object.keys(stats));
    } catch(e) {
      console.error('Stats error:', e.message);
    }

    console.log('--- Testing getCases ---');
    try {
      const cases = await policeRepo.getCases(officerId, {});
      console.log('Cases success', cases.length);
    } catch(e) {
      console.error('Cases error:', e.message);
    }
  } catch(e) {
    console.error('General error:', e.message);
  } finally {
    pool.end();
  }
}
test();
