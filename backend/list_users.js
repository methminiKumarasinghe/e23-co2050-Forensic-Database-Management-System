require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  let res = await client.query("SELECT user_id, username, email FROM users");
  console.log(res.rows);
  res = await client.query(`
    SELECT r.role_name, u.username
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.role_id
    JOIN users u ON ur.user_id = u.user_id
    WHERE r.role_name = 'POLICE'
  `);
  console.log('Police roles:', res.rows);
  await client.end();
}
run();
