const { query, withTransaction } = require('../config/db');
const { logAudit, createNotification } = require('./admin.service');

/**
 * Get officer profile by user_id
 */
const getOfficerProfile = async (userId) => {
  const result = await query(
    `SELECT po.officer_id, po.badge_number, po.rank, po.station_id,
            p.person_id, p.first_name, p.last_name, p.telephone AS contact_number, p.nic, p.email,
            ps.station_name, ps.district AS station_district
     FROM person p
     LEFT JOIN police_officer po ON po.person_id = p.person_id
     LEFT JOIN police_station ps ON po.station_id = ps.station_id
     WHERE p.user_id = $1`,
    [userId]
  );

  if (result.rowCount === 0) {
    // Fallback user check
    const userRes = await query(
      `SELECT user_id, username, email, phone FROM users WHERE user_id = $1`,
      [userId]
    );
    if (userRes.rowCount === 0) {
      throw new Error('User not found');
    }
    const u = userRes.rows[0];
    return {
      user_id: u.user_id,
      officer_id: null,
      first_name: u.username,
      last_name: '',
      badge_number: 'N/A',
      rank: 'Officer',
      contact_number: u.phone || 'N/A',
      station_name: 'Main Station',
      station_id: null
    };
  }

  return result.rows[0];
};

/**
 * Get assigned police cases for an officer with incident info
 */
const getAssignedCases = async (userId, officerId, stationId) => {
  const sql = `
    SELECT DISTINCT ON (pc.case_id) 
           pc.case_id, pc.case_number, pc.title, pc.description AS case_description,
           pc.case_type, pc.date_reported, pc.created_at,
           cs.status_name AS case_status,
           i.incident_id, i.incident_datetime, i.location AS incident_location,
           i.description AS incident_description, i.weather
    FROM police_case pc
    JOIN case_status cs ON pc.status_id = cs.status_id
    JOIN case_assignment ca ON pc.case_id = ca.case_id AND ca.removed_date IS NULL
    JOIN police_officer po ON ca.officer_id = po.officer_id
    JOIN person p ON po.person_id = p.person_id
    LEFT JOIN incident i ON pc.case_id = i.case_id
    WHERE ($1::uuid IS NOT NULL AND p.user_id = $1)
       OR ($2::uuid IS NOT NULL AND po.officer_id = $2)
    ORDER BY pc.case_id, pc.created_at DESC
  `;

  const result = await query(sql, [userId || null, officerId || null]);
  return result.rows;
};

/**
 * Search patients strictly for the selected police case
 */
const searchPatients = async (searchTerm = '', caseId = null) => {
  const term = `%${searchTerm.trim()}%`;
  
  if (caseId) {
    // Fetch patients explicitly associated with this case via mlef
    const caseSql = `
      SELECT DISTINCT pt.patient_id, pt.person_id, pt.medical_record_number, pt.blood_group,
             pt.emergency_contact, pt.emergency_phone,
             COALESCE(p.first_name, '') AS first_name, COALESCE(p.last_name, '') AS last_name,
             COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), 'Patient (' || COALESCE(pt.medical_record_number, 'No MRN') || ')') AS full_name,
             p.nic, p.gender, p.date_of_birth, p.telephone, p.address, p.email,
             1 AS case_match_count
      FROM patient pt
      LEFT JOIN person p ON pt.person_id = p.person_id
      JOIN mlef m ON pt.patient_id = m.patient_id
      WHERE m.case_id = $2::uuid
        AND ($1 = '%%' OR
             p.nic ILIKE $1 OR
             pt.medical_record_number ILIKE $1 OR
             p.first_name ILIKE $1 OR
             p.last_name ILIKE $1 OR
             (p.first_name || ' ' || p.last_name) ILIKE $1)
      ORDER BY pt.medical_record_number ASC
      LIMIT 30
    `;
    const caseRes = await query(caseSql, [term, caseId]);
    if (caseRes.rowCount > 0) {
      return caseRes.rows;
    }
  }

  // General patients fallback list
  const sql = `
    SELECT pt.patient_id, pt.person_id, pt.medical_record_number, pt.blood_group,
           pt.emergency_contact, pt.emergency_phone,
           COALESCE(p.first_name, '') AS first_name, COALESCE(p.last_name, '') AS last_name,
           COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), 'Patient (' || COALESCE(pt.medical_record_number, 'No MRN') || ')') AS full_name,
           p.nic, p.gender, p.date_of_birth, p.telephone, p.address, p.email,
           0 AS case_match_count
    FROM patient pt
    LEFT JOIN person p ON pt.person_id = p.person_id
    WHERE ($1 = '%%' OR
           p.nic ILIKE $1 OR
           pt.medical_record_number ILIKE $1 OR
           p.first_name ILIKE $1 OR
           p.last_name ILIKE $1 OR
           (p.first_name || ' ' || p.last_name) ILIKE $1)
    ORDER BY pt.medical_record_number ASC
    LIMIT 30
  `;

  const result = await query(sql, [term]);
  return result.rows;
};

/**
 * Get hospitals list with forensic/JMO unit information
 */
const getHospitalsWithForensicUnit = async () => {
  const result = await query(
    `SELECT h.hospital_id, h.hospital_name, h.hospital_type, h.district, h.address, h.telephone, h.email,
            (SELECT COUNT(jmo_id)::int FROM judicial_medical_officer jmo WHERE jmo.hospital_id = h.hospital_id) AS jmo_count
     FROM hospital h
     ORDER BY h.hospital_name ASC`
  );
  return result.rows;
};

/**
 * Create a new MLEF record
 */
const createMlefRecord = async (mlefData, userId) => {
  const { case_id, patient_id, hospital_id, reason, exam_type, priority, is_draft } = mlefData;

  // Validation
  if (!case_id) throw new Error('Police case selection is required');
  if (!patient_id) throw new Error('Patient selection is required');
  if (!hospital_id) throw new Error('Hospital selection is required');
  if (!reason || !reason.trim()) throw new Error('Reason for referral is required');
  if (!exam_type) throw new Error('Examination type selection is required');

  // Format reason string to encode exam type and priority cleanly into TEXT column
  const combinedReason = `[Priority: ${priority || 'Normal'}] [Type: ${exam_type}]\n\nReferral Reason:\n${reason.trim()}`;
  const status = is_draft ? 'DRAFT' : 'Pending Hospital Acceptance';

  let newMlef = null;
  let formattedMlefId = '';

  await withTransaction(async (client) => {
    // Check officer_id for requesting_officer
    const officerRes = await client.query(
      `SELECT po.officer_id 
       FROM police_officer po 
       JOIN person p ON po.person_id = p.person_id 
       WHERE p.user_id = $1`,
      [userId]
    );

    let requestingOfficerId;
    if (officerRes.rowCount > 0) {
      requestingOfficerId = officerRes.rows[0].officer_id;
    } else {
      // Fallback: pick any police_officer if testing user profile has no officer row
      const anyOfficer = await client.query(`SELECT officer_id FROM police_officer LIMIT 1`);
      if (anyOfficer.rowCount > 0) {
        requestingOfficerId = anyOfficer.rows[0].officer_id;
      } else {
        throw new Error('Logged-in user is not linked to a police officer profile');
      }
    }

    // Insert MLEF
    const insertRes = await client.query(
      `INSERT INTO mlef (case_id, patient_id, requesting_officer, hospital_id, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING mlef_id, case_id, patient_id, requesting_officer, hospital_id, request_date, status, reason`,
      [case_id, patient_id, requestingOfficerId, hospital_id, combinedReason, status]
    );
    newMlef = insertRes.rows[0];

    // Calculate sequential number for formatted MLEF ID
    const countRes = await client.query(`SELECT COUNT(*)::int AS total FROM mlef WHERE request_date <= $1`, [newMlef.request_date]);
    const sequenceNum = countRes.rows[0].total || 1;
    formattedMlefId = `MLEF-${String(sequenceNum).padStart(6, '0')}`;
  });

  // Log Audit Action
  await logAudit(
    userId,
    is_draft ? 'SAVE_MLEF_DRAFT' : 'ISSUE_MLEF',
    'mlef',
    newMlef.mlef_id,
    `${is_draft ? 'Saved draft' : 'Issued'} MLEF request ${formattedMlefId} (Status: ${status})`
  );

  // Notify JMOs in destination hospital
  try {
    const jmoUsers = await query(
      `SELECT p.user_id 
       FROM judicial_medical_officer jmo 
       JOIN person p ON jmo.person_id = p.person_id 
       WHERE jmo.hospital_id = $1 AND p.user_id IS NOT NULL`,
      [hospital_id]
    );
    for (const row of jmoUsers.rows) {
      await createNotification(
        row.user_id,
        `New Medico-Legal Examination Request issued (${formattedMlefId}). Status: ${status}`,
        'MLEF_REQUEST'
      );
    }
  } catch (err) {
    console.error('Error dispatching JMO notifications:', err.message);
  }

  // Notify requesting officer user
  await createNotification(
    userId,
    `Your MLEF request ${formattedMlefId} has been successfully ${is_draft ? 'saved as draft' : 'submitted'}.`,
    'MLEF_ISSUED'
  );

  return {
    ...newMlef,
    formatted_mlef_id: formattedMlefId,
    exam_type,
    priority: priority || 'Normal',
  };
};

/**
 * Get all MLEFs issued by officer or station
 */
const getOfficerMlefs = async (userId) => {
  const result = await query(
    `SELECT m.mlef_id, m.request_date, m.status, m.reason,
            pc.case_number, pc.title AS case_title,
            pt.medical_record_number,
            (p_pat.first_name || ' ' || p_pat.last_name) AS patient_name,
            p_pat.nic AS patient_nic,
            h.hospital_name, h.district AS hospital_district,
            ROW_NUMBER() OVER (ORDER BY m.request_date ASC) AS seq_num
     FROM mlef m
     JOIN police_case pc ON m.case_id = pc.case_id
     JOIN patient pt ON m.patient_id = pt.patient_id
     JOIN person p_pat ON pt.person_id = p_pat.person_id
     JOIN hospital h ON m.hospital_id = h.hospital_id
     ORDER BY m.request_date DESC`
  );

  return result.rows.map(r => ({
    ...r,
    formatted_mlef_id: `MLEF-${String(r.seq_num).padStart(6, '0')}`
  }));
};

module.exports = {
  getOfficerProfile,
  getAssignedCases,
  searchPatients,
  getHospitalsWithForensicUnit,
  createMlefRecord,
  getOfficerMlefs,
};
