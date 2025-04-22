const { body, param } = require('express-validator');

const createInquiryValidation = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Zapytanie musi zawierać co najmniej jeden produkt'),
    body('items.*.product')
        .isMongoId()
        .withMessage('Nieprawidłowy format ID produktu'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Ilość musi być liczbą całkowitą większą od 0'),
    body('items.*.price')
        .isFloat({ min: 0 })
        .withMessage('Cena musi być liczbą dodatnią'),
    body('estimatedValue')
        .isFloat({ min: 0 })
        .withMessage('Szacunkowa wartość musi być liczbą dodatnią'),
    body('b2bDiscount')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Rabat B2B musi być liczbą z zakresu 0-100'),
    body('deliveryCost')
        .isFloat({ min: 0 })
        .withMessage('Koszt dostawy musi być liczbą dodatnią'),
    body('totalAmount')
        .isFloat({ min: 0 })
        .withMessage('Łączna kwota musi być liczbą dodatnią'),
    body('deliveryAddress.street')
        .trim()
        .notEmpty()
        .withMessage('Ulica jest wymagana'),
    body('deliveryAddress.postalCode')
        .trim()
        .notEmpty()
        .withMessage('Kod pocztowy jest wymagany')
        .matches(/^\d{2}-\d{3}$/)
        .withMessage('Proszę podać prawidłowy kod pocztowy (format: XX-XXX)'),
    body('deliveryAddress.city')
        .trim()
        .notEmpty()
        .withMessage('Miasto jest wymagane'),
    body('deliveryAddress.country')
        .trim()
        .notEmpty()
        .withMessage('Kraj jest wymagany'),
    body('preferredDeliveryDate')
        .optional()
        .isISO8601()
        .withMessage('Nieprawidłowy format daty')
        .custom((value) => {
            const date = new Date(value);
            const now = new Date();
            return date > now;
        })
        .withMessage('Data dostawy musi być w przyszłości'),
    body('deliveryMethod')
        .isIn(['standard', 'express'])
        .withMessage('Nieprawidłowa metoda dostawy'),
    body('paymentMethod')
        .isIn(['bank_transfer', 'credit_card'])
        .withMessage('Nieprawidłowa metoda płatności'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Uwagi nie mogą przekraczać 1000 znaków')
];

const updateInquiryValidation = [
    param('id')
        .isMongoId()
        .withMessage('Nieprawidłowy format ID zapytania'),
    body('status')
        .isIn(['pending', 'processing', 'completed', 'cancelled'])
        .withMessage('Nieprawidłowy status zapytania')
];

const getInquiryValidation = [
    param('id')
        .isMongoId()
        .withMessage('Nieprawidłowy format ID zapytania')
];

module.exports = {
    createInquiryValidation,
    updateInquiryValidation,
    getInquiryValidation
}; 