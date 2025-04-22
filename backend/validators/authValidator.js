const { body } = require('express-validator');

const registerValidation = [
    body('email')
        .isEmail()
        .withMessage('Proszę podać prawidłowy adres email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Hasło musi mieć co najmniej 6 znaków')
        .matches(/\d/)
        .withMessage('Hasło musi zawierać co najmniej jedną cyfrę'),
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('Imię jest wymagane')
        .isLength({ min: 2 })
        .withMessage('Imię musi mieć co najmniej 2 znaki'),
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Nazwisko jest wymagane')
        .isLength({ min: 2 })
        .withMessage('Nazwisko musi mieć co najmniej 2 znaki'),
    body('companyName')
        .trim()
        .notEmpty()
        .withMessage('Nazwa firmy jest wymagana'),
    body('nip')
        .trim()
        .notEmpty()
        .withMessage('NIP jest wymagany')
        .matches(/^\d{10}$/)
        .withMessage('NIP musi składać się z 10 cyfr'),
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Numer telefonu jest wymagany')
        .matches(/^[0-9+\-\s()]{9,}$/)
        .withMessage('Proszę podać prawidłowy numer telefonu'),
    body('address.street')
        .trim()
        .notEmpty()
        .withMessage('Ulica jest wymagana'),
    body('address.postalCode')
        .trim()
        .notEmpty()
        .withMessage('Kod pocztowy jest wymagany')
        .matches(/^\d{2}-\d{3}$/)
        .withMessage('Proszę podać prawidłowy kod pocztowy (format: XX-XXX)'),
    body('address.city')
        .trim()
        .notEmpty()
        .withMessage('Miasto jest wymagane')
];

const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Proszę podać prawidłowy adres email')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Hasło jest wymagane')
];

module.exports = {
    registerValidation,
    loginValidation
}; 