const casesRepository = require('../../repositories/admin/cases.repository');

class CasesController {
  async getAllCases(req, res, next) {
    try {
      const filters = {
        case_number: req.query.case_number,
        status: req.query.status,
        station_id: req.query.station_id
      };
      const cases = await casesRepository.findAll(filters);
      res.status(200).json(cases);
    } catch (error) {
      next(error);
    }
  }

  async getCaseById(req, res, next) {
    try {
      const caseData = await casesRepository.findById(req.params.id);
      if (!caseData) {
        return res.status(404).json({ error: 'Case not found' });
      }
      res.status(200).json(caseData);
    } catch (error) {
      next(error);
    }
  }

  async getCaseTimeline(req, res, next) {
    try {
      const timeline = await casesRepository.getTimeline(req.params.id);
      res.status(200).json(timeline);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CasesController();
