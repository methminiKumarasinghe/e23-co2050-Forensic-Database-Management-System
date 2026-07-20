const pool = require('../database/connection');

// --- AUDIT LOG ---
const logActivity = async (client, userId, action, entityName, entityId, description) => {
  const query = `
    INSERT INTO audit_logs (user_id, action, entity_name, entity_id, description)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await client.query(query, [userId, action, entityName, entityId, description]);
};

// General helper to map User to JMO
const getJmoDataByUserId = async (userId) => {
  const query = `
    SELECT jmo.jmo_id, jmo.hospital_id 
    FROM judicial_medical_officer jmo
    JOIN person p ON jmo.person_id = p.person_id
    WHERE p.user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

// --- MODULE 1: Dashboard ---
const getDashboardStats = async (jmoId, hospitalId) => {
  const query = `
    WITH jmo_exams AS (
      SELECT examination_id FROM examination WHERE jmo_id = $1
    )
    SELECT
      (SELECT COUNT(*) FROM mlef WHERE hospital_id = $2) AS assigned_mlef_requests,
      (SELECT COUNT(*) FROM examination e JOIN examination_status es ON e.status_id = es.status_id WHERE e.jmo_id = $1 AND es.status_name IN ('PENDING', 'IN_PROGRESS')) AS pending_examinations,
      (SELECT COUNT(*) FROM examination e JOIN examination_status es ON e.status_id = es.status_id WHERE e.jmo_id = $1 AND es.status_name IN ('COMPLETED', 'REVIEWED')) AS completed_examinations,
      (SELECT COUNT(*) FROM laboratory_request lr WHERE lr.requested_by = $1 AND lr.status = 'PENDING') AS pending_laboratory_requests,
      (SELECT COUNT(*) FROM laboratory_result lres JOIN laboratory_test lt ON lres.test_id = lt.test_id JOIN laboratory_request lr ON lt.request_id = lr.request_id WHERE lr.requested_by = $1) AS completed_laboratory_results,
      (SELECT COUNT(*) FROM medico_legal_report r JOIN jmo_exams e ON r.examination_id = e.examination_id WHERE r.report_status = 'DRAFT') AS pending_reports,
      (SELECT COUNT(*) FROM medico_legal_report r JOIN jmo_exams e ON r.examination_id = e.examination_id WHERE r.report_status = 'SIGNED') AS signed_reports,
      (SELECT COUNT(*) FROM appointment a WHERE a.jmo_id = $1 AND a.status = 'SCHEDULED') AS upcoming_appointments
  `;
  const result = await pool.query(query, [jmoId, hospitalId]);
  
  const recentActivitiesQuery = `
    SELECT al.audit_id, al.action, al.description, al.created_at
    FROM audit_logs al
    WHERE al.user_id = (SELECT p.user_id FROM judicial_medical_officer jmo JOIN person p ON jmo.person_id = p.person_id WHERE jmo.jmo_id = $1)
    ORDER BY al.created_at DESC
    LIMIT 10
  `;
  const recentActivitiesResult = await pool.query(recentActivitiesQuery, [jmoId]);
  
  return {
    stats: result.rows[0],
    recentActivities: recentActivitiesResult.rows
  };
};

// --- MODULE 2: Assigned MLEF Requests ---
const getMlefRequests = async (hospitalId, filters) => {
  let query = `
    SELECT m.*, p.first_name, p.last_name, pc.case_number
    FROM mlef m
    LEFT JOIN patient pt ON m.patient_id = pt.patient_id
    LEFT JOIN person p ON pt.person_id = p.person_id
    LEFT JOIN police_case pc ON m.case_id = pc.case_id
    WHERE m.hospital_id = $1
  `;
  const values = [hospitalId];
  let idx = 2;

  if (filters.status) {
    query += ` AND m.status = $${idx++}`;
    values.push(filters.status);
  }
  if (filters.date) {
    query += ` AND DATE(m.request_date) = $${idx++}`;
    values.push(filters.date);
  }

  query += ` ORDER BY m.request_date DESC`;
  
  if (filters.limit) {
    query += ` LIMIT $${idx++}`;
    values.push(filters.limit);
  }
  if (filters.offset) {
    query += ` OFFSET $${idx++}`;
    values.push(filters.offset);
  }

  const result = await pool.query(query, values);
  return result.rows;
};

const getMlefById = async (mlefId, hospitalId) => {
  const query = `
    SELECT m.*, p.first_name, p.last_name, p.nic, pt.medical_record_number, pc.case_number, pc.title as case_title, pc.description as case_description
    FROM mlef m
    LEFT JOIN patient pt ON m.patient_id = pt.patient_id
    LEFT JOIN person p ON pt.person_id = p.person_id
    LEFT JOIN police_case pc ON m.case_id = pc.case_id
    WHERE m.mlef_id = $1 AND m.hospital_id = $2
  `;
  const result = await pool.query(query, [mlefId, hospitalId]);
  
  // also grab related incident and evidence summaries
  const mlef = result.rows[0];
  if (mlef) {
      const incidents = await pool.query(`SELECT * FROM incident WHERE case_id = $1`, [mlef.case_id]);
      const evidence = await pool.query(`SELECT * FROM evidence WHERE case_id = $1`, [mlef.case_id]);
      mlef.incidents = incidents.rows;
      mlef.evidence = evidence.rows;
  }
  
  return mlef;
};

// --- MODULE 3: Medical Examination ---
const getExaminations = async (jmoId) => {
    const query = `
      SELECT e.*, es.status_name
      FROM examination e
      JOIN examination_status es ON e.status_id = es.status_id
      WHERE e.jmo_id = $1
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query, [jmoId]);
    return result.rows;
};

const createExamination = async (examData, jmoId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if exam already exists for this mlef
    const checkQuery = `SELECT * FROM examination WHERE mlef_id = $1`;
    const checkResult = await client.query(checkQuery, [examData.mlef_id]);
    if (checkResult.rows.length > 0) throw new Error("Examination already exists for this MLEF request.");

    const statusQuery = `SELECT status_id FROM examination_status WHERE status_name = 'IN_PROGRESS'`;
    const statusResult = await client.query(statusQuery);
    const statusId = statusResult.rows[0].status_id;

    const query = `
      INSERT INTO examination (mlef_id, jmo_id, status_id, examination_date, examination_notes, conclusion)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `;
    const values = [examData.mlef_id, jmoId, statusId, examData.examination_date, examData.examination_notes, examData.conclusion];
    const result = await client.query(query, values);
    const newExam = result.rows[0];

    await logActivity(client, userId, 'Examination Created', 'examination', newExam.examination_id, 'Examination record created.');

    await client.query('COMMIT');
    return newExam;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateExamination = async (examinationId, updateData, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const fields = [];
    const values = [];
    let idx = 1;

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${idx++}`);
      values.push(updateData[key]);
    });

    if (fields.length === 0) return null;

    values.push(examinationId);
    const query = `
      UPDATE examination 
      SET ${fields.join(', ')}
      WHERE examination_id = $${idx} 
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    
    await logActivity(client, userId, 'Examination Updated', 'examination', examinationId, 'Examination record updated.');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 4: Vital Signs ---
const addVitals = async (examinationId, vitalsData) => {
  const query = `
    INSERT INTO vital_signs (examination_id, blood_pressure, pulse_rate, respiratory_rate, temperature, oxygen_saturation, weight, height)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
  `;
  const values = [examinationId, vitalsData.blood_pressure, vitalsData.pulse_rate, vitalsData.respiratory_rate, vitalsData.temperature, vitalsData.oxygen_saturation, vitalsData.weight, vitalsData.height];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const updateVitals = async (vitalSignId, updateData) => {
  const fields = [];
  const values = [];
  let idx = 1;
  Object.keys(updateData).forEach(key => {
    fields.push(`${key} = $${idx++}`);
    values.push(updateData[key]);
  });
  if (fields.length === 0) return null;
  values.push(vitalSignId);
  const query = `UPDATE vital_signs SET ${fields.join(', ')} WHERE vital_sign_id = $${idx} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

// --- MODULE 5: Injury Management ---
const getInjuries = async (examinationId) => {
    const query = `SELECT * FROM injury WHERE examination_id = $1`;
    const result = await pool.query(query, [examinationId]);
    return result.rows;
};

const createInjury = async (examinationId, injuryData, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query = `
      INSERT INTO injury (examination_id, injury_type, body_location, size, severity, description, estimated_age)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const values = [examinationId, injuryData.injury_type, injuryData.body_location, injuryData.size, injuryData.severity, injuryData.description, injuryData.estimated_age];
    const result = await client.query(query, values);
    
    await logActivity(client, userId, 'Injury Added', 'injury', result.rows[0].injury_id, 'Injury record added to examination.');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateInjury = async (injuryId, updateData, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const fields = [];
    const values = [];
    let idx = 1;
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${idx++}`);
      values.push(updateData[key]);
    });
    if (fields.length === 0) return null;
    values.push(injuryId);
    
    const query = `UPDATE injury SET ${fields.join(', ')} WHERE injury_id = $${idx} RETURNING *`;
    const result = await client.query(query, values);
    
    await logActivity(client, userId, 'Injury Updated', 'injury', injuryId, 'Injury record updated.');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 6 & 7: Injury Photos & Body Diagrams ---
const uploadInjuryPhoto = async (injuryId, filePath, description) => {
  const query = `
    INSERT INTO injury_photo (injury_id, image_path, description)
    VALUES ($1, $2, $3) RETURNING *
  `;
  const result = await pool.query(query, [injuryId, filePath, description]);
  return result.rows[0];
};

const uploadBodyDiagram = async (injuryId, filePath, annotation) => {
  const query = `
    INSERT INTO body_diagram (injury_id, diagram_image, annotation)
    VALUES ($1, $2, $3) RETURNING *
  `;
  const result = await pool.query(query, [injuryId, filePath, annotation]);
  return result.rows[0];
};

// --- MODULE 8: Specimen Collection ---
const getSpecimens = async (examinationId) => {
    const query = `SELECT * FROM specimen WHERE examination_id = $1`;
    const result = await pool.query(query, [examinationId]);
    return result.rows;
};

const createSpecimen = async (examinationId, specimenData, jmoId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query = `
      INSERT INTO specimen (examination_id, specimen_type, collection_datetime, collected_by, remarks)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const values = [examinationId, specimenData.specimen_type, specimenData.collection_datetime, jmoId, specimenData.remarks];
    const result = await client.query(query, values);
    
    await logActivity(client, userId, 'Specimen Collected', 'specimen', result.rows[0].specimen_id, 'Specimen collected.');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 9: Laboratory Requests ---
const getLabRequests = async (jmoId) => {
    const query = `SELECT * FROM laboratory_request WHERE requested_by = $1 ORDER BY request_date DESC`;
    const result = await pool.query(query, [jmoId]);
    return result.rows;
};

const createLabRequest = async (requestData, jmoId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query = `
      INSERT INTO laboratory_request (specimen_id, laboratory_id, requested_by, priority, status)
      VALUES ($1, $2, $3, $4, 'PENDING') RETURNING *
    `;
    const values = [requestData.specimen_id, requestData.laboratory_id, jmoId, requestData.priority];
    const result = await client.query(query, values);
    
    await logActivity(client, userId, 'Laboratory Request Created', 'laboratory_request', result.rows[0].request_id, 'Lab request created.');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 10: Laboratory Results ---
const getLabResults = async (jmoId) => {
    const query = `
        SELECT lres.*, lt.test_name, lr.status
        FROM laboratory_result lres
        JOIN laboratory_test lt ON lres.test_id = lt.test_id
        JOIN laboratory_request lr ON lt.request_id = lr.request_id
        WHERE lr.requested_by = $1
    `;
    const result = await pool.query(query, [jmoId]);
    return result.rows;
};

const getLabResultById = async (resultId, jmoId) => {
    const query = `
        SELECT lres.*, lt.test_name, lr.status
        FROM laboratory_result lres
        JOIN laboratory_test lt ON lres.test_id = lt.test_id
        JOIN laboratory_request lr ON lt.request_id = lr.request_id
        WHERE lres.result_id = $1 AND lr.requested_by = $2
    `;
    const result = await pool.query(query, [resultId, jmoId]);
    return result.rows[0];
};

// --- MODULE 11: Medico-Legal Reports ---
const getReports = async (jmoId) => {
    const query = `
        SELECT r.* 
        FROM medico_legal_report r
        JOIN examination e ON r.examination_id = e.examination_id
        WHERE e.jmo_id = $1
        ORDER BY r.prepared_date DESC
    `;
    const result = await pool.query(query, [jmoId]);
    return result.rows;
};

const getReportById = async (reportId, jmoId) => {
    const query = `
        SELECT r.* 
        FROM medico_legal_report r
        JOIN examination e ON r.examination_id = e.examination_id
        WHERE r.report_id = $1 AND e.jmo_id = $2
    `;
    const result = await pool.query(query, [reportId, jmoId]);
    return result.rows[0];
};

const createReport = async (reportData, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const checkQuery = `SELECT * FROM medico_legal_report WHERE examination_id = $1`;
    const checkResult = await client.query(checkQuery, [reportData.examination_id]);
    if (checkResult.rows.length > 0) throw new Error("Report already exists for this examination.");

    const query = `
      INSERT INTO medico_legal_report (examination_id, findings, medical_opinion, recommendations, report_status)
      VALUES ($1, $2, $3, $4, 'DRAFT') RETURNING *
    `;
    const values = [reportData.examination_id, reportData.findings, reportData.medical_opinion, reportData.recommendations];
    const result = await client.query(query, values);
    
    await logActivity(client, userId, 'Report Created', 'medico_legal_report', result.rows[0].report_id, 'Medico-Legal Report generated.');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateReport = async (reportId, updateData, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const fields = [];
    const values = [];
    let idx = 1;
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${idx++}`);
      values.push(updateData[key]);
    });
    if (fields.length === 0) return null;
    values.push(reportId);
    
    const query = `UPDATE medico_legal_report SET ${fields.join(', ')} WHERE report_id = $${idx} RETURNING *`;
    const result = await client.query(query, values);
    
    await logActivity(client, userId, 'Report Updated', 'medico_legal_report', reportId, 'Medico-Legal Report updated.');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 12: Digital Signature ---
const signReport = async (reportId, signatureData, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const sigQuery = `
      INSERT INTO digital_signatures (user_id, document_id, signature_hash)
      VALUES ($1, $2, $3) RETURNING *
    `;
    const sigResult = await client.query(sigQuery, [userId, reportId, signatureData.signature_hash]);
    
    const repQuery = `UPDATE medico_legal_report SET report_status = 'SIGNED' WHERE report_id = $1 RETURNING *`;
    await client.query(repQuery, [reportId]);
    
    await logActivity(client, userId, 'Report Signed', 'medico_legal_report', reportId, 'Report digitally signed and locked.');
    await client.query('COMMIT');
    return sigResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 13: Appointments ---
const getAppointments = async (jmoId) => {
    const query = `SELECT * FROM appointment WHERE jmo_id = $1 ORDER BY appointment_date ASC`;
    const result = await pool.query(query, [jmoId]);
    return result.rows;
};

const createAppointment = async (appointmentData, jmoId) => {
    const query = `
      INSERT INTO appointment (jmo_id, patient_id, mlef_id, appointment_date, remarks)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const values = [jmoId, appointmentData.patient_id, appointmentData.mlef_id, appointmentData.appointment_date, appointmentData.remarks];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const updateAppointment = async (appointmentId, updateData) => {
  const fields = [];
  const values = [];
  let idx = 1;
  Object.keys(updateData).forEach(key => {
    fields.push(`${key} = $${idx++}`);
    values.push(updateData[key]);
  });
  if (fields.length === 0) return null;
  values.push(appointmentId);
  const query = `UPDATE appointment SET ${fields.join(', ')} WHERE appointment_id = $${idx} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

// --- MODULE 14: Search ---
const search = async (jmoId, hospitalId, { query_text, date, limit, offset }) => {
  let query = `
    SELECT e.examination_id, p.first_name, p.last_name, p.nic, pc.case_number, e.examination_date
    FROM examination e
    JOIN mlef m ON e.mlef_id = m.mlef_id
    JOIN patient pt ON m.patient_id = pt.patient_id
    JOIN person p ON pt.person_id = p.person_id
    JOIN police_case pc ON m.case_id = pc.case_id
    WHERE (e.jmo_id = $1 OR m.hospital_id = $2)
  `;
  const values = [jmoId, hospitalId];
  let idx = 3;

  if (query_text) {
    query += ` AND (p.first_name ILIKE $${idx} OR p.last_name ILIKE $${idx} OR p.nic ILIKE $${idx} OR pc.case_number ILIKE $${idx})`;
    values.push(`%${query_text}%`);
    idx++;
  }
  
  if (date) {
    query += ` AND DATE(e.examination_date) = $${idx++}`;
    values.push(date);
  }
  
  // Pagination
  if (limit) {
    query += ` LIMIT $${idx++}`;
    values.push(limit);
  }
  if (offset) {
    query += ` OFFSET $${idx++}`;
    values.push(offset);
  }

  const result = await pool.query(query, values);
  return result.rows;
};

module.exports = {
  getJmoDataByUserId,
  getDashboardStats,
  getMlefRequests, getMlefById,
  getExaminations, createExamination, updateExamination,
  addVitals, updateVitals,
  getInjuries, createInjury, updateInjury,
  uploadInjuryPhoto, uploadBodyDiagram,
  getSpecimens, createSpecimen,
  getLabRequests, createLabRequest,
  getLabResults, getLabResultById,
  getReports, getReportById, createReport, updateReport, signReport,
  getAppointments, createAppointment, updateAppointment,
  search
};
