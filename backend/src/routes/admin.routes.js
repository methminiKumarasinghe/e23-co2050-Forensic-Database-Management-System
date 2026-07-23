const { Router } = require('express');
const {
  getStats,
  listPendingUsers,
  listAllUsers,
  getUser,
  approve,
  suspend,
  reactivate,
  reject,
  resetPassword,
  getAuditLogs,
  getNotifications,
} = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// Dashboard stats
router.get('/stats', getStats);

// User management
router.get('/users/pending', listPendingUsers);
router.get('/users', listAllUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id/approve', approve);
router.patch('/users/:id/suspend', suspend);
router.patch('/users/:id/reactivate', reactivate);
router.delete('/users/:id/reject', reject);
router.post('/users/:id/reset-password', resetPassword);

// Audits & Notifications
router.get('/audit-logs', getAuditLogs);
router.get('/notifications', getNotifications);

module.exports = router;
