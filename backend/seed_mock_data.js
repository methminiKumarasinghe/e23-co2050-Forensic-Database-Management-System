require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function seed() {
  await client.connect();
  try {
    await client.query('BEGIN');
    
    // 0. Ensure POLICE role exists
    let roleRes = await client.query("SELECT role_id FROM roles WHERE role_name = 'POLICE'");
    let roleId;
    if(roleRes.rows.length === 0) {
      const insRole = await client.query("INSERT INTO roles (role_name, description) VALUES ('POLICE', 'Police Officer') RETURNING role_id");
      roleId = insRole.rows[0].role_id;
    } else {
      roleId = roleRes.rows[0].role_id;
    }

    // 1. Get or Create the police user
    let userRes = await client.query("SELECT user_id FROM users WHERE username = 'police'");
    let userId;
    if(userRes.rows.length === 0) {
      const hash = await bcrypt.hash('police123', 10);
      const insUser = await client.query("INSERT INTO users (username, password_hash, email, status) VALUES ('police', $1, 'police@example.com', 'ACTIVE') RETURNING user_id", [hash]);
      userId = insUser.rows[0].user_id;
      await client.query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", [userId, roleId]);
    } else {
      userId = userRes.rows[0].user_id;
    }

    // 2. Create person for police
    let personRes = await client.query("SELECT person_id FROM person WHERE user_id = $1", [userId]);
    let personId;
    if(personRes.rows.length === 0) {
      const insPerson = await client.query("INSERT INTO person (user_id, first_name, last_name, nic) VALUES ($1, 'Inspector', 'Silva', '123456789V') RETURNING person_id", [userId]);
      personId = insPerson.rows[0].person_id;
    } else {
      personId = personRes.rows[0].person_id;
    }

    // 3. Create station
    let stationRes = await client.query("SELECT station_id FROM police_station LIMIT 1");
    let stationId;
    if(stationRes.rows.length === 0) {
      const insStation = await client.query("INSERT INTO police_station (station_name, district) VALUES ('Kandy Police Station', 'Kandy') RETURNING station_id");
      stationId = insStation.rows[0].station_id;
    } else {
      stationId = stationRes.rows[0].station_id;
    }

    // 4. Create police officer
    let officerRes = await client.query("SELECT officer_id FROM police_officer WHERE person_id = $1", [personId]);
    let officerId;
    if(officerRes.rows.length === 0) {
      const insOfficer = await client.query("INSERT INTO police_officer (person_id, station_id, badge_number, rank) VALUES ($1, $2, '10442', 'Inspector') RETURNING officer_id", [personId, stationId]);
      officerId = insOfficer.rows[0].officer_id;
    } else {
      officerId = officerRes.rows[0].officer_id;
    }

    // 5. Create Hospital
    let hospitalRes = await client.query("SELECT hospital_id FROM hospital LIMIT 1");
    let hospitalId;
    if(hospitalRes.rows.length === 0) {
      const insHospital = await client.query("INSERT INTO hospital (hospital_name, district) VALUES ('Kandy General Hospital', 'Kandy') RETURNING hospital_id");
      hospitalId = insHospital.rows[0].hospital_id;
    } else {
      hospitalId = hospitalRes.rows[0].hospital_id;
    }

    // 6. Create Patient (Person + Patient)
    let patientPersonRes = await client.query("SELECT person_id FROM person WHERE nic = '987654321V'");
    let patientPersonId;
    if(patientPersonRes.rows.length === 0) {
      const insPatientPerson = await client.query("INSERT INTO person (first_name, last_name, nic, gender) VALUES ('Sunil', 'Perera', '987654321V', 'Male') RETURNING person_id");
      patientPersonId = insPatientPerson.rows[0].person_id;
    } else {
      patientPersonId = patientPersonRes.rows[0].person_id;
    }
    
    let patientRes = await client.query("SELECT patient_id FROM patient WHERE person_id = $1", [patientPersonId]);
    let patientId;
    if(patientRes.rows.length === 0) {
      const insPatient = await client.query("INSERT INTO patient (person_id) VALUES ($1) RETURNING patient_id", [patientPersonId]);
      patientId = insPatient.rows[0].patient_id;
    } else {
      patientId = patientRes.rows[0].patient_id;
    }

    // 7. Case status
    let statusRes = await client.query("SELECT status_id FROM case_status WHERE status_name = 'OPEN'");
    let statusId;
    if(statusRes.rows.length === 0) {
      const insStatus = await client.query("INSERT INTO case_status (status_id, status_name) VALUES (1, 'OPEN') RETURNING status_id");
      statusId = insStatus.rows[0].status_id;
    } else {
      statusId = statusRes.rows[0].status_id;
    }

    // 8. Create Police Case
    let caseRes = await client.query("SELECT case_id FROM police_case WHERE case_number = 'CASE-001'");
    let caseId;
    if(caseRes.rows.length === 0) {
      const insCase = await client.query("INSERT INTO police_case (station_id, status_id, case_number, title, date_reported) VALUES ($1, $2, 'CASE-001', 'Assault Case', NOW()) RETURNING case_id", [stationId, statusId]);
      caseId = insCase.rows[0].case_id;
    } else {
      caseId = caseRes.rows[0].case_id;
    }

    // 9. Assign case to officer
    let assignRes = await client.query("SELECT assignment_id FROM case_assignment WHERE case_id = $1 AND officer_id = $2", [caseId, officerId]);
    if(assignRes.rows.length === 0) {
      await client.query("INSERT INTO case_assignment (case_id, officer_id, assignment_role) VALUES ($1, $2, 'Lead Investigator')", [caseId, officerId]);
    }

    await client.query('COMMIT');
    console.log("Mock data seeded successfully.");
    console.log("Hospital ID:", hospitalId);
    console.log("Patient ID:", patientId);
    console.log("Case ID:", caseId);
    console.log("Officer ID:", officerId);

  } catch(e) {
    await client.query('ROLLBACK');
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}
seed();
