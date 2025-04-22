const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/inquiries - Tworzenie nowego zapytania (wymaga zalogowania)
router.post('/', authMiddleware.protect, inquiryController.createInquiry);

// --- Endpointy dla administratora (zarządzanie zapytaniami) ---

// GET /api/inquiries - Pobierz wszystkie zapytania (admin)
router.get('/', authMiddleware.protect, authMiddleware.restrictTo('admin'), inquiryController.getAllInquiries);

// GET /api/inquiries/:id - Pobierz konkretne zapytanie (admin)
router.get('/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), inquiryController.getInquiryById);

// PUT /api/inquiries/:id/status - Aktualizuj status zapytania (admin)
router.put('/:id/status', authMiddleware.protect, authMiddleware.restrictTo('admin'), inquiryController.updateInquiryStatus);

// // DELETE /api/inquiries/:id - Usuń zapytanie (admin) - Opcjonalnie
// router.delete('/:id', authMiddleware.protect, authMiddleware.restrictTo('admin'), inquiryController.deleteInquiry);

module.exports = router; 