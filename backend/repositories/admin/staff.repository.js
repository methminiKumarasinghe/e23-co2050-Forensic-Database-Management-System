const db = require('../../database');

class StaffRepository {
  async findAll() {
    const query = `
      SELECT p.person_id, p.first_name, p.last_name, p.nic, p.gender, p.date_of_birth, p.telephone, p.email, p.address, p.user_id,
             po.officer_id, po.badge_number, po.rank, po.joined_date as po_joined_date, po.station_id, ps.station_name,
             jmo.jmo_id, jmo.registration_number as jmo_reg, jmo.specialization, jmo.joined_date as jmo_joined_date, jmo.hospital_id as jmo_hospital_id, h1.hospital_name as jmo_hospital_name,
             mo.medical_officer_id, mo.registration_number as mo_reg, mo.joined_date as mo_joined_date, mo.hospital_id as mo_hospital_id, h2.hospital_name as mo_hospital_name,
             lt.technician_id, lt.employee_number as lt_emp, lt.qualification, lt.joined_date as lt_joined_date, lt.hospital_id as lt_hospital_id, h3.hospital_name as lt_hospital_name,
             ga.analyst_id, ga.organization_name as ga_org, ga.employee_number as ga_emp, ga.designation,
             fs.staff_id, fs.employee_number as fs_emp, fs.joined_date as fs_joined_date, fs.hospital_id as fs_hospital_id, h4.hospital_name as fs_hospital_name,
             CASE 
               WHEN po.officer_id IS NOT NULL THEN 'POLICE'
               WHEN jmo.jmo_id IS NOT NULL THEN 'JMO'
               WHEN mo.medical_officer_id IS NOT NULL THEN 'MEDICAL_OFFICER'
               WHEN lt.technician_id IS NOT NULL THEN 'LAB_TECHNICIAN'
               WHEN ga.analyst_id IS NOT NULL THEN 'GOVERNMENT_ANALYST'
               WHEN fs.staff_id IS NOT NULL THEN 'FORENSIC_STAFF'
               ELSE 'NONE'
             END as role
      FROM person p
      LEFT JOIN police_officer po ON p.person_id = po.person_id
      LEFT JOIN police_station ps ON po.station_id = ps.station_id
      LEFT JOIN judicial_medical_officer jmo ON p.person_id = jmo.person_id
      LEFT JOIN hospital h1 ON jmo.hospital_id = h1.hospital_id
      LEFT JOIN medical_officer mo ON p.person_id = mo.person_id
      LEFT JOIN hospital h2 ON mo.hospital_id = h2.hospital_id
      LEFT JOIN laboratory_technician lt ON p.person_id = lt.person_id
      LEFT JOIN hospital h3 ON lt.hospital_id = h3.hospital_id
      LEFT JOIN government_analyst ga ON p.person_id = ga.person_id
      LEFT JOIN forensic_staff fs ON p.person_id = fs.person_id
      LEFT JOIN hospital h4 ON fs.hospital_id = h4.hospital_id
      WHERE po.officer_id IS NOT NULL 
         OR jmo.jmo_id IS NOT NULL 
         OR mo.medical_officer_id IS NOT NULL 
         OR lt.technician_id IS NOT NULL 
         OR ga.analyst_id IS NOT NULL
         OR fs.staff_id IS NOT NULL
      ORDER BY p.first_name ASC, p.last_name ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async findById(id) {
    const query = `
      SELECT p.person_id, p.first_name, p.last_name, p.nic, p.gender, p.date_of_birth, p.telephone, p.email, p.address, p.user_id,
             po.officer_id, po.badge_number, po.rank, po.joined_date as po_joined_date, po.station_id, ps.station_name,
             jmo.jmo_id, jmo.registration_number as jmo_reg, jmo.specialization, jmo.joined_date as jmo_joined_date, jmo.hospital_id as jmo_hospital_id, h1.hospital_name as jmo_hospital_name,
             mo.medical_officer_id, mo.registration_number as mo_reg, mo.joined_date as mo_joined_date, mo.hospital_id as mo_hospital_id, h2.hospital_name as mo_hospital_name,
             lt.technician_id, lt.employee_number as lt_emp, lt.qualification, lt.joined_date as lt_joined_date, lt.hospital_id as lt_hospital_id, h3.hospital_name as lt_hospital_name,
             ga.analyst_id, ga.organization_name as ga_org, ga.employee_number as ga_emp, ga.designation,
             fs.staff_id, fs.employee_number as fs_emp, fs.joined_date as fs_joined_date, fs.hospital_id as fs_hospital_id, h4.hospital_name as fs_hospital_name,
             CASE 
               WHEN po.officer_id IS NOT NULL THEN 'POLICE'
               WHEN jmo.jmo_id IS NOT NULL THEN 'JMO'
               WHEN mo.medical_officer_id IS NOT NULL THEN 'MEDICAL_OFFICER'
               WHEN lt.technician_id IS NOT NULL THEN 'LAB_TECHNICIAN'
               WHEN ga.analyst_id IS NOT NULL THEN 'GOVERNMENT_ANALYST'
               WHEN fs.staff_id IS NOT NULL THEN 'FORENSIC_STAFF'
               ELSE 'NONE'
             END as role
      FROM person p
      LEFT JOIN police_officer po ON p.person_id = po.person_id
      LEFT JOIN police_station ps ON po.station_id = ps.station_id
      LEFT JOIN judicial_medical_officer jmo ON p.person_id = jmo.person_id
      LEFT JOIN hospital h1 ON jmo.hospital_id = h1.hospital_id
      LEFT JOIN medical_officer mo ON p.person_id = mo.person_id
      LEFT JOIN hospital h2 ON mo.hospital_id = h2.hospital_id
      LEFT JOIN laboratory_technician lt ON p.person_id = lt.person_id
      LEFT JOIN hospital h3 ON lt.hospital_id = h3.hospital_id
      LEFT JOIN government_analyst ga ON p.person_id = ga.person_id
      LEFT JOIN forensic_staff fs ON p.person_id = fs.person_id
      LEFT JOIN hospital h4 ON fs.hospital_id = h4.hospital_id
      WHERE p.person_id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async create(data) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Insert into person
      const personQuery = `
        INSERT INTO person (first_name, last_name, nic, gender, date_of_birth, telephone, email, address, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING person_id
      `;
      const personValues = [
        data.first_name,
        data.last_name,
        data.nic || null,
        data.gender || null,
        data.date_of_birth || null,
        data.telephone || null,
        data.email || null,
        data.address || null,
        data.user_id || null
      ];
      const personResult = await client.query(personQuery, personValues);
      const personId = personResult.rows[0].person_id;

      // 2. Insert into specific staff type table
      const role = data.role.toUpperCase();
      if (role === 'POLICE') {
        const query = `
          INSERT INTO police_officer (person_id, station_id, badge_number, rank, joined_date)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(query, [personId, data.station_id, data.badge_number, data.rank, data.joined_date]);
      } else if (role === 'JMO') {
        const query = `
          INSERT INTO judicial_medical_officer (person_id, hospital_id, registration_number, specialization, joined_date)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(query, [personId, data.hospital_id, data.registration_number, data.specialization, data.joined_date]);
      } else if (role === 'MEDICAL_OFFICER') {
        const query = `
          INSERT INTO medical_officer (person_id, hospital_id, registration_number, joined_date)
          VALUES ($1, $2, $3, $4)
        `;
        await client.query(query, [personId, data.hospital_id, data.registration_number, data.joined_date]);
      } else if (role === 'LAB_TECHNICIAN') {
        const query = `
          INSERT INTO laboratory_technician (person_id, hospital_id, employee_number, qualification, joined_date)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(query, [personId, data.hospital_id, data.employee_number, data.qualification, data.joined_date]);
      } else if (role === 'GOVERNMENT_ANALYST') {
        const query = `
          INSERT INTO government_analyst (person_id, organization_name, employee_number, designation)
          VALUES ($1, $2, $3, $4)
        `;
        await client.query(query, [personId, data.organization_name, data.employee_number, data.designation]);
      } else if (role === 'FORENSIC_STAFF') {
        const query = `
          INSERT INTO forensic_staff (person_id, hospital_id, employee_number, joined_date)
          VALUES ($1, $2, $3, $4)
        `;
        await client.query(query, [personId, data.hospital_id, data.employee_number, data.joined_date]);
      } else {
        throw new Error('Invalid staff role: ' + role);
      }

      await client.query('COMMIT');
      return { person_id: personId, role };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async update(id, data) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Update person table
      const personFields = [];
      const personValues = [];
      let idx = 1;

      const personKeys = ['first_name', 'last_name', 'nic', 'gender', 'date_of_birth', 'telephone', 'email', 'address', 'user_id'];
      for (const key of personKeys) {
        if (data[key] !== undefined) {
          personFields.push(`${key} = $${idx}`);
          personValues.push(data[key]);
          idx++;
        }
      }

      if (personFields.length > 0) {
        personValues.push(id);
        const personUpdateQuery = `
          UPDATE person
          SET ${personFields.join(', ')}
          WHERE person_id = $${idx}
        `;
        await client.query(personUpdateQuery, personValues);
      }

      // 2. Update specific staff details
      const role = data.role.toUpperCase();
      if (role === 'POLICE') {
        const q = `
          UPDATE police_officer
          SET station_id = $1, badge_number = $2, rank = $3, joined_date = $4
          WHERE person_id = $5
        `;
        await client.query(q, [data.station_id, data.badge_number, data.rank, data.joined_date, id]);
      } else if (role === 'JMO') {
        const q = `
          UPDATE judicial_medical_officer
          SET hospital_id = $1, registration_number = $2, specialization = $3, joined_date = $4
          WHERE person_id = $5
        `;
        await client.query(q, [data.hospital_id, data.registration_number, data.specialization, data.joined_date, id]);
      } else if (role === 'MEDICAL_OFFICER') {
        const q = `
          UPDATE medical_officer
          SET hospital_id = $1, registration_number = $2, joined_date = $3
          WHERE person_id = $4
        `;
        await client.query(q, [data.hospital_id, data.registration_number, data.joined_date, id]);
      } else if (role === 'LAB_TECHNICIAN') {
        const q = `
          UPDATE laboratory_technician
          SET hospital_id = $1, employee_number = $2, qualification = $3, joined_date = $4
          WHERE person_id = $5
        `;
        await client.query(q, [data.hospital_id, data.employee_number, data.qualification, data.joined_date, id]);
      } else if (role === 'GOVERNMENT_ANALYST') {
        const q = `
          UPDATE government_analyst
          SET organization_name = $1, employee_number = $2, designation = $3
          WHERE person_id = $4
        `;
        await client.query(q, [data.organization_name, data.employee_number, data.designation, id]);
      } else if (role === 'FORENSIC_STAFF') {
        const q = `
          UPDATE forensic_staff
          SET hospital_id = $1, employee_number = $2, joined_date = $3
          WHERE person_id = $4
        `;
        await client.query(q, [data.hospital_id, data.employee_number, data.joined_date, id]);
      }

      await client.query('COMMIT');
      return { person_id: id, role };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async delete(id) {
    // Cascades automatically to role specific tables because of ON DELETE CASCADE
    const query = 'DELETE FROM person WHERE person_id = $1 RETURNING person_id';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = new StaffRepository();
