const documentsRepository = require('../../repositories/admin/documents.repository');

class DocumentsService {
  async getAllDocuments() {
    return await documentsRepository.findAll();
  }

  async getDocumentById(id) {
    const doc = await documentsRepository.findById(id);
    if (!doc) {
      const error = new Error('Document not found');
      error.status = 404;
      throw error;
    }
    return doc;
  }

  async uploadAdminDocument(data, file, userId) {
    // Generate document number
    const timestamp = Date.now();
    const document_number = `DOC-ADMIN-${timestamp}`;

    const docData = {
      document_number,
      document_type: 'ADMIN',
      title: data.title || file.originalname,
      created_by: userId,
      status: 'APPROVED',
      version: 1
    };

    const fileData = {
      file_name: file.originalname,
      file_path: file.path,
      file_size: file.size,
      mime_type: file.mimetype
    };

    return await documentsRepository.create(docData, fileData);
  }

  async archiveDocument(id) {
    await this.getDocumentById(id);
    return await documentsRepository.updateStatus(id, 'ARCHIVED');
  }
}

module.exports = new DocumentsService();
