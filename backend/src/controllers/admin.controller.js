const {
  getPendingUsers,
  getAllUsers,
  getUserById,
  approveUser,
  suspendUser,
  reactivateUser,
} = require('../services/user.service');
const {
  getDashboardStats,
  rejectUser,
  resetUserPassword,
  getAuditLogsList,
  getNotificationsList,
  logAudit,
  getCasesList,
  getReportsList,
  getLabRequestsList,
  getHospitalsList,
  getStationsList,
} = require('../services/admin.service');
const { sendSuccess, sendBadRequest } = require('../utils/response');

/**
 * GET /api/admin/stats
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    return sendSuccess(res, {
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users/pending
 */
const listPendingUsers = async (req, res, next) => {
  try {
    const users = await getPendingUsers();
    return sendSuccess(res, {
      message: `${users.length} pending user(s) found`,
      data: users,
      meta: { count: users.length },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users
 * Query params: status, role
 */
const listAllUsers = async (req, res, next) => {
  try {
    const { status, role } = req.query;
    const users = await getAllUsers({ status, role });
    return sendSuccess(res, {
      data: users,
      meta: { count: users.length },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users/:id
 */
const getUser = async (req, res, next) => {
  try {
    // Attempt to get user from DB
    const user = await getUserById(req.params.id);
    return sendSuccess(res, { data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/approve
 */
const approve = async (req, res, next) => {
  try {
    const user = await approveUser(req.params.id);

    // Audit log
    await logAudit(
      req.user.user_id,
      'APPROVE_USER',
      'users',
      user.user_id,
      `Approved user registration for username: ${user.username}`
    );

    return sendSuccess(res, {
      message: `User ${user.username} approved successfully`,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/suspend
 */
const suspend = async (req, res, next) => {
  try {
    const user = await suspendUser(req.params.id);

    // Audit log
    await logAudit(
      req.user.user_id,
      'DEACTIVATE_USER',
      'users',
      user.user_id,
      `Suspended (deactivated) user: ${user.username}`
    );

    return sendSuccess(res, {
      message: `User ${user.username} suspended`,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/reactivate
 */
const reactivate = async (req, res, next) => {
  try {
    const user = await reactivateUser(req.params.id);

    // Audit log
    await logAudit(
      req.user.user_id,
      'ACTIVATE_USER',
      'users',
      user.user_id,
      `Reactivated (activated) user: ${user.username}`
    );

    return sendSuccess(res, {
      message: `User ${user.username} reactivated`,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/users/:id/reject
 */
const reject = async (req, res, next) => {
  try {
    await rejectUser(req.params.id, req.user.user_id);
    return sendSuccess(res, {
      message: 'User registration request rejected and deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/users/:id/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return sendBadRequest(res, 'New password is required and must be at least 8 characters');
    }

    await resetUserPassword(req.params.id, password, req.user.user_id);

    return sendSuccess(res, {
      message: 'User password reset successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/audit-logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const search = req.query.search || '';

    const result = await getAuditLogsList({ limit, offset, search });

    return sendSuccess(res, {
      message: 'Audit logs retrieved successfully',
      data: result.logs,
      meta: { total: result.total, limit, offset },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;

    const result = await getNotificationsList({ limit, offset });

    return sendSuccess(res, {
      message: 'Notifications retrieved successfully',
      data: result.notifications,
      meta: { total: result.total, limit, offset },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/cases
 */
const getCases = async (req, res, next) => {
  try {
    const data = await getCasesList();
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/reports
 */
const getReports = async (req, res, next) => {
  try {
    const data = await getReportsList();
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/lab-requests
 */
const getLabRequests = async (req, res, next) => {
  try {
    const data = await getLabRequestsList();
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/hospitals
 */
const getHospitals = async (req, res, next) => {
  try {
    const data = await getHospitalsList();
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/stations
 */
const getStations = async (req, res, next) => {
  try {
    const data = await getStationsList();
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
  getCases,
  getReports,
  getLabRequests,
  getHospitals,
  getStations,
};
