const { Router } = require('express');
const {
  listPendingUsers,
  listAllUsers,
  getUser,
  approve,
  suspend,
  reactivate,
} = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// User management
router.get('/users/pending', listPendingUsers);
router.get('/users', listAllUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id/approve', approve);
router.patch('/users/:id/suspend', suspend);
router.patch('/users/:id/reactivate', reactivate);

module.exports = router;
