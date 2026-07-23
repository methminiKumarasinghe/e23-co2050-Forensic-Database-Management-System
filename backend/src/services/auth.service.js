const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { withTransaction, query } = require('../config/db');
const {
  ROLES,
  ROLE_IDS,
  USER_STATUS,
  HOSPITAL_ROLES,
  STATION_ROLES,
} = require('../config/constants');

/**
 * ─── REGISTER ────────────────────────────────────────────────────────────────
 * Inserts into: users → person → user_roles → role-specific staff table
 * All inside a single transaction so failures roll back cleanly.
 */
const registerUser = async ({
  username,
  password,
  email,
  phone,
  role,
  // Personal details
  first_name,
  last_name,
  nic,
  gender,
  date_of_birth,
  telephone,
  address,
  // Role-specific
  hospital_id,
  station_id,
  badge_number,
  rank,
  registration_number,
  specialization,
  employee_number,
  qualification,
  organization_name,
  designation,
}) => {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  const password_hash = await bcrypt.hash(password, saltRounds);

  return withTransaction(async (client) => {
    // 1. Insert into users (status = INACTIVE → pending approval)
    const userResult = await client.query(
      `INSERT INTO users (username, password_hash, email, phone, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, username, email, status, created_at`,
      [username, password_hash, email || null, phone || null, USER_STATUS.INACTIVE]
    );
    const user = userResult.rows[0];

    // 2. Insert into person
    const personResult = await client.query(
      `INSERT INTO person (user_id, first_name, last_name, nic, gender, date_of_birth, telephone, email, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING person_id`,
      [
        user.user_id,
        first_name,
        last_name,
        nic || null,
        gender || null,
        date_of_birth || null,
        telephone || null,
        email || null,
        address || null,
      ]
    );
    const person_id = personResult.rows[0].person_id;

    // 3. Assign role
    const roleId = ROLE_IDS[role];
    await client.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
      [user.user_id, roleId]
    );

    // 4. Insert into the role-specific staff table
    await insertStaffRecord(client, {
      role,
      person_id,
      hospital_id,
      station_id,
      badge_number,
      rank,
      registration_number,
      specialization,
      employee_number,
      qualification,
      organization_name,
      designation,
    });

    return {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      status: user.status,
      role,
      created_at: user.created_at,
    };
  });
};

/**
 * Insert record into the correct role-specific staff table.
 */
const insertStaffRecord = async (client, {
  role,
  person_id,
  hospital_id,
  station_id,
  badge_number,
  rank,
  registration_number,
  specialization,
  employee_number,
  qualification,
  organization_name,
  designation,
}) => {
  switch (role) {
    case ROLES.POLICE:
      await client.query(
        `INSERT INTO police_officer (person_id, station_id, badge_number, rank, joined_date)
         VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
        [person_id, station_id, badge_number || null, rank || null]
      );
      break;

    case ROLES.JMO:
      await client.query(
        `INSERT INTO judicial_medical_officer (person_id, hospital_id, registration_number, specialization, joined_date)
         VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
        [person_id, hospital_id, registration_number || null, specialization || null]
      );
      break;

    case ROLES.MEDICAL_OFFICER:
      await client.query(
        `INSERT INTO medical_officer (person_id, hospital_id, registration_number, joined_date)
         VALUES ($1, $2, $3, CURRENT_DATE)`,
        [person_id, hospital_id, registration_number || null]
      );
      break;

    case ROLES.LAB_TECHNICIAN:
      await client.query(
        `INSERT INTO laboratory_technician (person_id, hospital_id, employee_number, qualification, joined_date)
         VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
        [person_id, hospital_id, employee_number || null, qualification || null]
      );
      break;

    case ROLES.GOVERNMENT_ANALYST:
      await client.query(
        `INSERT INTO government_analyst (person_id, organization_name, employee_number, designation)
         VALUES ($1, $2, $3, $4)`,
        [person_id, organization_name || null, employee_number || null, designation || null]
      );
      break;

    default:
      throw new Error(`Unknown role for staff insertion: ${role}`);
  }
};

/**
 * ─── LOGIN ───────────────────────────────────────────────────────────────────
 */
const loginUser = async ({ username, password }) => {
  // Fetch user with their role
  const result = await query(
    `SELECT u.user_id, u.username, u.password_hash, u.email, u.status,
            r.role_name AS role, r.role_id
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.user_id
     JOIN roles r ON r.role_id = ur.role_id
     WHERE u.username = $1
     LIMIT 1`,
    [username]
  );

  if (result.rowCount === 0) {
    const err = new Error('Invalid username or password');
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];

  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    const err = new Error('Invalid username or password');
    err.statusCode = 401;
    throw err;
  }

  // Check status
  if (user.status === USER_STATUS.INACTIVE) {
    const err = new Error('PENDING_APPROVAL');
    err.statusCode = 403;
    err.isPending = true;
    throw err;
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    const err = new Error('Your account has been suspended. Please contact the administrator.');
    err.statusCode = 403;
    throw err;
  }

  // Update last_login
  await query(
    `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`,
    [user.user_id]
  );

  // Sign JWT
  const token = jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      status: user.status,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return {
    token,
    user: {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
};

/**
 * ─── GET CURRENT USER ────────────────────────────────────────────────────────
 */
const getCurrentUser = async (user_id) => {
  const result = await query(
    `SELECT u.user_id, u.username, u.email, u.phone, u.status, u.created_at, u.last_login,
            r.role_name AS role,
            p.first_name, p.last_name, p.nic, p.gender, p.date_of_birth, p.address
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.user_id
     JOIN roles r ON r.role_id = ur.role_id
     LEFT JOIN person p ON p.user_id = u.user_id
     WHERE u.user_id = $1
     LIMIT 1`,
    [user_id]
  );

  if (result.rowCount === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

module.exports = { registerUser, loginUser, getCurrentUser };
