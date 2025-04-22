require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const config = require('./config/config');

const app = express();
const port = process.env.PORT || 5500;

// Initialize Resend
const resend = new Resend(config.email.resendApiKey);
console.log('Initializing Resend with API key:', config.email.resendApiKey);

// Middleware
app.use(cors({
    origin: ['http://localhost:5500', 'https://mzabavchukweb.github.io'],
    credentials: true
}));

// Parse JSON bodies
app.use(bodyParser.json());

// API Router - Mount BEFORE static files
const apiRouter = express.Router();

// Login endpoint
apiRouter.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        // Test credentials
        if (email === 'zabavchukmaks21@gmail.com' && password === 'Relmadrid12!') {
            const token = jwt.sign(
                { email, role: 'user' },
                config.jwt.secret,
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                message: 'Zalogowano pomyślnie',
                user: {
                    email: email,
                    name: 'Test User',
                    role: 'user'
                },
                token
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

// B2B Registration endpoint
apiRouter.post('/register-b2b', async (req, res) => {
    try {
        console.log('Received registration request:', req.body);
        const { companyName, nip, email, phone, password } = req.body;

        // Basic validation
        if (!companyName || !nip || !email || !password) {
            console.log('Validation failed - missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Wszystkie wymagane pola muszą być wypełnione'
            });
        }

        // Generate verification token
        const verificationToken = generateVerificationToken({ email, companyName });
        const verificationLink = `${config.frontend.url}/verify-email?token=${verificationToken}`;

        console.log('Generated verification link:', verificationLink);

        // Send verification email
        try {
            console.log('Preparing to send verification email to:', email);
            
            const emailData = {
                from: 'AutoParts B2B <onboarding@resend.dev>',
                to: email,
                subject: 'Weryfikacja konta B2B - AutoParts',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Witaj ${companyName}!</h2>
                        
                        <p>Dziękujemy za rejestrację w systemie AutoParts B2B. Aby aktywować swoje konto, kliknij w poniższy link:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" 
                               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Aktywuj konto
                            </a>
                        </div>
                        
                        <p>Link jest ważny przez 24 godziny. Jeśli nie rejestrowałeś się w naszym systemie, zignoruj tę wiadomość.</p>
                        
                        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #666; font-size: 14px;">
                                Z poważaniem,<br>
                                Zespół AutoParts B2B
                            </p>
                        </div>
                    </div>
                `
            };

            console.log('Sending email with data:', emailData);
            
            const { data, error } = await resend.emails.send(emailData);

            if (error) {
                console.error('Error sending email:', error);
                throw error;
            }

            console.log('Email sent successfully:', data);
            
            res.status(200).json({ 
                success: true,
                message: 'Rejestracja przebiegła pomyślnie. Sprawdź swoją skrzynkę email, aby zweryfikować konto.',
                redirectUrl: '/verification-pending.html',
                emailDetails: data
            });
        } catch (emailError) {
            console.error('Błąd wysyłania maila:', emailError);
            res.status(500).json({ 
                success: false,
                error: 'Wystąpił błąd podczas wysyłania maila weryfikacyjnego.',
                details: emailError.message,
                stack: emailError.stack
            });
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Wystąpił błąd podczas rejestracji',
            details: error.message,
            stack: error.stack
        });
    }
});

// Email verification endpoint
apiRouter.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).send('Brak tokenu weryfikacyjnego');
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);
        console.log('Verified token:', decoded);

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
apiRouter.post('/test-email', async (req, res) => {
    try {
        const testEmail = req.body.email || 'zabavchukmaks21@gmail.com';
        console.log('Received test email request for:', testEmail);
        
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: testEmail,
            subject: 'Test Email - AutoParts B2B',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Test Email</h2>
                    <p>To jest testowa wiadomość z systemu AutoParts B2B.</p>
                    <p>Jeśli otrzymałeś tego maila, oznacza to, że system mailowy działa poprawnie!</p>
                    <p>Czas wysłania: ${new Date().toLocaleString()}</p>
                </div>
            `
        });

        if (error) {
            console.error('Error sending test email:', error);
            throw error;
        }

        console.log('Test email sent successfully:', data);
        
        res.json({ 
            success: true,
            message: 'Email testowy został wysłany pomyślnie',
            result: data
        });
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({ 
            success: false,
            error: 'Wystąpił błąd podczas wysyłania maila testowego',
            details: error.message
        });
    }
});

// Mount API routes BEFORE static files
app.use('/api', apiRouter);

// Serve static files AFTER API routes
app.use(express.static(path.join(__dirname, '../')));

// Handle SPA routing
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`API available at http://localhost:${port}/api`);
}); 