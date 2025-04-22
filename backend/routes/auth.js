const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getProfile, verifyEmail, checkCompany } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateMiddleware');

// Walidacja danych rejestracji
const registerValidation = [
    body('firstName').trim().notEmpty().withMessage('Imię jest wymagane'),
    body('lastName').trim().notEmpty().withMessage('Nazwisko jest wymagane'),
    body('email').isEmail().withMessage('Nieprawidłowy format email'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Hasło musi mieć minimum 8 znaków')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Hasło musi zawierać wielkie litery, małe litery, cyfry i znaki specjalne'),
    body('companyName').trim().notEmpty().withMessage('Nazwa firmy jest wymagana'),
    body('companyCountry').isIn(['PL', 'DE', 'CZ']).withMessage('Nieobsługiwany kraj'),
    body('nip').trim().notEmpty().withMessage('NIP jest wymagany'),
    body('phone').trim().notEmpty().withMessage('Numer telefonu jest wymagany'),
    body('address.street').trim().notEmpty().withMessage('Ulica jest wymagana'),
    body('address.postalCode').trim().notEmpty().withMessage('Kod pocztowy jest wymagany'),
    body('address.city').trim().notEmpty().withMessage('Miasto jest wymagane')
];

// Walidacja danych logowania
const loginValidation = [
    body('email').isEmail().withMessage('Nieprawidłowy format email'),
    body('password').notEmpty().withMessage('Hasło jest wymagane')
];

// Rejestracja nowego użytkownika
router.post('/register', registerValidation, validateRequest, register);

// Logowanie użytkownika
router.post('/login', loginValidation, validateRequest, login);

// Weryfikacja emaila
router.get('/verify-email/:token', verifyEmail);

// Pobranie profilu zalogowanego użytkownika
router.get('/profile', protect, getProfile);

// Sprawdzanie czy firma istnieje
router.post('/check-company', checkCompany);

module.exports = router; 