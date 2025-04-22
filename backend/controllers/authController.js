const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Konfiguracja JWT
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('BŁĄD: JWT_SECRET nie jest zdefiniowany.');
    process.exit(1);
}

// Konfiguracja email
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Generowanie tokena JWT
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, {
        expiresIn: '30d'
    });
};

// Wysyłanie emaila weryfikacyjnego
const sendVerificationEmail = async (user, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
        from: `"Auto Parts B2B" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Potwierdź swój adres email',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Witaj ${user.firstName}!</h2>
                <p>Dziękujemy za rejestrację w naszym serwisie.</p>
                <p>Aby aktywować swoje konto, kliknij w poniższy przycisk:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                              color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Potwierdź email
                    </a>
                </div>
                <p>Link jest ważny przez 24 godziny.</p>
                <p>Jeśli nie rejestrowałeś się w naszym serwisie, zignoruj tę wiadomość.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">Wiadomość została wysłana automatycznie, prosimy na nią nie odpowiadać.</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email weryfikacyjny wysłany:', info.messageId);
    } catch (error) {
        console.error('Błąd podczas wysyłania emaila weryfikacyjnego:', error);
        throw new Error('Nie udało się wysłać emaila weryfikacyjnego');
    }
};

// Rejestracja nowego użytkownika
const register = async (req, res) => {
    try {
        // Sprawdzenie połączenia z bazą danych
        if (mongoose.connection.readyState !== 1) {
            console.error('Błąd: Brak połączenia z bazą danych');
            return res.status(500).json({ 
                message: 'Błąd serwera: Brak połączenia z bazą danych' 
            });
        }

        const {
            firstName,
            lastName,
            email,
            password,
            companyName,
            companyCountry,
            nip,
            phone,
            address
        } = req.body;

        console.log('Próba rejestracji użytkownika:', { email, companyName });

        // Sprawdzenie czy użytkownik już istnieje
        const userExists = await User.findOne({ 
            $or: [
                { email },
                { nip }
            ]
        });
        
        if (userExists) {
            console.log('Próba rejestracji istniejącego użytkownika:', { 
                email, 
                exists: userExists.email === email ? 'email' : 'nip' 
            });
            return res.status(400).json({ 
                message: userExists.email === email 
                    ? 'Użytkownik z tym adresem email już istnieje'
                    : 'Użytkownik z tym numerem NIP już istnieje'
            });
        }

        // Hashowanie hasła
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generowanie tokena weryfikacyjnego
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24);

        // Tworzenie nowego użytkownika
        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            companyName,
            companyCountry,
            nip,
            phone,
            address,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires
        });

        // Zapisanie użytkownika
        await user.save();
        console.log('Użytkownik zarejestrowany pomyślnie:', { email, userId: user._id });

        // Wysłanie emaila weryfikacyjnego
        await sendVerificationEmail(user, verificationToken);

        // Generowanie tokena JWT
        const token = generateToken(user._id);

        // Odpowiedź
        res.status(201).json({
            message: 'Rejestracja zakończona pomyślnie. Sprawdź swój email w celu weryfikacji.',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                companyName: user.companyName
            }
        });

    } catch (error) {
        console.error('Błąd podczas rejestracji:', error);
        res.status(500).json({ 
            message: 'Wystąpił błąd podczas rejestracji',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Weryfikacja emaila
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Link weryfikacyjny jest nieprawidłowy lub wygasł'
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({
            message: 'Email został pomyślnie zweryfikowany. Możesz się teraz zalogować.',
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Błąd podczas weryfikacji emaila:', error);
        res.status(500).json({ message: 'Błąd serwera podczas weryfikacji emaila' });
    }
};

// Logowanie użytkownika
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Sprawdzenie czy użytkownik istnieje
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
        }

        // Sprawdzenie czy konto jest zablokowane
        if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.accountLockedUntil - Date.now()) / 60000);
            return res.status(401).json({ 
                message: `Konto jest zablokowane. Spróbuj ponownie za ${minutesLeft} minut.`
            });
        }

        // Sprawdzenie hasła
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            await user.incrementFailedLoginAttempts();
            return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
        }

        // Sprawdzenie czy email jest zweryfikowany
        if (!user.isEmailVerified) {
            return res.status(401).json({ 
                message: 'Proszę zweryfikować swój adres email przed zalogowaniem'
            });
        }

        // Resetowanie licznika nieudanych prób i aktualizacja ostatniego logowania
        await user.resetFailedLoginAttempts();
        user.lastLogin = new Date();
        await user.save();

        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            companyName: user.companyName,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Błąd podczas logowania:', error);
        res.status(500).json({ message: 'Błąd serwera podczas logowania' });
    }
};

// Pobieranie profilu użytkownika
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        }
        res.json(user);
    } catch (error) {
        console.error('Błąd podczas pobierania profilu:', error);
        res.status(500).json({ message: 'Błąd serwera podczas pobierania profilu' });
    }
};

// Sprawdzanie czy firma już istnieje
const checkCompany = async (req, res) => {
    try {
        const { companyName, nip } = req.body;

        if (!companyName || !nip) {
            return res.status(400).json({
                message: 'Nazwa firmy i NIP są wymagane'
            });
        }

        const companyExists = await User.findOne({
            $or: [
                { companyName: { $regex: new RegExp(companyName, 'i') } },
                { nip }
            ]
        });

        res.json({
            exists: !!companyExists,
            message: companyExists ? 'Firma o podanej nazwie lub NIP już istnieje' : 'Firma jest dostępna do rejestracji'
        });
    } catch (error) {
        console.error('Błąd podczas sprawdzania firmy:', error);
        res.status(500).json({
            message: 'Wystąpił błąd podczas sprawdzania firmy',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    verifyEmail,
    checkCompany
}; 