const db = require('../../database');

class SettingsRepository {
  async findAll() {
    const query = 'SELECT * FROM system_settings ORDER BY setting_key ASC';
    const result = await db.query(query);
    return result.rows;
  }

  async updateSettings(settingsObject) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      for (const [key, value] of Object.entries(settingsObject)) {
        const query = `
          UPDATE system_settings
          SET setting_value = $1
          WHERE setting_key = $2
        `;
        await client.query(query, [value.toString(), key]);
      }

      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

module.exports = new SettingsRepository();
