const db = require('../../database');

class CasesRepository {
  async findAll(filters = {}) {
    let query = `
      SELECT pc.case_id, pc.case_number, pc.case_type, pc.title, cs.status_name as status, ps.station_name, pc.date_reported
      FROM police_case pc
      JOIN case_status cs ON pc.status_id = cs.status_id
      JOIN police_station ps ON pc.station_id = ps.station_id
      WHERE 1=1
    `;
    const values = [];
    let idx = 1;

    if (filters.case_number) {
      query += ` AND pc.case_number ILIKE $${idx}`;
      values.push(`%${filters.case_number}%`);
      idx++;
    }

    if (filters.status) {
      query += ` AND cs.status_name = $${idx}`;
      values.push(filters.status);
      idx++;
    }

    if (filters.station_id) {
      query += ` AND pc.station_id = $${idx}`;
      values.push(filters.station_id);
      idx++;
    }

    query += ' ORDER BY pc.date_reported DESC';
    const result = await db.query(query, values);
    return result.rows;
  }

  async findById(caseId) {
    // 1. Fetch main case
    const caseResult = await db.query(`
      SELECT pc.*, cs.status_name as status, ps.station_name
      FROM police_case pc
      JOIN case_status cs ON pc.status_id = cs.status_id
      JOIN police_station ps ON pc.station_id = ps.station_id
      WHERE pc.case_id = $1
    `, [caseId]);

    if (caseResult.rows.length === 0) return null;
    const caseData = caseResult.rows[0];

    // 2. Fetch incidents
    const incidents = await db.query(`SELECT * FROM incident WHERE case_id = $1`, [caseId]);
    caseData.incidents = incidents.rows;

    // 3. Fetch evidence
    const evidence = await db.query(`SELECT * FROM evidence WHERE case_id = $1`, [caseId]);
    caseData.evidence = evidence.rows;

    // 4. Fetch MLEF
    const mlef = await db.query(`
      SELECT m.*, pt.medical_record_number, p.first_name || ' ' || p.last_name as patient_name
      FROM mlef m
      JOIN patient pt ON m.patient_id = pt.patient_id
      JOIN person p ON pt.person_id = p.person_id
      WHERE m.case_id = $1
    `, [caseId]);
    caseData.mlefs = mlef.rows;

    // 5. Fetch examinations, lab requests & reports for each MLEF
    caseData.examinations = [];
    caseData.labRequests = [];
    caseData.reports = [];

    for (const m of mlef.rows) {
      const exams = await db.query(`
        SELECT e.*, es.status_name as status
        FROM examination e
        JOIN examination_status es ON e.status_id = es.status_id
        WHERE e.mlef_id = $1
      `, [m.mlef_id]);
      caseData.examinations.push(...exams.rows);

      for (const e of exams.rows) {
        // Lab requests
        const labs = await db.query(`
          SELECT lr.*, s.specimen_type, l.laboratory_name
          FROM laboratory_request lr
          JOIN specimen s ON lr.specimen_id = s.specimen_id
          JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
          WHERE s.examination_id = $1
        `, [e.examination_id]);
        caseData.labRequests.push(...labs.rows);

        // Reports
        const reps = await db.query(`
          SELECT * FROM medico_legal_report WHERE examination_id = $1
        `, [e.examination_id]);
        caseData.reports.push(...reps.rows);
      }
    }

    return caseData;
  }

  async getTimeline(caseId) {
    const timeline = [];
    
    // 1. Case created
    const cResult = await db.query(`SELECT date_reported, created_at FROM police_case WHERE case_id = $1`, [caseId]);
    if (cResult.rows.length > 0) {
      timeline.push({ stage: 'Case Created', date: cResult.rows[0].created_at, details: 'Police case registered' });
    }

    // 2. Officer assigned
    const aResult = await db.query(`SELECT assigned_date FROM case_assignment WHERE case_id = $1 ORDER BY assigned_date ASC LIMIT 1`, [caseId]);
    if (aResult.rows.length > 0) {
      timeline.push({ stage: 'Officer Assigned', date: aResult.rows[0].assigned_date, details: 'Investigating officer assigned' });
    }

    // 3. Evidence collected
    const eResult = await db.query(`SELECT collected_date FROM evidence WHERE case_id = $1 ORDER BY collected_date ASC LIMIT 1`, [caseId]);
    if (eResult.rows.length > 0) {
      timeline.push({ stage: 'Evidence Collected', date: eResult.rows[0].collected_date, details: 'Initial evidence collected' });
    }

    // 4. MLEF Requested
    const mResult = await db.query(`SELECT request_date, mlef_id FROM mlef WHERE case_id = $1 ORDER BY request_date ASC`, [caseId]);
    for (const mlef of mResult.rows) {
      timeline.push({ stage: 'MLEF Requested', date: mlef.request_date, details: 'MLEF registered' });
      
      // 5. Medical Examination
      const examResult = await db.query(`SELECT created_at, examination_id FROM examination WHERE mlef_id = $1`, [mlef.mlef_id]);
      for (const exam of examResult.rows) {
        timeline.push({ stage: 'Medical Examination Completed', date: exam.created_at, details: 'Examination finalized' });
        
        // 6. Report Generated
        const repResult = await db.query(`SELECT prepared_date FROM medico_legal_report WHERE examination_id = $1`, [exam.examination_id]);
        if (repResult.rows.length > 0) {
          timeline.push({ stage: 'Report Generated', date: repResult.rows[0].prepared_date, details: 'Medico-legal report issued' });
        }
        
        // Lab requests
        const labResult = await db.query(`
          SELECT lr.request_date, lt.completed_at
          FROM laboratory_request lr
          JOIN specimen s ON lr.specimen_id = s.specimen_id
          LEFT JOIN laboratory_test lt ON lt.request_id = lr.request_id
          WHERE s.examination_id = $1
        `, [exam.examination_id]);
        
        for (const lab of labResult.rows) {
          timeline.push({ stage: 'Laboratory Processing Started', date: lab.request_date, details: 'Specimen sent to lab' });
          if (lab.completed_at) {
            timeline.push({ stage: 'Laboratory Testing Completed', date: lab.completed_at, details: 'Lab results available' });
          }
        }
      }
    }

    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
    return timeline;
  }
}

module.exports = new CasesRepository();
