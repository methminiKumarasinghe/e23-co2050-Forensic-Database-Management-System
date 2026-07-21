const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token is missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ error: 'User roles are not defined' });
    }

    if (!req.user.roles.includes(requiredRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const authorizePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roles || req.user.roles.length === 0) {
        return res.status(403).json({ error: 'Access denied: user roles not defined' });
      }

      // Query database to check if any of the user's active roles has the required permission
      const query = `
        SELECT COUNT(*) 
        FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE r.role_name = ANY($1) AND p.permission_name = $2
      `;
      const result = await pool.query(query, [req.user.roles, requiredPermission]);

      if (parseInt(result.rows[0].count, 10) === 0) {
        return res.status(403).json({ 
          error: `Insufficient permissions: Action requires '${requiredPermission}' permission.` 
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizePermission
};
