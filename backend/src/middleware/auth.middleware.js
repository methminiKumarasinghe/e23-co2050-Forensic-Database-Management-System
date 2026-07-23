const jwt = require('jsonwebtoken');
const { sendUnauthorized } = require('../utils/response');
const { query } = require('../config/db');
const { USER_STATUS } = require('../config/constants');

/**
 * Verifies the JWT from the Authorization header.
 * Attaches { user_id, username, role, status } to req.user.
 * Also re-checks user status from DB to catch suspended/deleted users mid-session.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendUnauthorized(res, 'Token has expired. Please log in again.');
      }
      return sendUnauthorized(res, 'Invalid token');
    }

    // Re-validate user still exists and is active in the DB
    const result = await query(
      `SELECT u.user_id, u.username, u.status, r.role_name AS role
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.user_id
       JOIN roles r ON r.role_id = ur.role_id
       WHERE u.user_id = $1
       LIMIT 1`,
      [decoded.user_id]
    );

    if (result.rowCount === 0) {
      return sendUnauthorized(res, 'User account not found');
    }

    const user = result.rows[0];

    if (user.status !== USER_STATUS.ACTIVE) {
      return sendUnauthorized(res, 'Account is not active. Contact administrator.');
    }

    req.user = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
