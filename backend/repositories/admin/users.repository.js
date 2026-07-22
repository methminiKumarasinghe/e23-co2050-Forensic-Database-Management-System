const db = require('../../database');

class UsersRepository {
  async findAll() {
    const query = `
      SELECT u.user_id, u.username, u.email, u.phone, u.status, u.created_at, u.last_login,
             array_agg(r.role_name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async findById(userId) {
    const query = `
      SELECT u.user_id, u.username, u.email, u.phone, u.status, u.created_at, u.last_login,
             array_agg(r.role_name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE u.user_id = $1
      GROUP BY u.user_id
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  async create(user, roles) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Insert User
      const userQuery = `
        INSERT INTO users (username, password_hash, email, phone, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING user_id, username, email, phone, status
      `;
      const userValues = [user.username, user.password_hash, user.email, user.phone, 'ACTIVE'];
      const userResult = await client.query(userQuery, userValues);
      const newUser = userResult.rows[0];

      // Insert Roles
      if (roles && roles.length > 0) {
        for (const roleId of roles) {
          await client.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
            [newUser.user_id, roleId]
          );
        }
      }

      await client.query('COMMIT');
      return newUser;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async update(userId, updates, roles) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Build dynamic update query
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

      let updatedUser = null;
      if (setClauses.length > 0) {
        values.push(userId);
        const updateQuery = `
          UPDATE users
          SET ${setClauses.join(', ')}
          WHERE user_id = $${paramIndex}
          RETURNING user_id, username, email, phone, status
        `;
        const result = await client.query(updateQuery, values);
        updatedUser = result.rows[0];
      }

      // Update Roles
      if (roles) {
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
        for (const roleId of roles) {
          await client.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
            [userId, roleId]
          );
        }
      }

      await client.query('COMMIT');
      return updatedUser;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async delete(userId) {
    // Soft delete
    const query = `UPDATE users SET status = 'INACTIVE' WHERE user_id = $1 RETURNING user_id`;
    const result = await db.query(query, [userId]);
    return result.rowCount > 0;
  }
}

module.exports = new UsersRepository();
