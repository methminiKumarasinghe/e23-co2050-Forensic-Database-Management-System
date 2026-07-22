const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const db = require('../database');

router.use(authenticateToken);

// Get notifications for currently logged-in user
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.user_id || req.user.userId;
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res, next) => {
  try {
    const userId = req.user.user_id || req.user.userId;
    const notificationId = req.params.id;
    const query = `
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE notification_id = $1 AND user_id = $2 
      RETURNING *
    `;
    const result = await db.query(query, [notificationId, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
