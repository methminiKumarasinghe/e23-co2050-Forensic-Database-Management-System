require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  let res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'person'");
  console.log('PERSON:', res.rows);
  res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'police_officer'");
  console.log('POLICE_OFFICER:', res.rows);
  res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mlef'");
  console.log('MLEF:', res.rows);
  await client.end();
}
run();
