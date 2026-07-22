const db = require('../../database');

class DocumentsRepository {
  async findAll() {
    const query = `
      SELECT d.*, u.username as creator_name, f.file_id, f.file_name, f.file_path, f.file_size, f.mime_type
      FROM document d
      LEFT JOIN users u ON d.created_by = u.user_id
      LEFT JOIN uploaded_files f ON d.document_id = f.document_id
      ORDER BY d.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  async findById(id) {
    const query = `
      SELECT d.*, u.username as creator_name, f.file_id, f.file_name, f.file_path, f.file_size, f.mime_type
      FROM document d
      LEFT JOIN users u ON d.created_by = u.user_id
      LEFT JOIN uploaded_files f ON d.document_id = f.document_id
      WHERE d.document_id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async create(docData, fileData) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Insert Document
      const docQuery = `
        INSERT INTO document (document_number, document_type, title, created_by, version, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const docValues = [
        docData.document_number,
        docData.document_type || 'ADMIN',
        docData.title,
        docData.created_by,
        docData.version || 1,
        docData.status || 'APPROVED'
      ];
      const docResult = await client.query(docQuery, docValues);
      const newDoc = docResult.rows[0];

      // 2. Insert File Attachment
      let newFile = null;
      if (fileData) {
        const fileQuery = `
          INSERT INTO uploaded_files (document_id, file_name, file_path, file_size, mime_type, uploaded_by)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const fileValues = [
          newDoc.document_id,
          fileData.file_name,
          fileData.file_path,
          fileData.file_size,
          fileData.mime_type,
          docData.created_by
        ];
        const fileResult = await client.query(fileQuery, fileValues);
        newFile = fileResult.rows[0];
      }

      await client.query('COMMIT');
      return { ...newDoc, file: newFile };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateStatus(id, status) {
    const query = `
      UPDATE document
      SET status = $1
      WHERE document_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [status, id]);
    return result.rows[0];
  }
}

module.exports = new DocumentsRepository();
