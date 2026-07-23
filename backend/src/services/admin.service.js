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

module.exports = {
  logAudit,
  createNotification,
  getDashboardStats,
  rejectUser,
  resetUserPassword,
  getAuditLogsList,
  getNotificationsList,
};
