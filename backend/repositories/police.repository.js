const pool = require('../database/connection');

// --- AUDIT LOG ---
const logActivity = async (client, userId, action, entityName, entityId, description) => {
  const query = `
    INSERT INTO audit_logs (user_id, action, entity_name, entity_id, description)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await client.query(query, [userId, action, entityName, entityId, description]);
};

const addCaseActivity = async (client, caseId, userId, activityType, description) => {
  const query = `
    INSERT INTO case_activity (case_id, user_id, activity_type, description)
    VALUES ($1, $2, $3, $4)
  `;
  await client.query(query, [caseId, userId, activityType, description]);
};

// --- MODULE 1: Dashboard ---
const getDashboardStats = async (officerId) => {
  // get total cases, open cases, closed cases assigned to officer
  // pending mlef, completed mlef
  // total evidence
  // pending lab results
  const query = `
    WITH officer_cases AS (
      SELECT case_id FROM case_assignment WHERE officer_id = $1 AND removed_date IS NULL
    )
    SELECT
      (SELECT COUNT(*) FROM officer_cases) AS total_assigned_cases,
      (SELECT COUNT(*) FROM police_case pc JOIN officer_cases oc ON pc.case_id = oc.case_id JOIN case_status cs ON pc.status_id = cs.status_id WHERE cs.status_name = 'OPEN') AS open_cases,
      (SELECT COUNT(*) FROM police_case pc JOIN officer_cases oc ON pc.case_id = oc.case_id JOIN case_status cs ON pc.status_id = cs.status_id WHERE cs.status_name = 'CLOSED') AS closed_cases,
      (SELECT COUNT(*) FROM mlef m JOIN officer_cases oc ON m.case_id = oc.case_id WHERE m.status = 'PENDING') AS pending_mlef_requests,
      (SELECT COUNT(*) FROM mlef m JOIN officer_cases oc ON m.case_id = oc.case_id WHERE m.status = 'COMPLETED') AS completed_mlef_requests,
      (SELECT COUNT(*) FROM evidence e JOIN officer_cases oc ON e.case_id = oc.case_id) AS total_evidence_items,
      (SELECT COUNT(*) FROM laboratory_request lr JOIN specimen s ON lr.specimen_id = s.specimen_id JOIN examination ex ON s.examination_id = ex.examination_id JOIN mlef m ON ex.mlef_id = m.mlef_id JOIN officer_cases oc ON m.case_id = oc.case_id WHERE lr.status = 'PENDING') AS pending_laboratory_results
  `;
  const result = await pool.query(query, [officerId]);
  
  const recentActivitiesQuery = `
    SELECT ca.activity_id, ca.activity_type, ca.description, ca.activity_time
    FROM case_activity ca
    JOIN case_assignment asgn ON ca.case_id = asgn.case_id
    WHERE asgn.officer_id = $1 AND asgn.removed_date IS NULL
    ORDER BY ca.activity_time DESC
    LIMIT 10
  `;
  const recentActivitiesResult = await pool.query(recentActivitiesQuery, [officerId]);
  
  return {
    stats: result.rows[0],
    recentActivities: recentActivitiesResult.rows
  };
};

// --- MODULE 2: Police Case Management ---
const createCase = async (caseData, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Default status: OPEN
    const statusQuery = `SELECT status_id FROM case_status WHERE status_name = 'OPEN'`;
    const statusResult = await client.query(statusQuery);
    if(statusResult.rows.length === 0) throw new Error("OPEN status not found in database.");
    const statusId = statusResult.rows[0].status_id;

    const query = `
      INSERT INTO police_case (station_id, status_id, case_number, case_type, title, description, date_reported)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const values = [caseData.station_id, statusId, caseData.case_number, caseData.case_type, caseData.title, caseData.description, caseData.date_reported];
    const result = await client.query(query, values);
    const newCase = result.rows[0];

    await logActivity(client, userId, 'Case Created', 'police_case', newCase.case_id, `Case ${newCase.case_number} created.`);
    await addCaseActivity(client, newCase.case_id, userId, 'Case Created', 'Case registered in the system.');

    await client.query('COMMIT');
    return newCase;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getCases = async (officerId, filters) => {
  let query = `
    SELECT pc.*, cs.status_name 
    FROM police_case pc
    JOIN case_status cs ON pc.status_id = cs.status_id
    JOIN case_assignment ca ON pc.case_id = ca.case_id
    WHERE ca.officer_id = $1 AND ca.removed_date IS NULL
  `;
  const values = [officerId];
  let idx = 2;

  if (filters.status) {
    query += ` AND cs.status_name = $${idx++}`;
    values.push(filters.status);
  }
  if (filters.case_type) {
    query += ` AND pc.case_type = $${idx++}`;
    values.push(filters.case_type);
  }
  if (filters.station_id) {
    query += ` AND pc.station_id = $${idx++}`;
    values.push(filters.station_id);
  }
  if (filters.date) {
    query += ` AND DATE(pc.date_reported) = $${idx++}`;
    values.push(filters.date);
  }

  query += ` ORDER BY pc.created_at DESC`;
  
  const result = await pool.query(query, values);
  return result.rows;
};

const getCaseById = async (caseId) => {
  const query = `
    SELECT pc.*, cs.status_name 
    FROM police_case pc
    JOIN case_status cs ON pc.status_id = cs.status_id
    WHERE pc.case_id = $1
  `;
  const result = await pool.query(query, [caseId]);
  return result.rows[0];
};

const updateCase = async (caseId, updateData, userId) => {
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

    values.push(caseId);
    const query = `
      UPDATE police_case 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE case_id = $${idx} 
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    const updatedCase = result.rows[0];

    await logActivity(client, userId, 'Case Updated', 'police_case', caseId, `Case updated.`);
    await addCaseActivity(client, caseId, userId, 'Case Updated', 'Case information was updated.');

    await client.query('COMMIT');
    return updatedCase;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 3: Case Assignment ---
const assignOfficer = async (caseId, officerId, role, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if duplicate assignment exists
    const checkQuery = `SELECT * FROM case_assignment WHERE case_id = $1 AND officer_id = $2 AND removed_date IS NULL`;
    const checkResult = await client.query(checkQuery, [caseId, officerId]);
    if (checkResult.rows.length > 0) {
      throw new Error("Officer is already assigned to this case.");
    }

    const query = `
      INSERT INTO case_assignment (case_id, officer_id, assignment_role)
      VALUES ($1, $2, $3) RETURNING *
    `;
    const result = await client.query(query, [caseId, officerId, role]);
    
    await logActivity(client, userId, 'Officer Assignment', 'case_assignment', result.rows[0].assignment_id, `Officer assigned to case.`);
    await addCaseActivity(client, caseId, userId, 'Officer Assigned', `An officer was assigned to the case as ${role || 'Supporting Officer'}.`);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getCaseOfficers = async (caseId) => {
  const query = `
    SELECT ca.assignment_id, ca.assignment_role, ca.assigned_date, po.badge_number, po.rank, p.first_name, p.last_name
    FROM case_assignment ca
    JOIN police_officer po ON ca.officer_id = po.officer_id
    JOIN person p ON po.person_id = p.person_id
    WHERE ca.case_id = $1 AND ca.removed_date IS NULL
  `;
  const result = await pool.query(query, [caseId]);
  return result.rows;
};

// --- MODULE 4: Incident Management ---
const getIncidents = async (caseId) => {
  const query = `SELECT * FROM incident WHERE case_id = $1 ORDER BY incident_datetime DESC`;
  const result = await pool.query(query, [caseId]);
  return result.rows;
};

const createIncident = async (caseId, incidentData, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query = `
      INSERT INTO incident (case_id, incident_datetime, location, description, weather)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const result = await client.query(query, [caseId, incidentData.incident_datetime, incidentData.location, incidentData.description, incidentData.weather]);
    const incident = result.rows[0];

    if (incidentData.involved_persons && incidentData.involved_persons.length > 0) {
      for (const person of incidentData.involved_persons) {
        await client.query(
          `INSERT INTO incident_person (incident_id, person_id, role) VALUES ($1, $2, $3)`,
          [incident.incident_id, person.person_id, person.role]
        );
      }
    }

    await logActivity(client, userId, 'Incident Added', 'incident', incident.incident_id, `Incident logged.`);
    await addCaseActivity(client, caseId, userId, 'Incident Added', 'A new incident detail was added to the case.');

    await client.query('COMMIT');
    return incident;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateIncident = async (incidentId, incidentData) => {
  const fields = [];
  const values = [];
  let idx = 1;

  Object.keys(incidentData).forEach(key => {
    fields.push(`${key} = $${idx++}`);
    values.push(incidentData[key]);
  });

  if (fields.length === 0) return null;

  values.push(incidentId);
  const query = `
    UPDATE incident 
    SET ${fields.join(', ')} 
    WHERE incident_id = $${idx} 
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

// --- MODULE 5: Evidence Management ---
const getEvidence = async (caseId) => {
  const query = `SELECT * FROM evidence WHERE case_id = $1 ORDER BY collected_date DESC`;
  const result = await pool.query(query, [caseId]);
  return result.rows;
};

const createEvidence = async (caseId, evidenceData, officerId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query = `
      INSERT INTO evidence (case_id, evidence_type, description, collected_by, collected_date, current_status)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `;
    const values = [caseId, evidenceData.evidence_type, evidenceData.description, officerId, evidenceData.collected_date, evidenceData.current_status || 'COLLECTED'];
    const result = await client.query(query, values);
    const newEvidence = result.rows[0];

    // Initial chain of custody record
    const custodyQuery = `INSERT INTO chain_of_custody (evidence_id, transfer_reason) VALUES ($1, $2) RETURNING custody_id`;
    const custodyResult = await client.query(custodyQuery, [newEvidence.evidence_id, 'Initial Collection']);
    
    await client.query(`INSERT INTO evidence_transfer (custody_id, to_user, remarks) VALUES ($1, $2, $3)`, [custodyResult.rows[0].custody_id, userId, 'Collected at scene']);

    await logActivity(client, userId, 'Evidence Added', 'evidence', newEvidence.evidence_id, `Evidence item added.`);
    await addCaseActivity(client, caseId, userId, 'Evidence Added', `Evidence (${evidenceData.evidence_type}) collected.`);

    await client.query('COMMIT');
    return newEvidence;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateEvidence = async (evidenceId, evidenceData) => {
  const fields = [];
  const values = [];
  let idx = 1;

  Object.keys(evidenceData).forEach(key => {
    fields.push(`${key} = $${idx++}`);
    values.push(evidenceData[key]);
  });

  if (fields.length === 0) return null;

  values.push(evidenceId);
  const query = `
    UPDATE evidence 
    SET ${fields.join(', ')} 
    WHERE evidence_id = $${idx} 
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

// --- MODULE 6: Evidence Photos ---
const addEvidencePhoto = async (evidenceId, filePath, userId, description) => {
  const query = `
    INSERT INTO evidence_photo (evidence_id, file_path, uploaded_by, description)
    VALUES ($1, $2, $3, $4) RETURNING *
  `;
  const result = await pool.query(query, [evidenceId, filePath, userId, description]);
  return result.rows[0];
};

// --- MODULE 7: Chain of Custody ---
const getChainOfCustody = async (evidenceId) => {
  const query = `
    SELECT coc.transfer_reason, coc.created_at as custody_created_at,
           et.transfer_datetime, et.remarks,
           u_from.username as from_user, u_to.username as to_user,
           es.storage_name
    FROM chain_of_custody coc
    JOIN evidence_transfer et ON coc.custody_id = et.custody_id
    LEFT JOIN users u_from ON et.from_user = u_from.user_id
    LEFT JOIN users u_to ON et.to_user = u_to.user_id
    LEFT JOIN evidence_storage es ON et.storage_id = es.storage_id
    WHERE coc.evidence_id = $1
    ORDER BY et.transfer_datetime DESC
  `;
  const result = await pool.query(query, [evidenceId]);
  return result.rows;
};

const transferEvidence = async (evidenceId, transferData, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create new chain_of_custody record
    const custodyQuery = `INSERT INTO chain_of_custody (evidence_id, transfer_reason) VALUES ($1, $2) RETURNING custody_id`;
    const custodyResult = await client.query(custodyQuery, [evidenceId, transferData.purpose]);
    const custodyId = custodyResult.rows[0].custody_id;

    const transferQuery = `
      INSERT INTO evidence_transfer (custody_id, from_user, to_user, storage_id, remarks)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const result = await client.query(transferQuery, [custodyId, userId, transferData.to_user, transferData.storage_id, transferData.remarks]);
    
    await logActivity(client, userId, 'Evidence Transfer', 'evidence_transfer', result.rows[0].transfer_id, `Evidence transferred.`);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 8: MLEF Requests ---
const getMlefRequests = async (officerId) => {
  const query = `
    SELECT m.* 
    FROM mlef m
    JOIN case_assignment ca ON m.case_id = ca.case_id
    WHERE ca.officer_id = $1 AND ca.removed_date IS NULL
    ORDER BY m.request_date DESC
  `;
  const result = await pool.query(query, [officerId]);
  return result.rows;
};

const getMlefById = async (mlefId) => {
  const query = `SELECT * FROM mlef WHERE mlef_id = $1`;
  const result = await pool.query(query, [mlefId]);
  return result.rows[0];
};

const createMlefRequest = async (mlefData, officerId, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query = `
      INSERT INTO mlef (case_id, patient_id, requesting_officer, hospital_id, reason, status)
      VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *
    `;
    const values = [mlefData.case_id, mlefData.patient_id, officerId, mlefData.hospital_id, mlefData.reason];
    const result = await client.query(query, values);
    const newMlef = result.rows[0];

    await logActivity(client, userId, 'MLEF Created', 'mlef', newMlef.mlef_id, `MLEF request created.`);
    await addCaseActivity(client, mlefData.case_id, userId, 'MLEF Requested', 'Medico-legal examination requested.');

    await client.query('COMMIT');
    return newMlef;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// --- MODULE 9: Case Timeline ---
const getCaseTimeline = async (caseId) => {
  const query = `
    SELECT ca.activity_id, ca.activity_type, ca.description, ca.activity_time, u.username
    FROM case_activity ca
    LEFT JOIN users u ON ca.user_id = u.user_id
    WHERE ca.case_id = $1
    ORDER BY ca.activity_time ASC
  `;
  const result = await pool.query(query, [caseId]);
  return result.rows;
};

// --- MODULE 10: Search ---
const search = async (officerId, { case_number, patient_name, nic, station_id, date, limit, offset }) => {
  // Building dynamic search query
  let query = `
    SELECT DISTINCT pc.case_id, pc.case_number, pc.date_reported, cs.status_name, ps.station_name
    FROM police_case pc
    JOIN case_status cs ON pc.status_id = cs.status_id
    JOIN case_assignment ca ON pc.case_id = ca.case_id
    JOIN police_station ps ON pc.station_id = ps.station_id
    LEFT JOIN mlef m ON pc.case_id = m.case_id
    LEFT JOIN patient pt ON m.patient_id = pt.patient_id
    LEFT JOIN person p ON pt.person_id = p.person_id
    WHERE ca.officer_id = $1 AND ca.removed_date IS NULL
  `;
  
  const values = [officerId];
  let idx = 2;

  if (case_number) {
    query += ` AND pc.case_number ILIKE $${idx++}`;
    values.push(`%${case_number}%`);
  }
  if (patient_name) {
    query += ` AND (p.first_name ILIKE $${idx} OR p.last_name ILIKE $${idx++})`;
    values.push(`%${patient_name}%`);
  }
  if (nic) {
    query += ` AND p.nic ILIKE $${idx++}`;
    values.push(`%${nic}%`);
  }
  if (station_id) {
    query += ` AND pc.station_id = $${idx++}`;
    values.push(station_id);
  }
  if (date) {
    query += ` AND DATE(pc.date_reported) = $${idx++}`;
    values.push(date);
  }

  query += ` ORDER BY pc.date_reported DESC`;
  
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

// General helper to map User to Police Officer
const getOfficerIdByUserId = async (userId) => {
  const query = `
    SELECT po.officer_id 
    FROM police_officer po
    JOIN person p ON po.person_id = p.person_id
    WHERE p.user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0]?.officer_id;
};


// --- MODULE 12: Reports Status ---
const getReportsStatus = async (officerId) => {
  const mlefQuery = `
    SELECT m.mlef_id as id, 'MLEF (H.886)' as request_type, m.request_date, m.status as jmo_status, pc.case_number
    FROM mlef m
    JOIN case_assignment ca ON m.case_id = ca.case_id
    JOIN police_case pc ON m.case_id = pc.case_id
    WHERE ca.officer_id = $1 AND ca.removed_date IS NULL
  `;
  const mlefResult = await pool.query(mlefQuery, [officerId]);
  return mlefResult.rows;
};

module.exports = {
  getDashboardStats,
  createCase, getCases, getCaseById, updateCase,
  assignOfficer, getCaseOfficers,
  getIncidents, createIncident, updateIncident,
  getEvidence, createEvidence, updateEvidence,
  addEvidencePhoto,
  getChainOfCustody, transferEvidence,
  getMlefRequests, getMlefById, createMlefRequest,
  getCaseTimeline,
  search,
  getOfficerIdByUserId,
  getReportsStatus
};
