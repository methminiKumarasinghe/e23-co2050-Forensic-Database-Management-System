const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
