/**
 * Admin Seed Script
 * ─────────────────
 * Creates the initial ADMIN user if one does not already exist.
 * Run once: npm run seed:admin
 *
 * Credentials come from .env:
 *   ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const { withTransaction, query, testConnection } = require('../src/config/db');

const seed = async () => {
  await testConnection();

  const username  = process.env.ADMIN_USERNAME || 'admin';
  const email     = process.env.ADMIN_EMAIL || 'admin@fmis.gov.lk';
  const plainPass = process.env.ADMIN_INITIAL_PASSWORD;

  if (!plainPass) {
    console.error('❌ ADMIN_INITIAL_PASSWORD is not set in .env');
    process.exit(1);
  }

  // Check if admin already exists
  const existing = await query(
    `SELECT u.user_id FROM users u
     JOIN user_roles ur ON ur.user_id = u.user_id
     JOIN roles r ON r.role_id = ur.role_id
     WHERE r.role_name = 'ADMIN'
     LIMIT 1`
  );

  if (existing.rowCount > 0) {
    console.log('⚠️  Admin user already exists. Skipping seed.');
    process.exit(0);
  }

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  const password_hash = await bcrypt.hash(plainPass, saltRounds);

  await withTransaction(async (client) => {
    // Insert user (ACTIVE — admin can login immediately)
    const userResult = await client.query(
      `INSERT INTO users (username, password_hash, email, status)
       VALUES ($1, $2, $3, 'ACTIVE')
       RETURNING user_id, username`,
      [username, password_hash, email]
    );
    const { user_id, username: uname } = userResult.rows[0];

    // Get ADMIN role id
    const roleResult = await client.query(
      `SELECT role_id FROM roles WHERE role_name = 'ADMIN'`
    );
    const role_id = roleResult.rows[0].role_id;

    // Assign ADMIN role
    await client.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
      [user_id, role_id]
    );

    // Create a person record for admin
    await client.query(
      `INSERT INTO person (user_id, first_name, last_name)
       VALUES ($1, 'System', 'Administrator')`,
      [user_id]
    );

    console.log(`✅ Admin user created:`);
    console.log(`   Username : ${uname}`);
    console.log(`   Email    : ${email}`);
    console.log(`   Password : (set in .env ADMIN_INITIAL_PASSWORD)`);
    console.log(`   Status   : ACTIVE`);
  });

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
