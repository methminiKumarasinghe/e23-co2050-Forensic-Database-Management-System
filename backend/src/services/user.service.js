const { query } = require('../config/db');
const { USER_STATUS } = require('../config/constants');

/**
 * Get all users with INACTIVE status (pending approval)
 */
const getPendingUsers = async () => {
  const result = await query(
    `SELECT u.user_id, u.username, u.email, u.phone, u.status, u.created_at,
            r.role_name AS role,
            p.first_name, p.last_name, p.nic, p.gender
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.user_id
     JOIN roles r ON r.role_id = ur.role_id
     LEFT JOIN person p ON p.user_id = u.user_id
     WHERE u.status = $1
       AND r.role_name != 'ADMIN'
     ORDER BY u.created_at ASC`,
    [USER_STATUS.INACTIVE]
  );
  return result.rows;
};

/**
 * Get all users (with optional status filter)
 */
const getAllUsers = async ({ status = null, role = null } = {}) => {
  let sql = `
    SELECT u.user_id, u.username, u.email, u.phone, u.status, u.created_at, u.last_login,
           r.role_name AS role,
           p.first_name, p.last_name, p.nic
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.user_id
    JOIN roles r ON r.role_id = ur.role_id
    LEFT JOIN person p ON p.user_id = u.user_id
    WHERE r.role_name != 'ADMIN'
  `;
  const params = [];

  if (status) {
    params.push(status);
    sql += ` AND u.status = $${params.length}`;
  }
  if (role) {
    params.push(role);
    sql += ` AND r.role_name = $${params.length}`;
  }

  sql += ' ORDER BY u.created_at DESC';
  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get a single user by ID with full profile
 */
const getUserById = async (user_id) => {
  const result = await query(
    `SELECT u.user_id, u.username, u.email, u.phone, u.status, u.created_at, u.last_login,
            r.role_name AS role,
            p.first_name, p.last_name, p.nic, p.gender, p.date_of_birth, p.telephone, p.address
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.user_id
     JOIN roles r ON r.role_id = ur.role_id
     LEFT JOIN person p ON p.user_id = u.user_id
     WHERE u.user_id = $1
     LIMIT 1`,
    [user_id]
  );

  if (result.rowCount === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
};

/**
 * Approve a pending user → set status to ACTIVE
 */
const approveUser = async (user_id) => {
  const result = await query(
    `UPDATE users
     SET status = $1
     WHERE user_id = $2
       AND status = $3
     RETURNING user_id, username, email, status`,
    [USER_STATUS.ACTIVE, user_id, USER_STATUS.INACTIVE]
  );

  if (result.rowCount === 0) {
    const err = new Error('User not found or not in pending state');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
};

/**
 * Suspend an active user
 */
const suspendUser = async (user_id) => {
  const result = await query(
    `UPDATE users
     SET status = $1
     WHERE user_id = $2
       AND status = $3
     RETURNING user_id, username, email, status`,
    [USER_STATUS.SUSPENDED, user_id, USER_STATUS.ACTIVE]
  );

  if (result.rowCount === 0) {
    const err = new Error('User not found or not in active state');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
};

/**
 * Reactivate a suspended user
 */
const reactivateUser = async (user_id) => {
  const result = await query(
    `UPDATE users
     SET status = $1
     WHERE user_id = $2
     RETURNING user_id, username, email, status`,
    [USER_STATUS.ACTIVE, user_id]
  );

  if (result.rowCount === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
};

module.exports = {
  getPendingUsers,
  getAllUsers,
  getUserById,
  approveUser,
  suspendUser,
  reactivateUser,
};
