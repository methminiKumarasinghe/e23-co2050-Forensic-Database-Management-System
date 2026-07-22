const db = require('../../database');

class AccessLogsRepository {
  async findAll(filters = {}) {
    let query = `
      SELECT al.*, u.username as user_username
      FROM access_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE 1=1
    `;
    const values = [];
    let idx = 1;

    if (filters.username) {
      query += ` AND al.username ILIKE $${idx}`;
      values.push(`%${filters.username}%`);
      idx++;
    }

    if (filters.action) {
      query += ` AND al.action = $${idx}`;
      values.push(filters.action);
      idx++;
    }

    query += ' ORDER BY al.created_at DESC LIMIT 100'; // Cap at last 100 records for performance
    const result = await db.query(query, values);
    return result.rows;
  }
}

module.exports = new AccessLogsRepository();
