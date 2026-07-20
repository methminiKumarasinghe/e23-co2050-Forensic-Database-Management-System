const pool = require('../database/connection');

// Middleware to check if the JMO is assigned to the examination
const checkExaminationAssignment = async (req, res, next) => {
  try {
    const { id } = req.params; // examination_id, mlef_id, or report_id depending on route
    const userId = req.user.user_id;

    if (!req.user.roles || !req.user.roles.includes('JMO')) {
      return res.status(403).json({ error: 'Access denied. Only JMOs can access this.' });
    }

    // Determine the ID field based on the route
    let query = '';
    const params = [id, userId];

    if (req.baseUrl.includes('examinations') || req.baseUrl.includes('specimens')) {
      query = `
        SELECT e.examination_id 
        FROM examination e
        JOIN judicial_medical_officer jmo ON e.jmo_id = jmo.jmo_id
        JOIN person p ON jmo.person_id = p.person_id
        WHERE e.examination_id = $1 AND p.user_id = $2
      `;
    } else if (req.baseUrl.includes('vitals')) {
      query = `
        SELECT e.examination_id 
        FROM vital_signs vs
        JOIN examination e ON vs.examination_id = e.examination_id
        JOIN judicial_medical_officer jmo ON e.jmo_id = jmo.jmo_id
        JOIN person p ON jmo.person_id = p.person_id
        WHERE vs.vital_sign_id = $1 AND p.user_id = $2
      `;
    } else if (req.baseUrl.includes('injuries')) {
      query = `
        SELECT e.examination_id 
        FROM injury i
        JOIN examination e ON i.examination_id = e.examination_id
        JOIN judicial_medical_officer jmo ON e.jmo_id = jmo.jmo_id
        JOIN person p ON jmo.person_id = p.person_id
        WHERE i.injury_id = $1 AND p.user_id = $2
      `;
    } else if (req.baseUrl.includes('reports')) {
      query = `
        SELECT e.examination_id 
        FROM medico_legal_report r
        JOIN examination e ON r.examination_id = e.examination_id
        JOIN judicial_medical_officer jmo ON e.jmo_id = jmo.jmo_id
        JOIN person p ON jmo.person_id = p.person_id
        WHERE r.report_id = $1 AND p.user_id = $2
      `;
    } else {
        // Fallback for general JMO endpoints without specific ID assignment checks
        return next(); 
    }

    if (query) {
      const result = await pool.query(query, params);
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden. You do not have access to this record.' });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

const checkReportNotSigned = async (req, res, next) => {
    try {
        const { id } = req.params; // report_id
        const query = `SELECT report_status FROM medico_legal_report WHERE report_id = $1`;
        const result = await pool.query(query, [id]);
        
        if (result.rows.length > 0 && result.rows[0].report_status === 'SIGNED') {
            return res.status(403).json({ error: 'This report is signed and read-only.' });
        }
        
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
  checkExaminationAssignment,
  checkReportNotSigned
};
