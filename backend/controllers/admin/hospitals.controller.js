const hospitalsService = require('../../services/admin/hospitals.service');

class HospitalsController {
  async getAllHospitals(req, res, next) {
    try {
      const hospitals = await hospitalsService.getAllHospitals();
      res.status(200).json(hospitals);
    } catch (error) {
      next(error);
    }
  }

  async getHospitalById(req, res, next) {
    try {
      const hospital = await hospitalsService.getHospitalById(req.params.id);
      res.status(200).json(hospital);
    } catch (error) {
      next(error);
    }
  }

  async createHospital(req, res, next) {
    try {
      const hospital = await hospitalsService.createHospital(req.body);
      res.status(201).json({ message: 'Hospital created successfully', hospital });
    } catch (error) {
      next(error);
    }
  }

  async updateHospital(req, res, next) {
    try {
      const hospital = await hospitalsService.updateHospital(req.params.id, req.body);
      res.status(200).json({ message: 'Hospital updated successfully', hospital });
    } catch (error) {
      next(error);
    }
  }

  async deleteHospital(req, res, next) {
    try {
      await hospitalsService.deleteHospital(req.params.id);
      res.status(200).json({ message: 'Hospital deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HospitalsController();
