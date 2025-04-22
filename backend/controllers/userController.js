const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { validationResult } = require('express-validator');

// Konfiguracja transporter dla nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Generowanie tokena JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '24h'
    });
};

// Weryfikacja NIP w bazie REGON
const verifyNip = async (nip) => {
    try {
        const response = await axios.get(`https://api.regon.gov.pl/api/checknip/${nip}`, {
            headers: {
                'Authorization': `Bearer ${process.env.REGON_API_KEY}`
            }
        });

        if (!response.data.isValid) {
            return {
                isValid: false,
                error: 'Nieprawidłowy NIP'
            };
        }

        return {
            isValid: true,
            data: response.data
        };
    } catch (error) {
        console.error('Błąd weryfikacji NIP:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            return {
                isValid: false,
                error: 'Błąd autoryzacji API REGON'
            };
        }

        if (error.response?.status === 404) {
            return {
                isValid: false,
                error: 'NIP nie został znaleziony w bazie REGON'
            };
        }

        return {
            isValid: false,
            error: 'Błąd podczas weryfikacji NIP. Spróbuj ponownie później.'
        };
    }
};

// Rejestracja użytkownika
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName, companyName, nip, phone, address } = req.body;

        // Sprawdzenie czy użytkownik już istnieje
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Użytkownik o podanym adresie email już istnieje' });
        }

        // Sprawdzenie czy firma już istnieje
        user = await User.findOne({ companyName, nip });
        if (user) {
            return res.status(400).json({ message: 'Firma o podanej nazwie i NIP już istnieje' });
        }

        // Weryfikacja NIP w bazie REGON
        const nipVerification = await verifyNip(nip);
        if (!nipVerification.isValid) {
            return res.status(400).json({ message: nipVerification.error });
        }

        // Tworzenie nowego użytkownika
        user = new User({
            email,
            password,
            firstName,
            lastName,
            companyName,
            nip,
            phone,
            address,
            isEmailVerified: false
        });

        // Generowanie tokena weryfikacyjnego
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 godziny

        await user.save();

        // Wysłanie maila weryfikacyjnego
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Weryfikacja adresu email',
            html: `
                <h1>Witaj ${firstName}!</h1>
                <p>Dziękujemy za rejestrację w naszym serwisie.</p>
                <p>Aby aktywować swoje konto, kliknij w poniższy link:</p>
                <a href="${verificationUrl}">${verificationUrl}</a>
                <p>Link jest ważny przez 24 godziny.</p>
            `
        });

        res.status(201).json({
            message: 'Rejestracja zakończona sukcesem. Sprawdź swój email w celu weryfikacji konta.'
        });
    } catch (error) {
        console.error('Błąd rejestracji:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas rejestracji' });
    }
};

// Weryfikacja emaila
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({
            email: decoded.email,
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Nieprawidłowy lub wygasły token weryfikacyjny' });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({ message: 'Email został zweryfikowany pomyślnie' });
    } catch (error) {
        console.error('Błąd weryfikacji emaila:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas weryfikacji emaila' });
    }
};

// Logowanie
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
        }

        if (!user.isEmailVerified) {
            return res.status(401).json({ message: 'Proszę zweryfikować swój adres email' });
        }

        const token = generateToken(user._id);
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                companyName: user.companyName
            }
        });
    } catch (error) {
        console.error('Błąd logowania:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas logowania' });
    }
};

// Pobieranie listy użytkowników (dla admina)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password -emailVerificationToken');
        res.json(users);
    } catch (error) {
        console.error('Błąd pobierania użytkowników:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas pobierania użytkowników' });
    }
};

// Usuwanie użytkownika (dla admina)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
        }

        res.json({ message: 'Użytkownik został usunięty pomyślnie' });
    } catch (error) {
        console.error('Błąd usuwania użytkownika:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas usuwania użytkownika' });
    }
};

// Ponowne wysłanie maila weryfikacyjnego
exports.resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email został już zweryfikowany' });
        }

        // Generowanie nowego tokena weryfikacyjnego
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 godziny
        await user.save();

        // Wysłanie maila weryfikacyjnego
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Weryfikacja adresu email',
            html: `
                <h1>Witaj ${user.firstName}!</h1>
                <p>Otrzymaliśmy prośbę o ponowne wysłanie linku weryfikacyjnego.</p>
                <p>Aby aktywować swoje konto, kliknij w poniższy link:</p>
                <a href="${verificationUrl}">${verificationUrl}</a>
                <p>Link jest ważny przez 24 godziny.</p>
            `
        });

        res.json({ message: 'Email weryfikacyjny został wysłany ponownie' });
    } catch (error) {
        console.error('Błąd ponownego wysłania maila weryfikacyjnego:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas wysyłania maila weryfikacyjnego' });
    }
}; 