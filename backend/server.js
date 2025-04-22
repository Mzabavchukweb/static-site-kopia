require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const app = express();
const port = process.env.PORT || 5500;

// Initialize Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_eutYnNEV_HaPCfb1Wrcc2YM4Nj1BupEL9';
console.log('Initializing Resend with API key:', RESEND_API_KEY);
const resend = new Resend(RESEND_API_KEY);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true
}));

app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// API Router
const apiRouter = express.Router();

// Login endpoint
apiRouter.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        // Test credentials
        if (email === 'zabavchukmaks21@gmail.com' && password === 'Relmadrid12!') {
            return res.json({
                success: true,
                message: 'Zalogowano pomyślnie',
                user: {
                    email: email,
                    name: 'Test User'
                },
                token: 'test-token'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Nieprawidłowy email lub hasło'
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Wystąpił błąd podczas logowania',
            details: error.message
        });
    }
});

// Registration endpoint
apiRouter.post('/register-b2b', async (req, res) => {
    try {
        const { companyName, nip, email, phone, password } = req.body;
        console.log('Registration attempt for:', { companyName, email });

        // Generate verification token
        const token = jwt.sign(
            { email, companyName },
            'your_jwt_secret',
            { expiresIn: '24h' }
        );

        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5500'}/verify-email?token=${token}`;
        
        try {
            const { data, error } = await resend.emails.send({
                from: 'AutoParts B2B <onboarding@resend.dev>',
                to: email,
                subject: 'Weryfikacja konta B2B - AutoParts',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Witaj ${companyName}!</h2>
                        <p>Dziękujemy za rejestrację w systemie AutoParts B2B.</p>
                        <p>Aby aktywować swoje konto, kliknij w poniższy link:</p>
                        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Aktywuj konto</a>
                        <p>Link jest ważny przez 24 godziny.</p>
                    </div>
                `
            });

            if (error) {
                throw error;
            }

            res.json({
                success: true,
                message: 'Rejestracja przebiegła pomyślnie. Sprawdź swoją skrzynkę email.'
            });
        } catch (emailError) {
            throw new Error('Błąd podczas wysyłania emaila weryfikacyjnego');
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Wystąpił błąd podczas rejestracji',
            details: error.message
        });
    }
});

// Mount API router
app.use('/api', apiRouter);

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../login.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../b2b-registration.html'));
});

app.get('/b2b-registration.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../b2b-registration.html'));
});

app.get('/verify-email', (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.redirect('/verification-error.html');
    }
    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        res.sendFile(path.join(__dirname, '../verification-success.html'));
    } catch (error) {
        res.redirect('/verification-error.html');
    }
});

// Handle 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../404.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`API available at http://localhost:${port}/api`);
}); 