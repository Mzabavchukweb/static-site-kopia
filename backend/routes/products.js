const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

// Publiczne endpointy - dostępne dla wszystkich
router.get('/public', productController.getPublicProducts);
router.get('/public/:id', productController.getPublicProductById);

// Chronione endpointy - wymagają logowania
router.get('/', authMiddleware.protect, productController.getAllProducts);
router.get('/:id', authMiddleware.protect, productController.getProductById);

// Endpointy administracyjne - wymagają roli admin
router.post('/', authMiddleware.protect, authMiddleware.restrictTo('admin'), productController.createProduct);

module.exports = router; 