const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;

        // Sprawdź czy token jest w headerze Authorization
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ 
                message: 'Dostęp zabroniony. Zaloguj się, aby kontynuować.' 
            });
        }

        try {
            // Weryfikuj token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Pobierz dane użytkownika (bez hasła)
            const user = await User.findById(decoded.userId).select('-password');

            if (!user) {
                return res.status(401).json({ 
                    message: 'Nie znaleziono użytkownika' 
                });
            }

            // Sprawdź czy użytkownik jest aktywny
            if (!user.isActive) {
                return res.status(403).json({ 
                    message: 'Konto jest nieaktywne. Skontaktuj się z administratorem.' 
                });
            }

            // Dodaj dane użytkownika do obiektu request
            req.user = user;
            next();

        } catch (error) {
            return res.status(401).json({ 
                message: 'Nieprawidłowy token. Zaloguj się ponownie.' 
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            message: 'Błąd serwera podczas autoryzacji' 
        });
    }
};

// Middleware do sprawdzania roli admina
exports.requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Dostęp zabroniony. Wymagane uprawnienia administratora.' 
        });
    }
    next();
}; 