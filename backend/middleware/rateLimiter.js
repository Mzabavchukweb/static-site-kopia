const rateLimit = require('express-rate-limit');

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per windowMs
    message: {
        success: false,
        error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    message: {
        success: false,
        error: 'Zbyt wiele żądań. Spróbuj ponownie za 15 minut.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for creating inquiries
const inquiryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per windowMs
    message: {
        success: false,
        error: 'Zbyt wiele zapytań ofertowych. Spróbuj ponownie za godzinę.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    authLimiter,
    apiLimiter,
    inquiryLimiter
}; 