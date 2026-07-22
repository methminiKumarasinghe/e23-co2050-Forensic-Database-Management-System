const settingsRepository = require('../../repositories/admin/settings.repository');

class SettingsController {
  async getAllSettings(req, res, next) {
    try {
      const settings = await settingsRepository.findAll();
      res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      await settingsRepository.updateSettings(req.body);
      res.status(200).json({ message: 'Settings updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SettingsController();
