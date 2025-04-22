const { body, param } = require('express-validator');

const createProductValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Nazwa produktu jest wymagana')
        .isLength({ min: 3 })
        .withMessage('Nazwa produktu musi mieć co najmniej 3 znaki'),
    body('oemNumber')
        .trim()
        .notEmpty()
        .withMessage('Numer OEM jest wymagany')
        .matches(/^[A-Z0-9-]+$/)
        .withMessage('Numer OEM może zawierać tylko wielkie litery, cyfry i myślniki'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Opis nie może przekraczać 1000 znaków'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Cena musi być liczbą dodatnią'),
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Kategoria jest wymagana'),
    body('brand')
        .trim()
        .notEmpty()
        .withMessage('Marka jest wymagana'),
    body('images')
        .optional()
        .isArray()
        .withMessage('Obrazy muszą być tablicą'),
    body('images.*')
        .optional()
        .isURL()
        .withMessage('Nieprawidłowy format URL obrazu'),
    body('specifications')
        .optional()
        .isObject()
        .withMessage('Specyfikacje muszą być obiektem'),
    body('availability')
        .optional()
        .isIn(['available', 'on_order', 'unavailable'])
        .withMessage('Nieprawidłowy status dostępności'),
    body('estimatedDeliveryTime')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Szacowany czas dostawy musi być liczbą całkowitą nieujemną')
];

const updateProductValidation = [
    param('id')
        .isMongoId()
        .withMessage('Nieprawidłowy format ID produktu'),
    ...createProductValidation
];

const getProductValidation = [
    param('id')
        .isMongoId()
        .withMessage('Nieprawidłowy format ID produktu')
];

module.exports = {
    createProductValidation,
    updateProductValidation,
    getProductValidation
}; 