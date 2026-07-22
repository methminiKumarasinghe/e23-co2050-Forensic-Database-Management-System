const path = require('path');
const fs = require('fs');
const documentsService = require('../../services/admin/documents.service');

class DocumentsController {
  async getAllDocuments(req, res, next) {
    try {
      const docs = await documentsService.getAllDocuments();
      res.status(200).json(docs);
    } catch (error) {
      next(error);
    }
  }

  async getDocumentById(req, res, next) {
    try {
      const doc = await documentsService.getDocumentById(req.params.id);
      res.status(200).json(doc);
    } catch (error) {
      next(error);
    }
  }

  async uploadDocument(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const userId = req.user.userId;
      const newDoc = await documentsService.uploadAdminDocument(req.body, req.file, userId);
      res.status(201).json({ message: 'Document uploaded successfully', document: newDoc });
    } catch (error) {
      next(error);
    }
  }

  async downloadDocument(req, res, next) {
    try {
      const doc = await documentsService.getDocumentById(req.params.id);
      if (!doc || !doc.file_path) {
        return res.status(404).json({ error: 'File attachment not found' });
      }

      // Check if file exists on disk
      const fullPath = path.resolve(doc.file_path);
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }

      res.download(fullPath, doc.file_name);
    } catch (error) {
      next(error);
    }
  }

  async archiveDocument(req, res, next) {
    try {
      const doc = await documentsService.archiveDocument(req.params.id);
      res.status(200).json({ message: 'Document archived successfully', document: doc });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DocumentsController();
