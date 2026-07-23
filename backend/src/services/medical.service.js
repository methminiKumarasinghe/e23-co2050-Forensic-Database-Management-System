const { query, withTransaction } = require('../config/db');
const { createNotification, logAudit } = require('./admin.service');

/**
 * Helper to get hospital_id associated with a user (medical_officer or JMO)
 */
const getHospitalForUser = async (userId) => {
  const res = await query(
    `SELECT mo.hospital_id
     FROM medical_officer mo
     JOIN person p ON mo.person_id = p.person_id
     WHERE p.user_id = $1
     UNION
     SELECT jmo.hospital_id
     FROM judicial_medical_officer jmo
     JOIN person p ON jmo.person_id = p.person_id
     WHERE p.user_id = $1
     UNION
     SELECT lt.hospital_id
     FROM laboratory_technician lt
     JOIN person p ON lt.person_id = p.person_id
     WHERE p.user_id = $1
     LIMIT 1`,
    [userId]
  );

  if (res.rowCount === 0) {
    const fallback = await query(`SELECT hospital_id FROM hospital LIMIT 1`);
    return fallback.rows[0]?.hospital_id || null;
  }

  return res.rows[0].hospital_id;
};

/**
 * Get all MLEFs sent to user's hospital (or all if user hospital is fallback)
 */
const getHospitalMlefs = async (userId) => {
  const hospitalId = await getHospitalForUser(userId);

  const sql = `
    SELECT 
      m.mlef_id,
      m.case_id,
      m.patient_id,
      m.requesting_officer,
      m.hospital_id,
      m.request_date,
      m.reason,
      m.status,
      pc.case_number,
      pc.title AS case_title,
      CONCAT(pat_p.first_name, ' ', pat_p.last_name) AS patient_name,
      CONCAT(off_p.first_name, ' ', off_p.last_name) AS requesting_officer_name,
      po.badge_number AS officer_badge,
      h.hospital_name,
      e.examination_id,
      e.jmo_id,
      CONCAT(jmo_p.first_name, ' ', jmo_p.last_name) AS assigned_jmo_name,
      (
        SELECT COUNT(*)::int
        FROM mlef m2
        WHERE m2.request_date <= m.request_date
      ) AS seq_num
    FROM mlef m
    JOIN police_case pc ON m.case_id = pc.case_id
    JOIN patient pat ON m.patient_id = pat.patient_id
    JOIN person pat_p ON pat.person_id = pat_p.person_id
    JOIN police_officer po ON m.requesting_officer = po.officer_id
    JOIN person off_p ON po.person_id = off_p.person_id
    JOIN hospital h ON m.hospital_id = h.hospital_id
    LEFT JOIN examination e ON m.mlef_id = e.mlef_id
    LEFT JOIN judicial_medical_officer jmo ON e.jmo_id = jmo.jmo_id
    LEFT JOIN person jmo_p ON jmo.person_id = jmo_p.person_id
    WHERE ($1::uuid IS NULL OR m.hospital_id = $1)
    ORDER BY m.request_date DESC
  `;

  const result = await query(sql, [hospitalId]);

  return result.rows.map((r) => ({
    ...r,
    formatted_mlef_id: `MLEF-${String(r.seq_num).padStart(6, '0')}`,
  }));
};

/**
 * Get all available JMOs for user's hospital
 */
const getHospitalJmos = async (userId) => {
  const hospitalId = await getHospitalForUser(userId);

  const sql = `
    SELECT 
      jmo.jmo_id,
      jmo.registration_number,
      jmo.specialization,
      p.user_id,
      CONCAT(p.first_name, ' ', p.last_name) AS full_name,
      p.telephone,
      h.hospital_name
    FROM judicial_medical_officer jmo
    JOIN person p ON jmo.person_id = p.person_id
    LEFT JOIN users u ON p.user_id = u.user_id
    LEFT JOIN hospital h ON jmo.hospital_id = h.hospital_id
    WHERE ($1::uuid IS NULL OR jmo.hospital_id = $1)
      AND (u.status IS NULL OR u.status = 'ACTIVE')
    ORDER BY p.first_name ASC
  `;

  const result = await query(sql, [hospitalId]);
  return result.rows;
};

/**
 * Assign an MLEF to a JMO
 */
const assignMlefToJmo = async ({ mlef_id, jmo_id, userId }) => {
  const mlefRes = await query(
    `SELECT m.mlef_id, m.hospital_id, m.request_date, m.status,
            (SELECT COUNT(*)::int FROM mlef m2 WHERE m2.request_date <= m.request_date) AS seq_num
     FROM mlef m
     WHERE m.mlef_id = $1`,
    [mlef_id]
  );

  if (mlefRes.rowCount === 0) {
    const err = new Error('MLEF requisition record not found');
    err.statusCode = 404;
    throw err;
  }

  const mlefRecord = mlefRes.rows[0];
  const formattedMlefId = `MLEF-${String(mlefRecord.seq_num).padStart(6, '0')}`;

  // Verify JMO exists
  const jmoRes = await query(
    `SELECT jmo.jmo_id, p.user_id, CONCAT(p.first_name, ' ', p.last_name) AS full_name
     FROM judicial_medical_officer jmo
     JOIN person p ON jmo.person_id = p.person_id
     WHERE jmo.jmo_id = $1`,
    [jmo_id]
  );

  if (jmoRes.rowCount === 0) {
    const err = new Error('Selected Judicial Medical Officer not found');
    err.statusCode = 404;
    throw err;
  }
  const jmoRecord = jmoRes.rows[0];

  // Perform assignment in transaction
  await withTransaction(async (client) => {
    // Upsert examination record
    await client.query(
      `INSERT INTO examination (mlef_id, jmo_id, status_id, created_at)
       VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (mlef_id) 
       DO UPDATE SET jmo_id = EXCLUDED.jmo_id, status_id = 1`,
      [mlef_id, jmo_id]
    );

    // Update MLEF status
    await client.query(
      `UPDATE mlef SET status = 'ASSIGNED' WHERE mlef_id = $1`,
      [mlef_id]
    );
  });

  // Audit log
  await logAudit(
    userId,
    'ASSIGN_MLEF_JMO',
    'mlef',
    mlef_id,
    `Assigned MLEF ${formattedMlefId} to JMO Dr. ${jmoRecord.full_name}`
  );

  // Notify assigned JMO if user account linked
  if (jmoRecord.user_id) {
    await createNotification(
      jmoRecord.user_id,
      `MLEF requisition ${formattedMlefId} has been assigned to you for examination.`,
      'MLEF_ASSIGNED'
    );
  }

  return {
    mlef_id,
    formatted_mlef_id: formattedMlefId,
    assigned_jmo: jmoRecord.full_name,
    status: 'ASSIGNED',
  };
};

module.exports = {
  getHospitalForUser,
  getHospitalMlefs,
  getHospitalJmos,
  assignMlefToJmo,
};
