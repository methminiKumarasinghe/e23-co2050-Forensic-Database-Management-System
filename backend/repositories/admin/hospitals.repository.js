const db = require('../../database');

class HospitalsRepository {
  async findAll() {
    const query = `
      SELECT h.*, COUNT(d.department_id) as department_count
      FROM hospital h
      LEFT JOIN department d ON h.hospital_id = d.hospital_id
      GROUP BY h.hospital_id
      ORDER BY h.hospital_name ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async findById(hospitalId) {
    const query = `
      SELECT h.*, COUNT(d.department_id) as department_count
      FROM hospital h
      LEFT JOIN department d ON h.hospital_id = d.hospital_id
      WHERE h.hospital_id = $1
      GROUP BY h.hospital_id
    `;
    const result = await db.query(query, [hospitalId]);
    return result.rows[0];
  }

  async create(data) {
    const query = `
      INSERT INTO hospital (hospital_name, hospital_type, address, district, telephone, email)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [data.hospital_name, data.hospital_type, data.address, data.district, data.telephone, data.email];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async update(hospitalId, updates) {
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

    values.push(hospitalId);
    const query = `
      UPDATE hospital
      SET ${setClauses.join(', ')}
      WHERE hospital_id = $${paramIndex}
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async delete(hospitalId) {
    const query = 'DELETE FROM hospital WHERE hospital_id = $1 RETURNING hospital_id';
    const result = await db.query(query, [hospitalId]);
    return result.rowCount > 0;
  }
}

module.exports = new HospitalsRepository();
