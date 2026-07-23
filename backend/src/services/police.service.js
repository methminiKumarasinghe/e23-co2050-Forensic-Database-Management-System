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
 * Get Police Dashboard Stats
 */
const getPoliceDashboardStats = async (userId) => {
  const profile = await getOfficerProfile(userId);
  const officerId = profile.officer_id;

  // 1. Assigned cases count
  const assignedCasesRes = await query(
    `SELECT COUNT(DISTINCT pc.case_id)::int AS count
     FROM police_case pc
     JOIN case_assignment ca ON pc.case_id = ca.case_id AND ca.removed_date IS NULL
     JOIN police_officer po ON ca.officer_id = po.officer_id
     JOIN person p ON po.person_id = p.person_id
     WHERE p.user_id = $1 OR ($2::uuid IS NOT NULL AND po.officer_id = $2)`,
    [userId, officerId]
  );

  // 2. Open cases count
  const openCasesRes = await query(
    `SELECT COUNT(DISTINCT pc.case_id)::int AS count
     FROM police_case pc
     JOIN case_status cs ON pc.status_id = cs.status_id
     JOIN case_assignment ca ON pc.case_id = ca.case_id AND ca.removed_date IS NULL
     JOIN police_officer po ON ca.officer_id = po.officer_id
     JOIN person p ON po.person_id = p.person_id
     WHERE (p.user_id = $1 OR ($2::uuid IS NOT NULL AND po.officer_id = $2))
       AND cs.status_name IN ('OPEN', 'UNDER_INVESTIGATION', 'AWAITING_EXAMINATION')`,
    [userId, officerId]
  );

  // 3. Pending MLEF count
  const pendingMlefRes = await query(
    `SELECT COUNT(DISTINCT m.mlef_id)::int AS count
     FROM mlef m
     JOIN police_case pc ON m.case_id = pc.case_id
     LEFT JOIN police_officer po_req ON m.requesting_officer = po_req.officer_id
     LEFT JOIN person p_req ON po_req.person_id = p_req.person_id
     LEFT JOIN case_assignment ca ON pc.case_id = ca.case_id AND ca.removed_date IS NULL
     LEFT JOIN police_officer po_assigned ON ca.officer_id = po_assigned.officer_id
     LEFT JOIN person p_assigned ON po_assigned.person_id = p_assigned.person_id
     WHERE (($1::uuid IS NOT NULL AND (p_req.user_id = $1 OR p_assigned.user_id = $1))
        OR ($2::uuid IS NOT NULL AND (m.requesting_officer = $2 OR ca.officer_id = $2)))
       AND m.status IN ('PENDING', 'Pending Hospital Acceptance')`,
    [userId || null, officerId || null]
  );

  // 4. Evidence count
  const evidenceRes = await query(
    `SELECT COUNT(ev.evidence_id)::int AS count
     FROM evidence ev
     JOIN police_case pc ON ev.case_id = pc.case_id
     JOIN case_assignment ca ON pc.case_id = ca.case_id AND ca.removed_date IS NULL
     JOIN police_officer po ON ca.officer_id = po.officer_id
     JOIN person p ON po.person_id = p.person_id
     WHERE p.user_id = $1 OR ($2::uuid IS NOT NULL AND po.officer_id = $2)`,
    [userId, officerId]
  );

  return {
    assignedCases: assignedCasesRes.rows[0]?.count || 0,
    openCases: openCasesRes.rows[0]?.count || 0,
    pendingMlef: pendingMlefRes.rows[0]?.count || 0,
    evidenceCount: evidenceRes.rows[0]?.count || 0,
  };
};

/**
 * Get assigned police cases strictly for the logged-in officer
 */
const getAssignedCases = async (userId, officerId, stationId) => {
  const sql = `
    SELECT DISTINCT ON (pc.case_id) 
           pc.case_id, pc.case_number, pc.title, pc.description AS case_description,
           pc.case_type, pc.date_reported, pc.created_at, pc.station_id,
           cs.status_id, cs.status_name AS case_status,
           i.incident_id, i.incident_datetime, i.location AS incident_location,
           i.description AS incident_description, i.weather,
           (SELECT COUNT(e.evidence_id)::int FROM evidence e WHERE e.case_id = pc.case_id) AS evidence_count,
           (SELECT COUNT(m.mlef_id)::int FROM mlef m WHERE m.case_id = pc.case_id) AS mlef_count
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

  let result = await query(sql, [userId || null, officerId || null]);

  // Fallback: If zero cases assigned directly to officer, show station cases as fallback for unassigned test accounts
  if (result.rowCount === 0 && stationId) {
    const stationSql = `
      SELECT DISTINCT ON (pc.case_id) 
             pc.case_id, pc.case_number, pc.title, pc.description AS case_description,
             pc.case_type, pc.date_reported, pc.created_at, pc.station_id,
             cs.status_id, cs.status_name AS case_status,
             i.incident_id, i.incident_datetime, i.location AS incident_location,
             i.description AS incident_description, i.weather,
             (SELECT COUNT(e.evidence_id)::int FROM evidence e WHERE e.case_id = pc.case_id) AS evidence_count,
             (SELECT COUNT(m.mlef_id)::int FROM mlef m WHERE m.case_id = pc.case_id) AS mlef_count
      FROM police_case pc
      JOIN case_status cs ON pc.status_id = cs.status_id
      LEFT JOIN incident i ON pc.case_id = i.case_id
      WHERE pc.station_id = $1
      ORDER BY pc.case_id, pc.created_at DESC
    `;
    result = await query(stationSql, [stationId]);
  }

  return result.rows;
};

/**
 * Create a new Police Case and Incident
 */
const createPoliceCase = async (caseData, userId) => {
  const { title, description, case_type, date_reported, incident_location, incident_datetime, incident_description, weather } = caseData;

  if (!title || !title.trim()) throw new Error('Case title is required');
  if (!case_type) throw new Error('Case type is required');

  const profile = await getOfficerProfile(userId);
  let stationId = profile.station_id;

  if (!stationId) {
    const stationRes = await query(`SELECT station_id FROM police_station LIMIT 1`);
    stationId = stationRes.rows[0]?.station_id;
    if (!stationId) throw new Error('No active police station found in system');
  }

  // Generate unique case number
  const countRes = await query(`SELECT COUNT(*)::int AS count FROM police_case`);
  const seq = (countRes.rows[0].count || 0) + 1;
  const caseNumber = `PC-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

  let createdCase = null;

  await withTransaction(async (client) => {
    // 1. Insert Police Case (status_id = 1 => 'OPEN')
    const caseRes = await client.query(
      `INSERT INTO police_case (station_id, status_id, case_number, case_type, title, description, date_reported)
       VALUES ($1, 1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [stationId, caseNumber, case_type, title.trim(), description || '', date_reported || new Date()]
    );
    createdCase = caseRes.rows[0];

    // 2. Insert Incident Details
    if (incident_location || incident_datetime || incident_description) {
      await client.query(
        `INSERT INTO incident (case_id, incident_datetime, location, description, weather)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          createdCase.case_id,
          incident_datetime || date_reported || new Date(),
          incident_location || '',
          incident_description || description || '',
          weather || 'Normal',
        ]
      );
    }

    // 3. Assign Reporting Officer if profile exists
    if (profile.officer_id) {
      await client.query(
        `INSERT INTO case_assignment (case_id, officer_id, assignment_role)
         VALUES ($1, $2, 'PRIMARY_INVESTIGATOR')`,
        [createdCase.case_id, profile.officer_id]
      );
    }

    // 4. Log Case Activity
    await client.query(
      `INSERT INTO case_activity (case_id, user_id, activity_type, description)
       VALUES ($1, $2, 'CASE_CREATED', $3)`,
      [createdCase.case_id, userId, `Case ${caseNumber} created: ${title.trim()}`]
    );
  });

  await logAudit(userId, 'CREATE_CASE', 'police_case', createdCase.case_id, `Created police case ${caseNumber}`);

  return createdCase;
};

/**
 * Register a new Patient
 */
const registerPatient = async (patientData, userId) => {
  const {
    first_name, last_name, nic, gender, date_of_birth, telephone, address, email,
    blood_group, medical_record_number, emergency_contact, emergency_phone
  } = patientData;

  if (!first_name || !first_name.trim()) throw new Error('Patient first name is required');
  if (!last_name || !last_name.trim()) throw new Error('Patient last name is required');

  // Auto-generate MRN if not provided
  let mrn = medical_record_number;
  if (!mrn || !mrn.trim()) {
    const countRes = await query(`SELECT COUNT(*)::int AS count FROM patient`);
    mrn = `MRN-${new Date().getFullYear()}-${String(countRes.rows[0].count + 1).padStart(5, '0')}`;
  }

  let createdPatient = null;

  await withTransaction(async (client) => {
    // 1. Insert Person
    const personRes = await client.query(
      `INSERT INTO person (first_name, last_name, nic, gender, date_of_birth, telephone, address, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        first_name.trim(),
        last_name.trim(),
        nic ? nic.trim() : null,
        gender || null,
        date_of_birth || null,
        telephone ? telephone.trim() : null,
        address ? address.trim() : null,
        email ? email.trim() : null
      ]
    );
    const person = personRes.rows[0];

    // 2. Insert Patient
    const patientRes = await client.query(
      `INSERT INTO patient (person_id, blood_group, medical_record_number, emergency_contact, emergency_phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        person.person_id,
        blood_group || null,
        mrn,
        emergency_contact || null,
        emergency_phone || null
      ]
    );
    createdPatient = {
      ...patientRes.rows[0],
      first_name: person.first_name,
      last_name: person.last_name,
      full_name: `${person.first_name} ${person.last_name}`,
      nic: person.nic,
      gender: person.gender,
      telephone: person.telephone
    };
  });

  await logAudit(userId, 'REGISTER_PATIENT', 'patient', createdPatient.patient_id, `Registered patient ${createdPatient.full_name} (${mrn})`);

  return createdPatient;
};

/**
 * Search patients
 */
const searchPatients = async (searchTerm = '', caseId = null, userId = null) => {
  const term = `%${searchTerm.trim()}%`;
  let officerId = null;

  if (userId) {
    const profile = await getOfficerProfile(userId);
    officerId = profile?.officer_id || null;
  }
  
  if (caseId) {
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

  const sql = `
    SELECT DISTINCT pt.patient_id, pt.person_id, pt.medical_record_number, pt.blood_group,
           pt.emergency_contact, pt.emergency_phone,
           COALESCE(p.first_name, '') AS first_name, COALESCE(p.last_name, '') AS last_name,
           COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), 'Patient (' || COALESCE(pt.medical_record_number, 'No MRN') || ')') AS full_name,
           p.nic, p.gender, p.date_of_birth, p.telephone, p.address, p.email,
           0 AS case_match_count
    FROM patient pt
    LEFT JOIN person p ON pt.person_id = p.person_id
    LEFT JOIN mlef m ON pt.patient_id = m.patient_id
    LEFT JOIN police_case pc ON m.case_id = pc.case_id
    LEFT JOIN police_officer po_req ON m.requesting_officer = po_req.officer_id
    LEFT JOIN person p_req ON po_req.person_id = p_req.person_id
    LEFT JOIN case_assignment ca ON pc.case_id = ca.case_id AND ca.removed_date IS NULL
    LEFT JOIN police_officer po_assigned ON ca.officer_id = po_assigned.officer_id
    LEFT JOIN person p_assigned ON po_assigned.person_id = p_assigned.person_id
    WHERE ($1 = '%%' OR
           p.nic ILIKE $1 OR
           pt.medical_record_number ILIKE $1 OR
           p.first_name ILIKE $1 OR
           p.last_name ILIKE $1 OR
           (p.first_name || ' ' || p.last_name) ILIKE $1)
      AND ($2::uuid IS NULL OR (
        ($2::uuid IS NOT NULL AND (p_req.user_id = $2 OR p_assigned.user_id = $2))
        OR ($3::uuid IS NOT NULL AND (m.requesting_officer = $3 OR ca.officer_id = $3))
      ))
    ORDER BY pt.medical_record_number ASC
    LIMIT 30
  `;

  const result = await query(sql, [term, userId || null, officerId || null]);
  return result.rows;
};

/**
 * Get Hospitals List
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
 * Create MLEF Record
 */
const createMlefRecord = async (mlefData, userId) => {
  const { case_id, patient_id, hospital_id, reason, exam_type, priority, is_draft } = mlefData;

  if (!case_id) throw new Error('Police case selection is required');
  if (!patient_id) throw new Error('Patient selection is required');
  if (!hospital_id) throw new Error('Hospital selection is required');
  if (!reason || !reason.trim()) throw new Error('Reason for referral is required');
  if (!exam_type) throw new Error('Examination type selection is required');

  const combinedReason = `[Priority: ${priority || 'Normal'}] [Type: ${exam_type}]\n\nReferral Reason:\n${reason.trim()}`;
  const status = is_draft ? 'DRAFT' : 'Pending Hospital Acceptance';

  let newMlef = null;
  let formattedMlefId = '';

  await withTransaction(async (client) => {
    const officerRes = await client.query(
      `SELECT po.officer_id 
       FROM police_officer po 
       JOIN person p ON po.person_id = p.person_id 
       WHERE p.user_id = $1`,
      [userId]
    );

    let requestingOfficerId = null;
    if (officerRes.rowCount > 0) {
      requestingOfficerId = officerRes.rows[0].officer_id;
    }

    const insertRes = await client.query(
      `INSERT INTO mlef (case_id, patient_id, requesting_officer, hospital_id, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING mlef_id, case_id, patient_id, requesting_officer, hospital_id, request_date, status, reason`,
      [case_id, patient_id, requestingOfficerId, hospital_id, combinedReason, status]
    );
    newMlef = insertRes.rows[0];

    const countRes = await client.query(`SELECT COUNT(*)::int AS total FROM mlef WHERE request_date <= $1`, [newMlef.request_date]);
    const sequenceNum = countRes.rows[0].total || 1;
    formattedMlefId = `MLEF-${String(sequenceNum).padStart(6, '0')}`;

    // Log case activity
    await client.query(
      `INSERT INTO case_activity (case_id, user_id, activity_type, description)
       VALUES ($1, $2, 'MLEF_REQUISITION_ISSUED', $3)`,
      [case_id, userId, `Issued MLEF Requisition ${formattedMlefId}`]
    );
  });

  await logAudit(
    userId,
    is_draft ? 'SAVE_MLEF_DRAFT' : 'ISSUE_MLEF',
    'mlef',
    newMlef.mlef_id,
    `${is_draft ? 'Saved draft' : 'Issued'} MLEF request ${formattedMlefId} (Status: ${status})`
  );

  return {
    ...newMlef,
    formatted_mlef_id: formattedMlefId,
    exam_type,
    priority: priority || 'Normal',
  };
};

/**
 * Get Officer MLEFs strictly for cases assigned to or requested by the logged-in officer
 */
const getOfficerMlefs = async (userId) => {
  const profile = await getOfficerProfile(userId);
  const officerId = profile.officer_id;

  const sql = `
    SELECT DISTINCT ON (m.mlef_id)
           m.mlef_id, m.request_date, m.status, m.reason,
           pc.case_number, pc.title AS case_title,
           pt.medical_record_number,
           (p_pat.first_name || ' ' || p_pat.last_name) AS patient_name,
           p_pat.nic AS patient_nic,
           h.hospital_name, h.district AS hospital_district,
           (
             SELECT COUNT(*)::int
             FROM mlef m2
             WHERE m2.request_date <= m.request_date
           ) AS seq_num
    FROM mlef m
    JOIN police_case pc ON m.case_id = pc.case_id
    JOIN patient pt ON m.patient_id = pt.patient_id
    JOIN person p_pat ON pt.person_id = p_pat.person_id
    JOIN hospital h ON m.hospital_id = h.hospital_id
    LEFT JOIN police_officer po_req ON m.requesting_officer = po_req.officer_id
    LEFT JOIN person p_req ON po_req.person_id = p_req.person_id
    LEFT JOIN case_assignment ca ON pc.case_id = ca.case_id AND ca.removed_date IS NULL
    LEFT JOIN police_officer po_assigned ON ca.officer_id = po_assigned.officer_id
    LEFT JOIN person p_assigned ON po_assigned.person_id = p_assigned.person_id
    WHERE ($1::uuid IS NOT NULL AND (p_req.user_id = $1 OR p_assigned.user_id = $1))
       OR ($2::uuid IS NOT NULL AND (m.requesting_officer = $2 OR ca.officer_id = $2))
    ORDER BY m.mlef_id, m.request_date DESC
  `;

  let result = await query(sql, [userId || null, officerId || null]);

  return result.rows.map(r => ({
    ...r,
    formatted_mlef_id: `MLEF-${String(r.seq_num).padStart(6, '0')}`
  }));
};

/**
 * Get Full Case Details with Timeline, Evidence, MLEFs, and Completed Reports
 */
const getCaseDetails = async (caseId) => {
  // 1. Case & Incident info
  const caseRes = await query(
    `SELECT pc.case_id, pc.case_number, pc.title, pc.description AS case_description,
            pc.case_type, pc.date_reported, pc.created_at,
            cs.status_id, cs.status_name AS case_status,
            ps.station_name, ps.district AS station_district,
            i.incident_id, i.incident_datetime, i.location AS incident_location,
            i.description AS incident_description, i.weather
     FROM police_case pc
     JOIN case_status cs ON pc.status_id = cs.status_id
     JOIN police_station ps ON pc.station_id = ps.station_id
     LEFT JOIN incident i ON pc.case_id = i.case_id
     WHERE pc.case_id = $1`,
    [caseId]
  );

  if (caseRes.rowCount === 0) {
    const err = new Error('Police case not found');
    err.statusCode = 404;
    throw err;
  }

  const caseInfo = caseRes.rows[0];

  // 2. Assigned Officers
  const officersRes = await query(
    `SELECT ca.assignment_id, ca.assignment_role, ca.assigned_date,
            po.officer_id, po.badge_number, po.rank,
            (p.first_name || ' ' || p.last_name) AS officer_name, p.telephone, p.email
     FROM case_assignment ca
     JOIN police_officer po ON ca.officer_id = po.officer_id
     JOIN person p ON po.person_id = p.person_id
     WHERE ca.case_id = $1 AND ca.removed_date IS NULL
     ORDER BY ca.assigned_date ASC`,
    [caseId]
  );

  // 3. Evidence List with Photos
  const evidenceRes = await query(
    `SELECT ev.evidence_id, ev.evidence_type, ev.description, ev.collected_date, ev.current_status,
            (p.first_name || ' ' || p.last_name) AS collector_name,
            po.badge_number AS collector_badge
     FROM evidence ev
     LEFT JOIN police_officer po ON ev.collected_by = po.officer_id
     LEFT JOIN person p ON po.person_id = p.person_id
     WHERE ev.case_id = $1
     ORDER BY ev.collected_date DESC`,
    [caseId]
  );

  const evidenceItems = await Promise.all(
    evidenceRes.rows.map(async (item) => {
      const photosRes = await query(
        `SELECT photo_id, file_path, uploaded_at, description FROM evidence_photo WHERE evidence_id = $1 ORDER BY uploaded_at DESC`,
        [item.evidence_id]
      );
      return {
        ...item,
        photos: photosRes.rows,
      };
    })
  );

  // 4. MLEF Requisitions for this Case
  const mlefsRes = await query(
    `SELECT m.mlef_id, m.request_date, m.status, m.reason,
            h.hospital_name,
            pt.medical_record_number,
            (p_pat.first_name || ' ' || p_pat.last_name) AS patient_name,
            e.examination_id,
            CONCAT(jmo_p.first_name, ' ', jmo_p.last_name) AS assigned_jmo_name
     FROM mlef m
     JOIN hospital h ON m.hospital_id = h.hospital_id
     JOIN patient pt ON m.patient_id = pt.patient_id
     JOIN person p_pat ON pt.person_id = p_pat.person_id
     LEFT JOIN examination e ON m.mlef_id = e.mlef_id
     LEFT JOIN judicial_medical_officer jmo ON e.jmo_id = jmo.jmo_id
     LEFT JOIN person jmo_p ON jmo.person_id = jmo_p.person_id
     WHERE m.case_id = $1
     ORDER BY m.request_date DESC`,
    [caseId]
  );

  // 5. Completed Medico-Legal Reports available for download
  const reportsRes = await query(
    `SELECT mlr.report_id, mlr.report_number, mlr.findings, mlr.medical_opinion, mlr.recommendations,
            mlr.report_status, mlr.prepared_date,
            CONCAT(jmo_p.first_name, ' ', jmo_p.last_name) AS jmo_name
     FROM medico_legal_report mlr
     JOIN examination e ON mlr.examination_id = e.examination_id
     JOIN mlef m ON e.mlef_id = m.mlef_id
     JOIN judicial_medical_officer jmo ON e.jmo_id = jmo.jmo_id
     JOIN person jmo_p ON jmo.person_id = jmo_p.person_id
     WHERE m.case_id = $1 AND mlr.report_status = 'COMPLETED'`,
    [caseId]
  );

  // 6. Case Activity Timeline
  const timelineRes = await query(
    `SELECT ca.activity_id, ca.activity_type, ca.description, ca.activity_time,
            u.username AS performer
     FROM case_activity ca
     LEFT JOIN users u ON ca.user_id = u.user_id
     WHERE ca.case_id = $1
     ORDER BY ca.activity_time DESC`,
    [caseId]
  );

  return {
    caseInfo,
    officers: officersRes.rows,
    evidence: evidenceItems,
    mlefs: mlefsRes.rows,
    completedReports: reportsRes.rows,
    timeline: timelineRes.rows,
  };
};

/**
 * Add Evidence item for a case
 */
const addEvidence = async (evidenceData, userId) => {
  const { case_id, evidence_type, description, collected_date, current_status } = evidenceData;

  if (!case_id) throw new Error('Case ID is required');
  if (!evidence_type || !evidence_type.trim()) throw new Error('Evidence type is required');

  const profile = await getOfficerProfile(userId);
  const officerId = profile.officer_id;

  let newEvidence = null;

  await withTransaction(async (client) => {
    const res = await client.query(
      `INSERT INTO evidence (case_id, evidence_type, description, collected_by, collected_date, current_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        case_id,
        evidence_type.trim(),
        description || '',
        officerId || null,
        collected_date || new Date(),
        current_status || 'SECURED_IN_STATION'
      ]
    );
    newEvidence = res.rows[0];

    // Create Chain of Custody record
    await client.query(
      `INSERT INTO chain_of_custody (evidence_id, transfer_reason)
       VALUES ($1, $2)`,
      [newEvidence.evidence_id, 'Initial collection and registration by police officer']
    );

    // Log Case Activity
    await client.query(
      `INSERT INTO case_activity (case_id, user_id, activity_type, description)
       VALUES ($1, $2, 'EVIDENCE_COLLECTED', $3)`,
      [case_id, userId, `Collected evidence [${evidence_type.trim()}]: ${description || 'No description'}`]
    );
  });

  await logAudit(userId, 'ADD_EVIDENCE', 'evidence', newEvidence.evidence_id, `Added evidence ${evidence_type}`);

  return newEvidence;
};

/**
 * Upload Photo for Evidence Item
 */
const uploadEvidencePhoto = async ({ evidence_id, file_path, description }, userId) => {
  if (!evidence_id) throw new Error('Evidence ID is required');
  if (!file_path) throw new Error('File path is required');

  const evRes = await query(`SELECT case_id, evidence_type FROM evidence WHERE evidence_id = $1`, [evidence_id]);
  if (evRes.rowCount === 0) throw new Error('Evidence record not found');
  const caseId = evRes.rows[0].case_id;

  const photoRes = await query(
    `INSERT INTO evidence_photo (evidence_id, file_path, uploaded_by, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [evidence_id, file_path, userId, description || 'Evidence Photo']
  );

  // Log activity
  await query(
    `INSERT INTO case_activity (case_id, user_id, activity_type, description)
     VALUES ($1, $2, 'EVIDENCE_PHOTO_UPLOADED', $3)`,
    [caseId, userId, `Uploaded photo for evidence ${evRes.rows[0].evidence_type}`]
  );

  return photoRes.rows[0];
};

/**
 * Assign Police Officer to a Case
 */
const assignOfficerToCase = async ({ case_id, officer_id, assignment_role }, userId) => {
  if (!case_id || !officer_id) throw new Error('case_id and officer_id are required');

  const officerRes = await query(
    `SELECT (p.first_name || ' ' || p.last_name) AS full_name, po.badge_number
     FROM police_officer po
     JOIN person p ON po.person_id = p.person_id
     WHERE po.officer_id = $1`,
    [officer_id]
  );
  if (officerRes.rowCount === 0) throw new Error('Police officer not found');

  const officer = officerRes.rows[0];

  const assignRes = await query(
    `INSERT INTO case_assignment (case_id, officer_id, assignment_role)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [case_id, officer_id, assignment_role || 'INVESTIGATOR']
  );

  await query(
    `INSERT INTO case_activity (case_id, user_id, activity_type, description)
     VALUES ($1, $2, 'OFFICER_ASSIGNED', $3)`,
    [case_id, userId, `Assigned officer ${officer.full_name} (Badge: ${officer.badge_number}) as ${assignment_role || 'INVESTIGATOR'}`]
  );

  return assignRes.rows[0];
};

/**
 * Update Police Case Status
 */
const updateCaseStatus = async ({ case_id, status_id }, userId) => {
  const statusRes = await query(`SELECT status_name FROM case_status WHERE status_id = $1`, [status_id]);
  if (statusRes.rowCount === 0) throw new Error('Invalid status ID');

  const updateRes = await query(
    `UPDATE police_case SET status_id = $1, updated_at = CURRENT_TIMESTAMP WHERE case_id = $2 RETURNING *`,
    [status_id, case_id]
  );

  await query(
    `INSERT INTO case_activity (case_id, user_id, activity_type, description)
     VALUES ($1, $2, 'STATUS_UPDATED', $3)`,
    [case_id, userId, `Case status updated to ${statusRes.rows[0].status_name}`]
  );

  return updateRes.rows[0];
};

/**
 * Get Available Police Officers in Station for Assignment
 */
const getOfficersList = async (userId) => {
  const profile = await getOfficerProfile(userId);
  const sql = `
    SELECT po.officer_id, po.badge_number, po.rank,
           (p.first_name || ' ' || p.last_name) AS full_name
    FROM police_officer po
    JOIN person p ON po.person_id = p.person_id
    WHERE ($1::uuid IS NULL OR po.station_id = $1)
    ORDER BY p.first_name ASC
  `;
  const result = await query(sql, [profile.station_id]);
  return result.rows;
};

/**
 * Get officer notifications
 */
const getOfficerNotifications = async (userId) => {
  const result = await query(
    `SELECT n.notification_id, n.message, n.notification_type, n.is_read, n.created_at
     FROM notifications n
     WHERE n.user_id = $1 OR n.user_id IS NULL
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [userId]
  );
  return result.rows;
};

module.exports = {
  getOfficerProfile,
  getPoliceDashboardStats,
  getAssignedCases,
  createPoliceCase,
  registerPatient,
  searchPatients,
  getHospitalsWithForensicUnit,
  createMlefRecord,
  getOfficerMlefs,
  getCaseDetails,
  addEvidence,
  uploadEvidencePhoto,
  assignOfficerToCase,
  updateCaseStatus,
  getOfficersList,
  getOfficerNotifications,
};
