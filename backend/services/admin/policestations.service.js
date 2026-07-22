const policeStationsRepository = require('../../repositories/admin/policestations.repository');

class PoliceStationsService {
  async getAllPoliceStations() {
    return await policeStationsRepository.findAll();
  }

  async getPoliceStationById(id) {
    const station = await policeStationsRepository.findById(id);
    if (!station) {
      const error = new Error('Police station not found');
      error.status = 404;
      throw error;
    }
    return station;
  }

  async createPoliceStation(data) {
    return await policeStationsRepository.create(data);
  }

  async updatePoliceStation(id, data) {
    await this.getPoliceStationById(id);
    return await policeStationsRepository.update(id, data);
  }

  async deletePoliceStation(id) {
    await this.getPoliceStationById(id);
    const success = await policeStationsRepository.delete(id);
    if (!success) {
      throw new Error('Failed to delete police station');
    }
  }
}

module.exports = new PoliceStationsService();
