const {
  getPendingUsers,
  getAllUsers,
  getUserById,
  approveUser,
  suspendUser,
  reactivateUser,
} = require('../services/user.service');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

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
    return sendSuccess(res, {
      message: `User ${user.username} reactivated`,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listPendingUsers, listAllUsers, getUser, approve, suspend, reactivate };
