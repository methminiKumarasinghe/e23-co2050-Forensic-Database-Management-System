const staffService = require('../../services/admin/staff.service');

class StaffController {
  async getAllStaff(req, res, next) {
    try {
      const staff = await staffService.getAllStaff();
      res.status(200).json(staff);
    } catch (error) {
      next(error);
    }
  }

  async getStaffById(req, res, next) {
    try {
      const staff = await staffService.getStaffById(req.params.id);
      res.status(200).json(staff);
    } catch (error) {
      next(error);
    }
  }

  async createStaff(req, res, next) {
    try {
      const staff = await staffService.createStaff(req.body);
      res.status(201).json({ message: 'Staff member registered successfully', staff });
    } catch (error) {
      next(error);
    }
  }

  async updateStaff(req, res, next) {
    try {
      const staff = await staffService.updateStaff(req.params.id, req.body);
      res.status(200).json({ message: 'Staff details updated successfully', staff });
    } catch (error) {
      next(error);
    }
  }

  async deleteStaff(req, res, next) {
    try {
      await staffService.deleteStaff(req.params.id);
      res.status(200).json({ message: 'Staff member removed successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StaffController();
