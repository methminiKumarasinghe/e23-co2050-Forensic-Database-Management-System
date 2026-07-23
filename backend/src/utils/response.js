/**
 * Standardized API response helpers.
 * Every endpoint uses these so the frontend always receives a consistent shape:
 *   { success, message, data?, errors?, meta? }
 */

const sendSuccess = (res, { message = 'Success', data = null, meta = null, statusCode = 200 } = {}) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

const sendError = (res, { message = 'An error occurred', errors = null, statusCode = 500 } = {}) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};

const sendCreated = (res, { message = 'Created successfully', data = null } = {}) =>
  sendSuccess(res, { message, data, statusCode: 201 });

const sendNotFound = (res, message = 'Resource not found') =>
  sendError(res, { message, statusCode: 404 });

const sendUnauthorized = (res, message = 'Authentication required') =>
  sendError(res, { message, statusCode: 401 });

const sendForbidden = (res, message = 'Access denied') =>
  sendError(res, { message, statusCode: 403 });

const sendBadRequest = (res, message = 'Bad request', errors = null) =>
  sendError(res, { message, errors, statusCode: 400 });

module.exports = {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendBadRequest,
};
