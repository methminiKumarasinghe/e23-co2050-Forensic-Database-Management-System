const pool = require('./connection');

async function verifyAndSeed() {
  const client = await pool.connect();
  try {
    // 1. Verify Connection and Database Host
    const dbResult = await client.query('SELECT current_database(), current_user, version()');
    const dbName = dbResult.rows[0].current_database;
    const dbUser = dbResult.rows[0].current_user;

    // Parse hostname from URL or fallback
    let host = pool.options.host;
    if (!host && pool.options.connectionString) {
      try {
        // Strip out postgresql:// or other protocols for URL parsing
        let connStr = pool.options.connectionString;
        if (!connStr.startsWith('http://') && !connStr.startsWith('https://') && connStr.includes('://')) {
          const parts = connStr.split('://');
          host = parts[1].split('@')[1].split('/')[0].split('?')[0];
        } else {
          host = new URL(connStr).hostname;
        }
      } catch (e) {
        host = 'connection-string-parsed-host';
      }
    }

    console.log('============================================================');
    console.log(' DATABASE CONNECTION VERIFICATION');
    console.log('============================================================');
    console.log(` Connected Host: ${host}`);
    console.log(` Database Name:  ${dbName}`);
    console.log(` Active User:    ${dbUser}`);
    console.log('============================================================');

    // Create access_logs table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS access_logs (
        access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
        username VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        ip_address VARCHAR(50),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create system_settings table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT
      );
    `);

    // Create uploaded_files table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES document(document_id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INT,
        mime_type VARCHAR(100),
        uploaded_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default settings
    await client.query(`
      INSERT INTO system_settings (setting_key, setting_value, description)
      VALUES 
        ('password_min_length', '8', 'Minimum password length requirement'),
        ('session_timeout', '30', 'Session timeout in minutes'),
        ('backup_schedule', 'DAILY_MIDNIGHT', 'Database backup schedule'),
        ('email_notifications', 'true', 'Enable or disable email alerts'),
        ('mfa_enabled', 'false', 'Multi-factor authentication flag')
      ON CONFLICT (setting_key) DO NOTHING;
    `);

    console.log(' [SCHEMA] Verified access_logs and system_settings tables.');

    // 2. Check if permissions table has content
    const permCheck = await client.query('SELECT COUNT(*) FROM permissions');
    const permCount = parseInt(permCheck.rows[0].count, 10);
    if (permCount === 0) {
      console.log(' No permissions found in database. Please run migrations/seeders first.');
      return;
    }

    // 3. Check and Seed Role Permissions mapping
    const mappingCheck = await client.query('SELECT COUNT(*) FROM role_permissions');
    const mappingCount = parseInt(mappingCheck.rows[0].count, 10);

    if (mappingCount === 0) {
      console.log(' [SEED] Table "role_permissions" is empty. Seeding role mappings...');

      // Map all permissions to ADMIN
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id 
        FROM roles r, permissions p
        WHERE r.role_name = 'ADMIN'
        ON CONFLICT DO NOTHING;
      `);

      // Map Permissions to POLICE
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id 
        FROM roles r, permissions p
        WHERE r.role_name = 'POLICE' 
          AND p.permission_name IN ('CREATE_CASE', 'VIEW_CASE', 'UPDATE_CASE', 'ADD_EVIDENCE', 'VIEW_EVIDENCE', 'REQUEST_LAB_TEST')
        ON CONFLICT DO NOTHING;
      `);

      // Map Permissions to JMO
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id 
        FROM roles r, permissions p
        WHERE r.role_name = 'JMO' 
          AND p.permission_name IN ('VIEW_CASE', 'VIEW_EVIDENCE', 'CREATE_EXAMINATION', 'UPDATE_EXAMINATION', 'CREATE_MEDICAL_REPORT', 'VIEW_MEDICAL_REPORT', 'REQUEST_LAB_TEST')
        ON CONFLICT DO NOTHING;
      `);

      // Map Permissions to LAB_TECHNICIAN
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id 
        FROM roles r, permissions p
        WHERE r.role_name = 'LAB_TECHNICIAN' 
          AND p.permission_name IN ('VIEW_CASE', 'VIEW_EVIDENCE', 'UPLOAD_LAB_RESULT')
        ON CONFLICT DO NOTHING;
      `);

      // Map Permissions to FORENSIC_STAFF
      await client.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.role_id, p.permission_id 
        FROM roles r, permissions p
        WHERE r.role_name = 'FORENSIC_STAFF' 
          AND p.permission_name IN ('VIEW_CASE', 'VIEW_EVIDENCE', 'VIEW_MEDICAL_REPORT')
        ON CONFLICT DO NOTHING;
      `);

      console.log(' [SEED] Successfully mapped permissions to roles in dynamic database table.');
    } else {
      console.log(` [SEED] Table "role_permissions" already contains ${mappingCount} mappings. Skipping seed.`);
    }
    console.log('============================================================');
  } catch (error) {
    console.error('============================================================');
    console.error(' ERROR VERIFYING / SEEDING DATABASE:');
    console.error(error);
    console.error('============================================================');
  } finally {
    client.release();
  }
}

module.exports = verifyAndSeed;
