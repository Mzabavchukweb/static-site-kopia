const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const auth = require('../middleware/auth');

// Create a new inquiry
router.post('/', auth, inquiryController.createInquiry);

// Get all user inquiries
router.get('/my-inquiries', auth, inquiryController.getUserInquiries);

// Get inquiry by ID
router.get('/:id', auth, inquiryController.getInquiryById);

// Update inquiry status (admin only)
router.patch('/:id/status', auth, inquiryController.updateInquiryStatus);

// Cancel inquiry
router.post('/:id/cancel', auth, inquiryController.cancelInquiry);

module.exports = router; 