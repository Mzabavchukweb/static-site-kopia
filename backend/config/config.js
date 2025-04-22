require('dotenv').config();

module.exports = {
    // Konfiguracja bazy danych
    db: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/auto-parts-b2b'
    },

    // Konfiguracja JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024',
        expiresIn: '24h'
    },

    // Konfiguracja email
    email: {
        resendApiKey: process.env.RESEND_API_KEY || 're_eutYnNEV_HaPCfb1Wrcc2YM4Nj1BupEL9',
        fromEmail: 'onboarding@resend.dev'
    },

    // Konfiguracja frontendu
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:5500'
    },

    // Konfiguracja API REGON
    regon: {
        apiKey: process.env.REGON_API_KEY,
        baseUrl: 'https://api.regon.gov.pl/api'
    },

    // Konfiguracja serwera
    server: {
        port: process.env.PORT || 5500
    }
}; 