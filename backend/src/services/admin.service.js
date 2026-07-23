const { query, withTransaction } = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * Log an action to the audit_logs table
 */
const logAudit = async (userId, action, entityName, entityId, description) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_name, entity_id, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entityName, entityId || null, description]
    );
  } catch (err) {
    console.error('Failed to log audit:', err.message);
  }
};

/**
 * Create a system notification for a user
 */
const createNotification = async (userId, message, notificationType) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, message, notification_type)
       VALUES ($1, $2, $3)`,
      [userId, message, notificationType]
    );
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

/**
 * Fetch dashboard statistics directly from PostgreSQL
 */
const getDashboardStats = async () => {
  // 1. User counts
  const pendingUsersRes = await query("SELECT COUNT(*)::int AS count FROM users WHERE status = 'INACTIVE'");
  const activeUsersRes = await query(
    `SELECT COUNT(u.user_id)::int AS count 
     FROM users u 
     JOIN user_roles ur ON u.user_id = ur.user_id 
     JOIN roles r ON ur.role_id = r.role_id 
     WHERE u.status = 'ACTIVE' AND r.role_name != 'ADMIN'`
  );

  // 2. Org counts
  const hospitalsRes = await query("SELECT COUNT(*)::int AS count FROM hospital");
  const stationsRes = await query("SELECT COUNT(*)::int AS count FROM police_station");

  // 3. Case counts (Open)
  const openCasesRes = await query(
    `SELECT COUNT(pc.case_id)::int AS count 
     FROM police_case pc 
     JOIN case_status cs ON pc.status_id = cs.status_id 
     WHERE cs.status_name = 'OPEN'`
  );

  // 4. Pending Lab Requests
  const pendingLabRes = await query("SELECT COUNT(*)::int AS count FROM laboratory_request WHERE status = 'PENDING'");

  // 5. Pending Reports (DRAFT Medico-legal reports + DRAFT/REVIEW Autopsy documents)
  const draftMlrRes = await query("SELECT COUNT(*)::int AS count FROM medico_legal_report WHERE report_status = 'DRAFT'");
  const draftAutopsyRes = await query(
    `SELECT COUNT(document_id)::int AS count 
     FROM document 
     WHERE status IN ('DRAFT', 'REVIEW') AND document_type = 'AUTOPSY_REPORT'`
  );
  const pendingReportsCount = (draftMlrRes.rows[0].count || 0) + (draftAutopsyRes.rows[0].count || 0);

  // 6. Role Distribution (Chart Data)
  const roleDistribution = await query(
    `SELECT r.role_name, COUNT(ur.user_role_id)::int AS count
     FROM roles r
     LEFT JOIN user_roles ur ON r.role_id = ur.role_id
     WHERE r.role_name != 'FORENSIC_STAFF'
     GROUP BY r.role_name`
  );

  // 7. Case Status Distribution (Chart Data)
  const caseStatusDistribution = await query(
    `SELECT cs.status_name, COUNT(pc.case_id)::int AS count
     FROM case_status cs
     LEFT JOIN police_case pc ON cs.status_id = pc.status_id
     GROUP BY cs.status_name`
  );

  return {
    pendingUsers: pendingUsersRes.rows[0].count,
    activeUsers: activeUsersRes.rows[0].count,
    hospitals: hospitalsRes.rows[0].count,
    policeStations: stationsRes.rows[0].count,
    openCases: openCasesRes.rows[0].count,
    pendingReports: pendingReportsCount,
    pendingLabRequests: pendingLabRes.rows[0].count,
    charts: {
      roles: roleDistribution.rows,
      cases: caseStatusDistribution.rows,
    }
  };
};

/**
 * Reject user: Deletes person (cascades to staff role) and then deletes the user.
 */
const rejectUser = async (userId, adminUserId) => {
  const userResult = await query("SELECT username FROM users WHERE user_id = $1", [userId]);
  if (userResult.rowCount === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const username = userResult.rows[0].username;

  await withTransaction(async (client) => {
    // Delete role assignment
    await client.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);
    // Delete person (Cascades to police_officer / jmo / medical_officer / lab_technician / government_analyst)
    await client.query("DELETE FROM person WHERE user_id = $1", [userId]);
    // Delete user
    await client.query("DELETE FROM users WHERE user_id = $1", [userId]);
  });

  await logAudit(
    adminUserId,
    'REJECT_USER',
    'users',
    userId,
    `Rejected registration request for username: ${username}`
  );
};

/**
 * Reset a user's password
 */
const resetUserPassword = async (userId, newPassword, adminUserId) => {
  const userResult = await query("SELECT username FROM users WHERE user_id = $1", [userId]);
  if (userResult.rowCount === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const username = userResult.rows[0].username;

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  const hash = await bcrypt.hash(newPassword, saltRounds);

  await query(
    "UPDATE users SET password_hash = $1 WHERE user_id = $2",
    [hash, userId]
  );

  await logAudit(
    adminUserId,
    'RESET_PASSWORD',
    'users',
    userId,
    `Reset password for user: ${username}`
  );

  await createNotification(
    userId,
    'Your password was reset by an administrator.',
    'SECURITY'
  );
};

/**
 * Fetch audit logs (searchable & paginated)
 */
const getAuditLogsList = async ({ limit = 20, offset = 0, search = '' }) => {
  let countSql = `
    SELECT COUNT(a.audit_id)::int AS total 
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.user_id
  `;
  let dataSql = `
    SELECT a.audit_id, a.action, a.entity_name, a.entity_id, a.description, a.created_at,
           u.username AS performer_username
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.user_id
  `;
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    const searchFilter = ` WHERE a.action ILIKE $1 OR a.description ILIKE $1 OR u.username ILIKE $1`;
    countSql += searchFilter;
    dataSql += searchFilter;
  }

  dataSql += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const countRes = await query(countSql, params);
  const dataRes = await query(dataSql, [...params, limit, offset]);

  return {
    logs: dataRes.rows,
    total: countRes.rows[0].total,
  };
};

/**
 * Fetch all notifications (paginated)
 */
const getNotificationsList = async ({ limit = 20, offset = 0 }) => {
  const countRes = await query("SELECT COUNT(*)::int AS total FROM notifications");
  const dataRes = await query(
    `SELECT n.notification_id, n.message, n.notification_type, n.is_read, n.created_at,
            u.username AS recipient_username
     FROM notifications n
     LEFT JOIN users u ON n.user_id = u.user_id
     ORDER BY n.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    notifications: dataRes.rows,
    total: countRes.rows[0].total,
  };
};

/**
 * Fetch all cases with status and station info
 */
const getCasesList = async () => {
  const result = await query(
    `SELECT pc.case_id, pc.case_number, pc.case_type, pc.title, pc.date_reported,
            cs.status_name AS status, ps.station_name
     FROM police_case pc
     JOIN case_status cs ON pc.status_id = cs.status_id
     JOIN police_station ps ON pc.station_id = ps.station_id
     ORDER BY pc.date_reported DESC`
  );
  return result.rows;
};

/**
 * Fetch unified reports (Medico-Legal and Autopsy Reports)
 */
const getReportsList = async () => {
  const result = await query(
    `SELECT 'MEDICO_LEGAL' AS report_type, mlr.report_id, mlr.report_number, mlr.report_status AS status, mlr.prepared_date,
            p.first_name || ' ' || p.last_name AS patient_name
     FROM medico_legal_report mlr
     JOIN examination e ON mlr.examination_id = e.examination_id
     JOIN mlef m ON e.mlef_id = m.mlef_id
     JOIN patient pat ON m.patient_id = pat.patient_id
     JOIN person p ON pat.person_id = p.person_id
     UNION ALL
     SELECT 'AUTOPSY' AS report_type, ar.autopsy_report_id AS report_id, doc.document_number AS report_number, doc.status, doc.created_at AS prepared_date,
            p.first_name || ' ' || p.last_name AS patient_name
     FROM autopsy_report ar
     JOIN document doc ON ar.document_id = doc.document_id
     JOIN autopsy a ON ar.autopsy_id = a.autopsy_id
     JOIN deceased d ON a.deceased_id = d.deceased_id
     JOIN person p ON d.person_id = p.person_id
     ORDER BY prepared_date DESC`
  );
  return result.rows;
};

/**
 * Fetch laboratory test requests
 */
const getLabRequestsList = async () => {
  const result = await query(
    `SELECT lr.request_id, lr.request_date, lr.priority, lr.status,
            l.laboratory_name, s.specimen_type
     FROM laboratory_request lr
     JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
     JOIN specimen s ON lr.specimen_id = s.specimen_id
     ORDER BY lr.request_date DESC`
  );
  return result.rows;
};

/**
 * Fetch all hospitals list
 */
const getHospitalsList = async () => {
  const result = await query(
    `SELECT hospital_id, hospital_name, hospital_type, district, telephone, email
     FROM hospital
     ORDER BY hospital_name ASC`
  );
  return result.rows;
};

/**
 * Fetch all police stations list
 */
const getStationsList = async () => {
  const result = await query(
    `SELECT station_id, station_name, district, telephone, email
     FROM police_station
     ORDER BY station_name ASC`
  );
  return result.rows;
};

/**
 * Create a new hospital in the DB
 */
const createHospital = async (data, adminUserId) => {
  const { hospital_name, hospital_type, address, district, telephone, email } = data;
  const result = await query(
    `INSERT INTO hospital (hospital_name, hospital_type, address, district, telephone, email)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [hospital_name, hospital_type || null, address || null, district || null, telephone || null, email || null]
  );
  const hospital = result.rows[0];
  await logAudit(adminUserId, 'CREATE_HOSPITAL', 'hospital', hospital.hospital_id, `Created hospital: ${hospital.hospital_name}`);
  return hospital;
};

/**
 * Create a new police station in the DB
 */
const createPoliceStation = async (data, adminUserId) => {
  const { station_name, district, address, telephone, email } = data;
  const result = await query(
    `INSERT INTO police_station (station_name, district, address, telephone, email)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [station_name, district || null, address || null, telephone || null, email || null]
  );
  const station = result.rows[0];
  await logAudit(adminUserId, 'CREATE_POLICE_STATION', 'police_station', station.station_id, `Created police station: ${station.station_name}`);
  return station;
};

/**
 * Create a user directly by Admin (status = ACTIVE)
 */
const createUserByAdmin = async (userData, adminUserId) => {
  const { registerUser } = require('./auth.service');
  const newUser = await registerUser(userData);
  await query("UPDATE users SET status = 'ACTIVE' WHERE user_id = $1", [newUser.user_id]);
  await logAudit(adminUserId, 'CREATE_USER', 'users', newUser.user_id, `Admin created active user: ${newUser.username} (${newUser.role})`);
  return { ...newUser, status: 'ACTIVE' };
};

/**
 * Create a new department in the DB
 */
const createDepartment = async (data, adminUserId) => {
  const { hospital_id, department_name, description } = data;
  const result = await query(
    `INSERT INTO department (hospital_id, department_name, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [hospital_id, department_name, description || null]
  );
  const dept = result.rows[0];
  await logAudit(adminUserId, 'CREATE_DEPARTMENT', 'department', dept.department_id, `Created department: ${dept.department_name}`);
  return dept;
};

/**
 * Fetch all departments list
 */
const getDepartmentsList = async () => {
  const result = await query(
    `SELECT d.department_id, d.department_name, d.description, d.hospital_id, h.hospital_name
     FROM department d
     JOIN hospital h ON d.hospital_id = h.hospital_id
     ORDER BY d.department_name ASC`
  );
  return result.rows;
};

module.exports = {
  logAudit,
  createNotification,
  getDashboardStats,
  rejectUser,
  resetUserPassword,
  getAuditLogsList,
  getNotificationsList,
  getCasesList,
  getReportsList,
  getLabRequestsList,
  getHospitalsList,
  getStationsList,
  createHospital,
  createPoliceStation,
  createUserByAdmin,
  createDepartment,
  getDepartmentsList,
};
