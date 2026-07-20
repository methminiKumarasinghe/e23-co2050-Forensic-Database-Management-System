const db = require('../../database');

class RolesRepository {
  async findAll() {
    const query = 'SELECT * FROM roles ORDER BY role_id ASC';
    const result = await db.query(query);
    return result.rows;
  }

  async findById(roleId) {
    const query = 'SELECT * FROM roles WHERE role_id = $1';
    const result = await db.query(query, [roleId]);
    return result.rows[0];
  }

  async create(roleData) {
    const query = `
      INSERT INTO roles (role_name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await db.query(query, [roleData.role_name, roleData.description]);
    return result.rows[0];
  }

  async update(roleId, updates) {
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

    values.push(roleId);
    const query = `
      UPDATE roles
      SET ${setClauses.join(', ')}
      WHERE role_id = $${paramIndex}
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = new RolesRepository();
