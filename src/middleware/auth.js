const { User } = require('../models/user');

// Middleware do sprawdzania czy użytkownik jest zalogowany
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ 
      message: 'Brak autoryzacji. Zaloguj się aby kontynuować.' 
    });
  }
  next();
};

// Middleware do sprawdzania czy użytkownik jest administratorem
const isAdmin = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        message: 'Brak autoryzacji. Zaloguj się aby kontynuować.' 
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ 
        message: 'Brak uprawnień. Dostęp tylko dla administratorów.' 
      });
    }

    next();
  } catch (error) {
    console.error('Błąd podczas sprawdzania uprawnień:', error);
    res.status(500).json({ 
      message: 'Wystąpił błąd podczas sprawdzania uprawnień.' 
    });
  }
};

module.exports = {
  isAuthenticated,
  isAdmin
}; 