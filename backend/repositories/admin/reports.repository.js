const db = require('../../database');

class ReportsRepository {
  async getSummaryStats() {
    // 1. Cases by Hospital
    const casesByHospital = await db.query(`
      SELECT COALESCE(h.hospital_name, 'Unassigned') as name, COUNT(m.mlef_id) as count
      FROM hospital h
      LEFT JOIN mlef m ON h.hospital_id = m.hospital_id
      GROUP BY h.hospital_name
      ORDER BY count DESC
    `);

    // 2. Cases by Police Station
    const casesByStation = await db.query(`
      SELECT COALESCE(ps.station_name, 'Unassigned') as name, COUNT(pc.case_id) as count
      FROM police_station ps
      LEFT JOIN police_case pc ON ps.station_id = pc.station_id
      GROUP BY ps.station_name
      ORDER BY count DESC
    `);

    // 3. Cases by District
    const casesByDistrict = await db.query(`
      SELECT COALESCE(ps.district, 'Unknown') as name, COUNT(pc.case_id) as count
      FROM police_station ps
      LEFT JOIN police_case pc ON ps.station_id = pc.station_id
      GROUP BY ps.district
      ORDER BY count DESC
    `);

    // 4. Laboratory Statistics
    const labStats = await db.query(`
      SELECT status as name, COUNT(*) as count
      FROM laboratory_request
      GROUP BY status
    `);

    // 5. Examination Statistics
    const examStats = await db.query(`
      SELECT es.status_name as name, COUNT(e.examination_id) as count
      FROM examination_status es
      LEFT JOIN examination e ON es.status_id = e.status_id
      GROUP BY es.status_name
    `);

    // 6. User Statistics
    const userStats = await db.query(`
      SELECT status as name, COUNT(*) as count
      FROM users
      GROUP BY status
    `);

    // 7. Staff Statistics
    const staffStats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM police_officer) as police,
        (SELECT COUNT(*) FROM judicial_medical_officer) as jmo,
        (SELECT COUNT(*) FROM medical_officer) as medical_officer,
        (SELECT COUNT(*) FROM laboratory_technician) as lab_technician,
        (SELECT COUNT(*) FROM government_analyst) as analyst,
        (SELECT COUNT(*) FROM forensic_staff) as forensic_staff
    `);

    return {
      casesByHospital: casesByHospital.rows,
      casesByStation: casesByStation.rows,
      casesByDistrict: casesByDistrict.rows,
      laboratoryRequests: labStats.rows,
      examinations: examStats.rows,
      users: userStats.rows,
      staff: staffStats.rows[0]
    };
  }
}

module.exports = new ReportsRepository();
