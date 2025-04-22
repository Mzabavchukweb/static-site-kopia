const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Błąd walidacji danych',
            errors: errors.array()
        });
    }
    next();
};

module.exports = validateRequest; 