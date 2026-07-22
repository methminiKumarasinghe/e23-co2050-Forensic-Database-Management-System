const db = require('../../database');

class LaboratoriesRepository {
  async findAll() {
    const query = `
      SELECT l.*, h.hospital_name,
             (SELECT COUNT(*) FROM laboratory_request lr WHERE lr.laboratory_id = l.laboratory_id AND lr.status = 'PENDING') as pending_requests,
             (SELECT COUNT(*) FROM laboratory_request lr WHERE lr.laboratory_id = l.laboratory_id AND lr.status = 'IN_PROGRESS') as active_requests
      FROM laboratory l
      LEFT JOIN hospital h ON l.hospital_id = h.hospital_id
      ORDER BY l.laboratory_name ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async findById(id) {
    const query = `
      SELECT l.*, h.hospital_name
      FROM laboratory l
      LEFT JOIN hospital h ON l.hospital_id = h.hospital_id
      WHERE l.laboratory_id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async create(data) {
    const query = `
      INSERT INTO laboratory (hospital_id, laboratory_name, laboratory_type, contact_number, email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [data.hospital_id, data.laboratory_name, data.laboratory_type, data.contact_number, data.email];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async update(id, updates) {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE laboratory
      SET ${setClauses.join(', ')}
      WHERE laboratory_id = $${paramIndex}
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM laboratory WHERE laboratory_id = $1 RETURNING laboratory_id';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = new LaboratoriesRepository();
