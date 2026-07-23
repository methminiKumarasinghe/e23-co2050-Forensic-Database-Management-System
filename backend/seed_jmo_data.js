require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function seed() {
  await client.connect();
  try {
    await client.query('BEGIN');
    
    // 0. Ensure JMO role exists
    let roleRes = await client.query("SELECT role_id FROM roles WHERE role_name = 'JMO'");
    let roleId;
    if(roleRes.rows.length === 0) {
      const insRole = await client.query("INSERT INTO roles (role_name, description) VALUES ('JMO', 'Judicial Medical Officer') RETURNING role_id");
      roleId = insRole.rows[0].role_id;
    } else {
      roleId = roleRes.rows[0].role_id;
    }

    // 1. Get or Create the JMO user
    let userRes = await client.query("SELECT user_id FROM users WHERE username = 'jmo'");
    let userId;
    if(userRes.rows.length === 0) {
      const hash = await bcrypt.hash('jmo123', 10);
      const insUser = await client.query("INSERT INTO users (username, password_hash, email, status) VALUES ('jmo', $1, 'jmo@example.com', 'ACTIVE') RETURNING user_id", [hash]);
      userId = insUser.rows[0].user_id;
      await client.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", [userId, roleId]);
    } else {
      userId = userRes.rows[0].user_id;
    }

    // 2. Create person for JMO
    let personRes = await client.query("SELECT person_id FROM person WHERE user_id = $1", [userId]);
    let personId;
    if(personRes.rows.length === 0) {
      const insPerson = await client.query("INSERT INTO person (user_id, first_name, last_name, nic, gender) VALUES ($1, 'Dr. Nuwan', 'Kumara', '991234567V', 'Male') RETURNING person_id", [userId]);
      personId = insPerson.rows[0].person_id;
    } else {
      personId = personRes.rows[0].person_id;
    }

    // 3. Get Hospital ID (assuming the one created earlier)
    let hospitalRes = await client.query("SELECT hospital_id FROM hospital LIMIT 1");
    if(hospitalRes.rows.length === 0) {
      throw new Error("No hospital found. Please run the police seed script first.");
    }
    const hospitalId = hospitalRes.rows[0].hospital_id;

    // 4. Create JMO profile
    let jmoRes = await client.query("SELECT jmo_id FROM judicial_medical_officer WHERE person_id = $1", [personId]);
    let jmoId;
    if(jmoRes.rows.length === 0) {
      const insJmo = await client.query("INSERT INTO judicial_medical_officer (person_id, hospital_id) VALUES ($1, $2) RETURNING jmo_id", [personId, hospitalId]);
      jmoId = insJmo.rows[0].jmo_id;
    } else {
      jmoId = jmoRes.rows[0].jmo_id;
    }

    await client.query('COMMIT');
    console.log("JMO data seeded successfully.");
    console.log("User ID:", userId);
    console.log("JMO ID:", jmoId);
    console.log("Hospital ID:", hospitalId);

  } catch(e) {
    await client.query('ROLLBACK');
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}
seed();
