const notificationsRepository = require('../../repositories/admin/notifications.repository');

class NotificationsService {
  async getAllNotifications() {
    return await notificationsRepository.findAll();
  }

  async sendNotification(data) {
    const { message, notification_type, user_id, role_id, all_users } = data;
    
    let targetUsers = [];

    if (all_users) {
      targetUsers = await notificationsRepository.getAllUsers();
    } else if (role_id) {
      targetUsers = await notificationsRepository.getUsersByRole(role_id);
    } else if (user_id) {
      targetUsers = [user_id];
    } else {
      throw new Error('You must specify a target (user_id, role_id, or all_users)');
    }

    const count = await notificationsRepository.createMultiple(targetUsers, message, notification_type);
    return count;
  }
}

module.exports = new NotificationsService();
