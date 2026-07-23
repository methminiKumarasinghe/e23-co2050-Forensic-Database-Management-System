const { sendForbidden } = require('../utils/response');
const { query } = require('../config/db');

/**
 * Role-Based Access Control middleware.
 *
 * requireRole('ADMIN', 'JMO')  → allows only ADMIN or JMO roles
 * requirePermission('CREATE_CASE') → allows any role that has this permission in role_permissions
 */

/**
 * Middleware factory: allows only the specified roles.
 * @param  {...string} roles  Role names (e.g. 'ADMIN', 'POLICE')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendForbidden(res, 'Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      return sendForbidden(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`
      );
    }
    next();
  };
};

/**
 * Middleware factory: allows roles that have any of the specified permissions.
 * Queries the role_permissions table via the user's current role.
 * @param  {...string} permissions  Permission names (e.g. 'CREATE_CASE')
 */
const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendForbidden(res, 'Authentication required');
    }
    try {
      const result = await query(
        `SELECT p.permission_name
         FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.permission_id
         JOIN roles r ON r.role_id = rp.role_id
         WHERE r.role_name = $1
           AND p.permission_name = ANY($2::text[])`,
        [req.user.role, permissions]
      );

      if (result.rowCount === 0) {
        return sendForbidden(
          res,
          `Access denied. Required permission(s): ${permissions.join(', ')}`
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { requireRole, requirePermission };
