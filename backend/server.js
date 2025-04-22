require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const mailer = require('./config/mailer');
const config = require('./config/config');

const app = express();
const port = 5500;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../')));

// Generowanie tokena weryfikacyjnego
const generateVerificationToken = (userData) => {
    return jwt.sign(
        { email: userData.email, companyName: userData.companyName },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
};

// B2B Registration endpoint
app.post('/api/register-b2b', async (req, res) => {
    try {
        const { companyName, nip, email, phone, password } = req.body;

        // Basic validation
        if (!companyName || !nip || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Wszystkie wymagane pola muszą być wypełnione'
            });
        }

        // Generate verification token
        const verificationToken = generateVerificationToken({ email, companyName });
        const verificationLink = `${config.frontend.url}/verify-email?token=${verificationToken}`;

        // Send verification email
        try {
            const emailTemplate = mailer.getVerificationEmailTemplate(companyName, verificationLink);
            await mailer.sendEmail(email, emailTemplate);
            
            res.status(200).json({ 
                success: true,
                message: 'Rejestracja przebiegła pomyślnie. Sprawdź swoją skrzynkę email, aby zweryfikować konto.',
                redirectUrl: '/verification-pending.html'
            });
        } catch (error) {
            console.error('Błąd wysyłania maila:', error);
            res.status(500).json({ 
                success: false,
                error: 'Wystąpił błąd podczas wysyłania maila weryfikacyjnego.' 
            });
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Wystąpił błąd podczas rejestracji'
        });
    }
});

// Email verification endpoint
app.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).send('Brak tokenu weryfikacyjnego');
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Here you would typically:
        // 1. Check if token exists in database
        // 2. Update user status to verified
        // 3. Remove verification token from database

        // Redirect to success page
        res.redirect('/verification-success.html');

    } catch (error) {
        console.error('Verification error:', error);
        res.status(400).send('Nieprawidłowy lub wygasły token weryfikacyjny');
    }
});

// Test email route
app.get('/test-email', async (req, res) => {
    try {
        const emailTemplate = {
            from: 'onboarding@resend.dev',
            subject: 'Test Email - AutoParts B2B',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Test Email</h2>
                    <p>To jest testowa wiadomość z systemu AutoParts B2B.</p>
                    <p>Jeśli otrzymałeś tego maila, oznacza to, że system mailowy działa poprawnie!</p>
                </div>
            `
        };

        await mailer.sendEmail('zabavchuk.maksym@gmail.com', emailTemplate);
        
        res.json({ 
            success: true,
            message: 'Email testowy został wysłany pomyślnie'
        });
    } catch (error) {
        console.error('Błąd wysyłania maila testowego:', error);
        res.status(500).json({ 
            success: false,
            error: 'Wystąpił błąd podczas wysyłania maila testowego',
            details: error.message
        });
    }
});

// Favicon route
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../images/favicon.ico'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 