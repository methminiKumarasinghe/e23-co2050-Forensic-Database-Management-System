const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, me, getHospitals, getStations } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { ROLES } = require('../config/constants');

const router = Router();

// ── Public endpoints ─────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Validation covers required fields; role-specific fields validated in service
 */
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be 3–50 characters'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('email')
      .optional({ checkFalsy: true })
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email'),
    body('role')
      .isIn(Object.values(ROLES).filter((r) => r !== ROLES.ADMIN))
      .withMessage('Invalid role selected'),
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
  ],
  register
);

/**
 * POST /api/auth/login
 */
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// Public lookup endpoints (used in signup form dropdowns)
router.get('/hospitals', getHospitals);
router.get('/stations', getStations);

// ── Protected endpoints ───────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, me);

module.exports = router;
