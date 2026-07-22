const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentsController = require('../../controllers/admin/documents.controller');
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

// Ensure uploads directory exists
const uploadDir = 'uploads/documents/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB limit
});

router.get('/', documentsController.getAllDocuments);
router.get('/:id', documentsController.getDocumentById);
router.post('/', upload.single('file'), documentsController.uploadDocument);
router.get('/download/:id', documentsController.downloadDocument);
router.put('/:id/archive', documentsController.archiveDocument);

module.exports = router;
