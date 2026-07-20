const notificationsService = require('../../services/admin/notifications.service');

class NotificationsController {
  async getAllNotifications(req, res, next) {
    try {
      const notifications = await notificationsService.getAllNotifications();
      res.status(200).json(notifications);
    } catch (error) {
      next(error);
    }
  }

  async createNotification(req, res, next) {
    try {
      const sentCount = await notificationsService.sendNotification(req.body);
      res.status(201).json({ message: `Notification sent to ${sentCount} user(s)` });
    } catch (error) {
      if (error.message.includes('target')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new NotificationsController();
