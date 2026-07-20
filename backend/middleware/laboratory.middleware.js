const pool = require('../database/connection');

const checkLabRequestAssignment = async (req, res, next) => {
  try {
    // Determine the ID from params, could be request_id, test_id, result_id, or specimen_id
    const { id } = req.params;
    const userId = req.user.user_id;

    if (!req.user.roles || (!req.user.roles.includes('LAB_TECHNICIAN') && !req.user.roles.includes('ADMIN'))) {
      return res.status(403).json({ error: 'Access denied. Only Lab Technicians can access this.' });
    }

    let query = '';
    const params = [id, userId];

    if (req.baseUrl.includes('requests')) {
        query = `
            SELECT lr.request_id
            FROM laboratory_request lr
            JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
            JOIN laboratory_technician lt ON lt.hospital_id = l.hospital_id
            JOIN person p ON lt.person_id = p.person_id
            WHERE lr.request_id = $1 AND p.user_id = $2
        `;
    } else if (req.baseUrl.includes('tests') && !req.path.includes('complete')) {
        // if creating a test, request_id might be in body
        if (req.method === 'POST') {
             query = `
                SELECT lr.request_id
                FROM laboratory_request lr
                JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
                JOIN laboratory_technician lt ON lt.hospital_id = l.hospital_id
                JOIN person p ON lt.person_id = p.person_id
                WHERE lr.request_id = $1 AND p.user_id = $2
            `;
            params[0] = req.body.request_id;
        } else {
             query = `
                SELECT lt.test_id
                FROM laboratory_test lt
                JOIN laboratory_request lr ON lt.request_id = lr.request_id
                JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
                JOIN laboratory_technician ltech ON ltech.hospital_id = l.hospital_id
                JOIN person p ON ltech.person_id = p.person_id
                WHERE lt.test_id = $1 AND p.user_id = $2
            `;
        }
    } else if (req.baseUrl.includes('results') || req.path.includes('complete')) {
        if (req.method === 'POST') {
             query = `
                SELECT lt.test_id
                FROM laboratory_test lt
                JOIN laboratory_request lr ON lt.request_id = lr.request_id
                JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
                JOIN laboratory_technician ltech ON ltech.hospital_id = l.hospital_id
                JOIN person p ON ltech.person_id = p.person_id
                WHERE lt.test_id = $1 AND p.user_id = $2
            `;
            params[0] = req.body.test_id || req.params.id;
        } else {
            query = `
                SELECT lres.result_id
                FROM laboratory_result lres
                JOIN laboratory_test lt ON lres.test_id = lt.test_id
                JOIN laboratory_request lr ON lt.request_id = lr.request_id
                JOIN laboratory l ON lr.laboratory_id = l.laboratory_id
                JOIN laboratory_technician ltech ON ltech.hospital_id = l.hospital_id
                JOIN person p ON ltech.person_id = p.person_id
                WHERE lres.result_id = $1 AND p.user_id = $2
            `;
        }
    } else {
        return next();
    }

    if (query) {
      const result = await pool.query(query, params);
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden. You do not have access to this laboratory record.' });
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkLabRequestAssignment
};
