const db = require('../../database');

class DashboardRepository {
  async getDashboardStats() {
    // Run all counts in parallel using Promise.all for performance
    const queries = [
      db.query('SELECT COUNT(*) as count FROM users'),
      db.query('SELECT COUNT(*) as count FROM police_officer'),
      db.query('SELECT COUNT(*) as count FROM judicial_medical_officer'),
      db.query('SELECT COUNT(*) as count FROM medical_officer'),
      db.query('SELECT COUNT(*) as count FROM laboratory_technician'),
      db.query('SELECT COUNT(*) as count FROM hospital'),
      db.query('SELECT COUNT(*) as count FROM police_station'),
      db.query('SELECT COUNT(*) as count FROM police_case'),
      db.query('SELECT COUNT(*) as count FROM mlef'),
      db.query('SELECT COUNT(*) as count FROM examination WHERE status_id = (SELECT status_id FROM examination_status WHERE status_name = $1)', ['PENDING']),
      db.query('SELECT COUNT(*) as count FROM laboratory_request WHERE status = $1', ['PENDING']),
      db.query('SELECT COUNT(*) as count FROM laboratory_test WHERE status = $1', ['COMPLETED'])
    ];

    const results = await Promise.all(queries);

    return {
      totalUsers: parseInt(results[0].rows[0].count),
      totalPoliceOfficers: parseInt(results[1].rows[0].count),
      totalJMOs: parseInt(results[2].rows[0].count),
      totalMedicalOfficers: parseInt(results[3].rows[0].count),
      totalLabTechnicians: parseInt(results[4].rows[0].count),
      totalHospitals: parseInt(results[5].rows[0].count),
      totalPoliceStations: parseInt(results[6].rows[0].count),
      totalPoliceCases: parseInt(results[7].rows[0].count),
      totalMLEFRequests: parseInt(results[8].rows[0].count),
      pendingExaminations: parseInt(results[9].rows[0].count),
      pendingLabRequests: parseInt(results[10].rows[0].count),
      completedLabTests: parseInt(results[11].rows[0].count)
    };
  }
}

module.exports = new DashboardRepository();
