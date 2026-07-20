const db = require('../../database');

class AuditLogsRepository {
  async findAll(filters) {
    const { user_id, action, date, limit = 50, offset = 0 } = filters;
    
    let queryStr = `
      SELECT a.*, u.username 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (user_id) {
      queryStr += ` AND a.user_id = $${paramIndex}`;
      values.push(user_id);
      paramIndex++;
    }

    if (action) {
      queryStr += ` AND a.action = $${paramIndex}`;
      values.push(action);
      paramIndex++;
    }

    if (date) {
      queryStr += ` AND DATE(a.created_at) = $${paramIndex}`;
      values.push(date);
      paramIndex++;
    }

    queryStr += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await db.query(queryStr, values);

    // Get total count for pagination metadata
    let countQuery = `SELECT COUNT(*) FROM audit_logs a WHERE 1=1`;
    const countValues = [];
    let countParamIndex = 1;

    if (user_id) {
      countQuery += ` AND a.user_id = $${countParamIndex}`;
      countValues.push(user_id);
      countParamIndex++;
    }
    if (action) {
      countQuery += ` AND a.action = $${countParamIndex}`;
      countValues.push(action);
      countParamIndex++;
    }
    if (date) {
      countQuery += ` AND DATE(a.created_at) = $${countParamIndex}`;
      countValues.push(date);
      countParamIndex++;
    }

    const countResult = await db.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    return {
      data: result.rows,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    };
  }

  // Also providing a method to insert audit log
  async create(auditData) {
    const query = `
      INSERT INTO audit_logs (user_id, action, entity_name, entity_id, description)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [
      auditData.user_id,
      auditData.action,
      auditData.entity_name,
      auditData.entity_id,
      auditData.description
    ];
    await db.query(query, values);
  }
}

module.exports = new AuditLogsRepository();
