const express = require('express');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { User } = require('../models/user');
const logger = require('../utils/logger');
const router = express.Router();

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_USER || 'your_mailtrap_user',
    pass: process.env.SMTP_PASS || 'your_mailtrap_password'
  }
});

// NIP validation helper
const validateNip = (nip) => {
  if (!/^\d{10}$/.test(nip)) return false;
  
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const digits = nip.split('').map(Number);
  const checksum = digits[9];
  
  const sum = weights.reduce((acc, weight, index) => {
    return acc + (weight * digits[index]);
  }, 0);
  
  return (sum % 11) === checksum;
};

// Validation middleware
const registrationValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('Imię jest wymagane.')
    .isLength({ min: 2, max: 50 })
    .withMessage('Imię musi zawierać od 2 do 50 znaków.')
    .matches(/^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\s-]+$/)
    .withMessage('Imię może zawierać tylko litery, spacje i myślniki.'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Nazwisko jest wymagane.')
    .isLength({ min: 2, max: 50 })
    .withMessage('Nazwisko musi zawierać od 2 do 50 znaków.')
    .matches(/^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\s-]+$/)
    .withMessage('Nazwisko może zawierać tylko litery, spacje i myślniki.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Adres email jest wymagany.')
    .isEmail()
    .withMessage('Podaj poprawny format adresu email (np. user@example.com).')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Numer telefonu jest wymagany.')
    .matches(/^\+?([\d\s-]{9,})$/)
    .withMessage('Podaj poprawny format numeru telefonu (minimum 9 cyfr, opcjonalnie +/spacje/myślniki).'),

  body('companyName')
    .trim()
    .notEmpty().withMessage('Nazwa firmy jest wymagana.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nazwa firmy musi zawierać od 2 do 100 znaków.'),

  body('nip')
    .trim()
    .notEmpty().withMessage('NIP jest wymagany.')
    .matches(/^\d{10}$/)
    .withMessage('NIP musi składać się dokładnie z 10 cyfr.')
    .custom(validateNip)
    .withMessage('Podany numer NIP jest nieprawidłowy (błędna suma kontrolna).'),

  body('street')
    .trim()
    .notEmpty().withMessage('Ulica i numer są wymagane.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Adres ulicy musi zawierać od 2 do 100 znaków.'),

  body('postalCode')
    .trim()
    .notEmpty().withMessage('Kod pocztowy jest wymagany.')
    .matches(/^\d{2}-\d{3}$/)
    .withMessage('Podaj poprawny format kodu pocztowego (np. 00-000).'),

  body('city')
    .trim()
    .notEmpty().withMessage('Miasto jest wymagane.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nazwa miasta musi zawierać od 2 do 100 znaków.')
    .matches(/^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\s-]+$/)
    .withMessage('Nazwa miasta może zawierać tylko litery, spacje i myślniki.'),

  body('password')
    .notEmpty().withMessage('Hasło jest wymagane.')
    .isLength({ min: 8 }).withMessage('Hasło musi mieć co najmniej 8 znaków.')
    .matches(/[A-Z]/).withMessage('Hasło musi zawierać co najmniej jedną wielką literę.')
    .matches(/[a-z]/).withMessage('Hasło musi zawierać co najmniej jedną małą literę.')
    .matches(/\d/).withMessage('Hasło musi zawierać co najmniej jedną cyfrę.')
    .matches(/[@$!%*?&]/).withMessage('Hasło musi zawierać co najmniej jeden znak specjalny (@$!%*?&).'),

  body('confirmPassword')
    .notEmpty().withMessage('Potwierdzenie hasła jest wymagane.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Hasła nie są takie same.');
      }
      return true;
    }),

  body('termsAccepted')
    .isBoolean()
    .custom((value) => {
      if (value !== true) { // Explicitly check for true
        throw new Error('Akceptacja regulaminu jest wymagana.');
      }
      return true;
    })
];

// Routes
router.post('/register', registrationValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors during registration:', errors.array());
    return res.status(400).json({ 
      message: 'Wystąpiły błędy walidacji. Sprawdź dane formularza.', 
      errors: errors.array() 
    });
  }

  try {
    const { id, verificationToken } = await User.create(req.body);

    const verificationUrl = `${req.protocol}://${req.get('host')}/verify?token=${verificationToken}`;
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Verification URL for ${req.body.email}: ${verificationUrl}`);
    }
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to: req.body.email,
      subject: 'AutoParts B2B - Weryfikacja konta',
      html: `
        <h1>Witamy w AutoParts B2B!</h1>
        <p>Dziękujemy za rejestrację. Aby aktywować swoje konto, kliknij w poniższy link:</p>
        <p><a href="${verificationUrl}" style="padding: 10px 15px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 5px;">Aktywuj konto</a></p>
        <p>Jeśli przycisk nie działa, skopiuj i wklej poniższy adres URL w przeglądarce:</p>
        <p>${verificationUrl}</p>
        <p>Link weryfikacyjny jest ważny przez 24 godziny.</p>
        <hr>
        <p style="font-size: 0.8em; color: #6B7280;">Jeśli nie rejestrowałeś/aś się w naszym serwisie, zignoruj tę wiadomość.</p>
      `
    });

    logger.info(`New user registered: ${req.body.email}`);
    res.status(201).json({
      message: 'Rejestracja przebiegła pomyślnie! Sprawdź swoją skrzynkę email, aby aktywować konto.',
      userId: id
    });
  } catch (error) {
    if (error.message === 'Email already exists') {
      logger.warn(`Registration attempt with existing email: ${req.body.email}`);
      return res.status(409).json({ 
        message: 'Rejestracja nie powiodła się.',
        errors: [{ param: 'email', msg: 'Podany adres email jest już zarejestrowany w systemie.' }]
      });
    }
    if (error.message === 'NIP already exists') {
      logger.warn(`Registration attempt with existing NIP: ${req.body.nip}`);
      return res.status(409).json({ 
        message: 'Rejestracja nie powiodła się.',
        errors: [{ param: 'nip', msg: 'Podany NIP jest już zarejestrowany w systemie.' }]
      });
    }
    
    logger.error('Error during registration:', error);
    res.status(500).json({ 
      message: 'Wystąpił nieoczekiwany błąd serwera podczas próby rejestracji. Spróbuj ponownie później.',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

router.get('/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send('<p>Błąd: Brak tokenu weryfikacyjnego w adresie URL.</p>');
  }

  try {
    await User.verifyUser(token);
    // Przekierowanie na stronę sukcesu lub wyświetlenie komunikatu
    // Tutaj można stworzyć dedykowaną stronę HTML dla weryfikacji
    res.send(`
      <html>
        <head>
          <title>Weryfikacja zakończona</title>
          <style> body { font-family: sans-serif; text-align: center; padding-top: 50px; } .success { color: green; } .error { color: red; } </style>
        </head>
        <body>
          <h1 class="success">Konto zostało pomyślnie zweryfikowane!</h1>
          <p>Możesz się teraz zalogować.</p>
          <a href="/">Przejdź do strony głównej</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Błąd podczas weryfikacji:', error);
    let errorMessage = 'Wystąpił nieoczekiwany błąd podczas weryfikacji konta.';
    if (error.message === 'Invalid verification token') {
      errorMessage = 'Link weryfikacyjny jest nieprawidłowy, wygasł lub został już użyty.';
    }
    
    // Wyświetlenie strony błędu
    res.status(400).send(`
      <html>
        <head>
          <title>Błąd weryfikacji</title>
           <style> body { font-family: sans-serif; text-align: center; padding-top: 50px; } .success { color: green; } .error { color: red; } </style>
        </head>
        <body>
          <h1 class="error">Weryfikacja nie powiodła się</h1>
          <p>${errorMessage}</p>
          <a href="/">Przejdź do strony głównej</a>
        </body>
      </html>
    `);
  }
});

// Walidacja logowania
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Adres email jest wymagany.')
    .isEmail()
    .withMessage('Podaj poprawny format adresu email.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Hasło jest wymagane.')
];

// Obsługa logowania
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Wystąpiły błędy walidacji.', 
      errors: errors.array() 
    });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({ 
        message: 'Nieprawidłowy email lub hasło.',
        errors: [{ param: 'email', msg: 'Nieprawidłowy email lub hasło.' }]
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Konto nie zostało zweryfikowane.',
        errors: [{ param: 'email', msg: 'Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę email.' }]
      });
    }

    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Nieprawidłowy email lub hasło.',
        errors: [{ param: 'email', msg: 'Nieprawidłowy email lub hasło.' }]
      });
    }

    // Ustawienie sesji
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.companyName = user.companyName;

    res.json({
      message: 'Zalogowano pomyślnie.',
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName
      }
    });
  } catch (error) {
    console.error('Błąd podczas logowania:', error);
    res.status(500).json({ 
      message: 'Wystąpił błąd podczas logowania.',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Obsługa wylogowania
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Błąd podczas wylogowania:', err);
      return res.status(500).json({ 
        message: 'Wystąpił błąd podczas wylogowania.' 
      });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Wylogowano pomyślnie.' });
  });
});

// Sprawdzenie statusu sesji
router.get('/session', (req, res) => {
  if (req.session.userId) {
    res.json({
      isLoggedIn: true,
      user: {
        id: req.session.userId,
        email: req.session.email,
        companyName: req.session.companyName
      }
    });
  } else {
    res.json({ isLoggedIn: false });
  }
});

// Walidacja resetowania hasła
const resetPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Adres email jest wymagany.')
    .isEmail()
    .withMessage('Podaj poprawny format adresu email.')
    .normalizeEmail()
];

const newPasswordValidation = [
  body('password')
    .notEmpty().withMessage('Hasło jest wymagane.')
    .isLength({ min: 8 }).withMessage('Hasło musi mieć co najmniej 8 znaków.')
    .matches(/[A-Z]/).withMessage('Hasło musi zawierać co najmniej jedną wielką literę.')
    .matches(/[a-z]/).withMessage('Hasło musi zawierać co najmniej jedną małą literę.')
    .matches(/\d/).withMessage('Hasło musi zawierać co najmniej jedną cyfrę.')
    .matches(/[@$!%*?&]/).withMessage('Hasło musi zawierać co najmniej jeden znak specjalny (@$!%*?&).'),

  body('confirmPassword')
    .notEmpty().withMessage('Potwierdzenie hasła jest wymagane.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Hasła nie są takie same.');
      }
      return true;
    })
];

// Żądanie resetowania hasła
router.post('/forgot-password', resetPasswordValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Wystąpiły błędy walidacji.', 
      errors: errors.array() 
    });
  }

  try {
    const { resetToken, email } = await User.createResetToken(req.body.email);
    
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@example.com',
      to: email,
      subject: 'AutoParts B2B - Resetowanie hasła',
      html: `
        <h1>Resetowanie hasła</h1>
        <p>Otrzymaliśmy prośbę o resetowanie hasła dla Twojego konta.</p>
        <p>Kliknij w poniższy link, aby zresetować hasło:</p>
        <p><a href="${resetUrl}" style="padding: 10px 15px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 5px;">Resetuj hasło</a></p>
        <p>Jeśli przycisk nie działa, skopiuj i wklej poniższy adres URL w przeglądarce:</p>
        <p>${resetUrl}</p>
        <p>Link resetujący jest ważny przez 1 godzinę.</p>
        <hr>
        <p style="font-size: 0.8em; color: #6B7280;">Jeśli nie prosiłeś/aś o resetowanie hasła, zignoruj tę wiadomość.</p>
      `
    });

    res.json({
      message: 'Wiadomość z instrukcją resetowania hasła została wysłana na podany adres email.'
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ 
        message: 'Nie znaleziono użytkownika z podanym adresem email.' 
      });
    }
    
    console.error('Błąd podczas resetowania hasła:', error);
    res.status(500).json({ 
      message: 'Wystąpił błąd podczas próby resetowania hasła.',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Resetowanie hasła
router.post('/reset-password', newPasswordValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Wystąpiły błędy walidacji.', 
      errors: errors.array() 
    });
  }

  try {
    const { token, password } = req.body;
    await User.resetPassword(token, password);
    
    res.json({
      message: 'Hasło zostało pomyślnie zresetowane. Możesz się teraz zalogować nowym hasłem.'
    });
  } catch (error) {
    if (error.message === 'Invalid or expired reset token') {
      return res.status(400).json({ 
        message: 'Link resetujący jest nieprawidłowy lub wygasł.' 
      });
    }
    
    console.error('Błąd podczas resetowania hasła:', error);
    res.status(500).json({ 
      message: 'Wystąpił błąd podczas resetowania hasła.',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

module.exports = router;
