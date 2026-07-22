const db = require('../../database');

class PoliceStationsRepository {
  async findAll() {
    const query = 'SELECT * FROM police_station ORDER BY station_name ASC';
    const result = await db.query(query);
    return result.rows;
  }

  async findById(id) {
    const query = 'SELECT * FROM police_station WHERE station_id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async create(data) {
    const query = `
      INSERT INTO police_station (station_name, district, address, telephone, email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [data.station_name, data.district, data.address, data.telephone, data.email];
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
      UPDATE police_station
      SET ${setClauses.join(', ')}
      WHERE station_id = $${paramIndex}
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    const query = 'DELETE FROM police_station WHERE station_id = $1 RETURNING station_id';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = new PoliceStationsRepository();
