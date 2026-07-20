const { body, param } = require('express-validator');

const updateRequestStatusValidator = [
  param('id').isUUID().withMessage('Valid request ID is required'),
  body('status').isIn(['ACCEPTED', 'REJECTED']).withMessage('Status must be ACCEPTED or REJECTED')
];

const createTestValidator = [
  body('request_id').isUUID().withMessage('Valid request_id is required'),
  body('test_name').notEmpty().withMessage('Test name is required'),
  body('test_category').optional().isString(),
  body('expected_completion_date').optional().isISO8601()
];

const updateTestValidator = [
  param('id').isUUID().withMessage('Valid test ID is required'),
  body('test_name').optional().isString(),
  body('test_category').optional().isString(),
  body('expected_completion_date').optional().isISO8601(),
  body('remarks').optional().isString(),
  body('status').optional().isString()
];

const createResultValidator = [
  body('test_id').isUUID().withMessage('Valid test_id is required'),
  body('findings').notEmpty().withMessage('Findings/Test Result are required'),
  body('interpretation').optional().isString()
];

const updateResultValidator = [
  param('id').isUUID().withMessage('Valid result ID is required'),
  body('findings').optional().isString(),
  body('interpretation').optional().isString()
];

module.exports = {
  updateRequestStatusValidator,
  createTestValidator,
  updateTestValidator,
  createResultValidator,
  updateResultValidator
};
