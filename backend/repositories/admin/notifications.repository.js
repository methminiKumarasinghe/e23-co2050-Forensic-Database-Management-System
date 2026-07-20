const db = require('../../database');

class NotificationsRepository {
  async findAll() {
    const query = `
      SELECT n.*, u.username
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.user_id
      ORDER BY n.created_at DESC
      LIMIT 100
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async createMultiple(userIds, message, notificationType) {
    if (!userIds || userIds.length === 0) return 0;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO notifications (user_id, message, notification_type)
        VALUES ($1, $2, $3)
      `;
      
      for (const userId of userIds) {
        await client.query(query, [userId, message, notificationType]);
      }
      
      await client.query('COMMIT');
      return userIds.length;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getUsersByRole(roleId) {
    const query = `SELECT user_id FROM user_roles WHERE role_id = $1`;
    const result = await db.query(query, [roleId]);
    return result.rows.map(row => row.user_id);
  }

  async getAllUsers() {
    const query = `SELECT user_id FROM users WHERE status != 'INACTIVE'`;
    const result = await db.query(query);
    return result.rows.map(row => row.user_id);
  }
}

module.exports = new NotificationsRepository();
