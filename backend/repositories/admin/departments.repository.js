const db = require('../../database');

class DepartmentsRepository {
  async findAll() {
    const query = `
      SELECT d.*, h.hospital_name
      FROM department d
      JOIN hospital h ON d.hospital_id = h.hospital_id
      ORDER BY h.hospital_name ASC, d.department_name ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async findById(departmentId) {
    const query = `
      SELECT d.*, h.hospital_name
      FROM department d
      JOIN hospital h ON d.hospital_id = h.hospital_id
      WHERE d.department_id = $1
    `;
    const result = await db.query(query, [departmentId]);
    return result.rows[0];
  }

  async create(data) {
    const query = `
      INSERT INTO department (hospital_id, department_name, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [data.hospital_id, data.department_name, data.description];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async update(departmentId, updates) {
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

    values.push(departmentId);
    const query = `
      UPDATE department
      SET ${setClauses.join(', ')}
      WHERE department_id = $${paramIndex}
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async delete(departmentId) {
    const query = 'DELETE FROM department WHERE department_id = $1 RETURNING department_id';
    const result = await db.query(query, [departmentId]);
    return result.rowCount > 0;
  }
}

module.exports = new DepartmentsRepository();
