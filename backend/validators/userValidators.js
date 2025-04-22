const { body } = require('express-validator');

exports.registerValidation = [
    body('email')
        .isEmail()
        .withMessage('Nieprawidłowy format adresu email')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Hasło musi mieć co najmniej 8 znaków')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Hasło musi zawierać co najmniej jedną wielką literę, jedną małą literę, jedną cyfrę i jeden znak specjalny'),
    
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Imię musi mieć od 2 do 50 znaków'),
    
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Nazwisko musi mieć od 2 do 50 znaków'),
    
    body('companyName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nazwa firmy musi mieć od 2 do 100 znaków'),
    
    body('nip')
        .trim()
        .matches(/^\d{10}$/)
        .withMessage('NIP musi składać się z 10 cyfr'),
    
    body('phone')
        .trim()
        .matches(/^\+?[0-9\s-]{9,}$/)
        .withMessage('Nieprawidłowy format numeru telefonu'),
    
    body('address.street')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nazwa ulicy musi mieć od 2 do 100 znaków'),
    
    body('address.postalCode')
        .trim()
        .matches(/^\d{2}-\d{3}$/)
        .withMessage('Nieprawidłowy format kodu pocztowego'),
    
    body('address.city')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Nazwa miasta musi mieć od 2 do 50 znaków')
];

exports.loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Nieprawidłowy format adresu email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Hasło jest wymagane')
]; 