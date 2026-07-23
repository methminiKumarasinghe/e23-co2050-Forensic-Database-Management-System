const { validationResult } = require('express-validator');
const { registerUser, loginUser, getCurrentUser } = require('../services/auth.service');
const {
  sendCreated,
  sendSuccess,
  sendError,
  sendBadRequest,
  sendForbidden,
} = require('../utils/response');
const { query } = require('../config/db');

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendBadRequest(res, 'Validation failed', errors.array());
    }

    const user = await registerUser(req.body);

    return sendCreated(res, {
      message: 'Registration successful. Your account is waiting for administrator approval.',
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendBadRequest(res, 'Validation failed', errors.array());
    }

    const { username, password } = req.body;

    const result = await loginUser({ username, password });

    return sendSuccess(res, {
      message: 'Login successful',
      data: result,
    });
  } catch (err) {
    // Special handling for pending users
    if (err.isPending) {
      return sendForbidden(res, 'Your account is waiting for administrator approval.');
    }
    next(err);
  }
};

/**
 * GET /api/auth/me  (requires authentication)
 */
const me = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.user_id);
    return sendSuccess(res, { data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/hospitals  — public, used in signup form
 */
const getHospitals = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT hospital_id, hospital_name, hospital_type, district
       FROM hospital
       ORDER BY hospital_name ASC`
    );
    return sendSuccess(res, { data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/stations  — public, used in signup form
 */
const getStations = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT station_id, station_name, district
       FROM police_station
       ORDER BY station_name ASC`
    );
    return sendSuccess(res, { data: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me, getHospitals, getStations };
