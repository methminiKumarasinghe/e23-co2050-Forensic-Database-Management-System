const policeStationsService = require('../../services/admin/policestations.service');

class PoliceStationsController {
  async getAllPoliceStations(req, res, next) {
    try {
      const stations = await policeStationsService.getAllPoliceStations();
      res.status(200).json(stations);
    } catch (error) {
      next(error);
    }
  }

  async getPoliceStationById(req, res, next) {
    try {
      const station = await policeStationsService.getPoliceStationById(req.params.id);
      res.status(200).json(station);
    } catch (error) {
      next(error);
    }
  }

  async createPoliceStation(req, res, next) {
    try {
      const station = await policeStationsService.createPoliceStation(req.body);
      res.status(201).json({ message: 'Police station created successfully', station });
    } catch (error) {
      next(error);
    }
  }

  async updatePoliceStation(req, res, next) {
    try {
      const station = await policeStationsService.updatePoliceStation(req.params.id, req.body);
      res.status(200).json({ message: 'Police station updated successfully', station });
    } catch (error) {
      next(error);
    }
  }

  async deletePoliceStation(req, res, next) {
    try {
      await policeStationsService.deletePoliceStation(req.params.id);
      res.status(200).json({ message: 'Police station deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PoliceStationsController();
