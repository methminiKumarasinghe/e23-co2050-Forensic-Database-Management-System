const pool = require('../database/connection');

// Middleware to check if the police officer is assigned to the requested case
const checkCaseAssignment = async (req, res, next) => {
  try {
    const { id } = req.params; // case_id
    const userId = req.user.user_id;

    // We need to check if req.user has the POLICE role
    if (!req.user.roles || !req.user.roles.includes('POLICE')) {
      return res.status(403).json({ error: 'Access denied. Only police officers can access this.' });
    }

    // Check case_assignment
    // The JWT gives us user_id. We map user_id -> person_id -> officer_id
    const query = `
      SELECT ca.assignment_id 
      FROM case_assignment ca
      JOIN police_officer po ON ca.officer_id = po.officer_id
      JOIN person p ON po.person_id = p.person_id
      WHERE ca.case_id = $1 AND p.user_id = $2 AND ca.removed_date IS NULL
    `;
    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Forbidden. You are not assigned to this case.' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkCaseAssignment
};
