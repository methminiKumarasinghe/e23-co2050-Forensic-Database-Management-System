const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  async login(username, password) {
    // 1. Check if user exists
    const userResult = await db.query(
      `SELECT user_id, username, password_hash, email, phone, status 
       FROM users WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = userResult.rows[0];

    // 2. Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new Error(`User account is ${user.status.toLowerCase()}`);
    }

    // 3. Verify password
    // Using bcrypt to compare provided password with password_hash
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error('Invalid username or password');
    }

    // 4. Fetch user roles
    const rolesResult = await db.query(
      `SELECT r.role_name 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = $1`,
      [user.user_id]
    );
    const roles = rolesResult.rows.map(row => row.role_name);

    // 5. Update last_login
    await db.query(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1`, [user.user_id]);

    // 6. Generate JWT
    const payload = {
      userId: user.user_id,
      user_id: user.user_id,
      username: user.username,
      roles: roles
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

    // Remove password_hash from the returned profile
    delete user.password_hash;

    return {
      token,
      profile: user,
      roles: roles
    };
  }

  async getMe(userId) {
    const userResult = await db.query(
      `SELECT user_id, username, email, phone, status, created_at, last_login 
       FROM users WHERE user_id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    const rolesResult = await db.query(
      `SELECT r.role_name 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );
    const roles = rolesResult.rows.map(row => row.role_name);

    return {
      profile: user,
      roles: roles
    };
  }
}

module.exports = new AuthService();
