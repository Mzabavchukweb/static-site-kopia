const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware do ochrony tras - sprawdza czy użytkownik jest zalogowany
exports.protect = async (req, res, next) => {
    try {
        let token;
        
        // Sprawdź czy token jest w nagłówku Authorization
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Brak autoryzacji, wymagane zalogowanie' });
        }

        try {
            // Weryfikuj token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Pobierz użytkownika i dodaj do req
            req.user = await User.findById(decoded.userId).select('-password');
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Nieprawidłowy token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

// Middleware do ograniczania dostępu według roli
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Nie masz uprawnień do wykonania tej operacji'
            });
        }
        next();
    };
}; 