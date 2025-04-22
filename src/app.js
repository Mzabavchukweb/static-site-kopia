require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const authRoutes = require('./routes/auth');
const logger = require('./utils/logger');

// --- DEBUG LOG --- 
logger.info(`Running with NODE_ENV: ${process.env.NODE_ENV}`);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Konfiguracja sesji
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    table: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: parseInt(process.env.SESSION_LIFETIME) || 3600000
  }
}));

// Inicjalizacja CSRF tylko jeśli NIE jesteśmy w trybie testowym
let csrfProtection = null;
if (process.env.NODE_ENV !== 'test') {
  logger.info('Initializing CSRF protection...');
  csrfProtection = csrf({ cookie: true });
  app.use(csrfProtection);

  // Middleware do ustawiania cookie CSRF tylko w trybie non-test
  app.use((req, res, next) => {
    // --- DEBUG LOG --- 
    // console.log('[DEBUG] Setting XSRF-TOKEN cookie'); 
    res.cookie('XSRF-TOKEN', req.csrfToken());
    next();
  });

  // Endpoint do pobierania tokenu CSRF - MUSI być PRZED app.use('/api/auth', authRoutes);
  // --- DEBUG LOG --- 
  logger.info('Defining GET /api/auth/csrf-token endpoint...'); 
  app.get('/api/auth/csrf-token', (req, res) => { 
      // --- DEBUG LOG --- 
      logger.info(`Request received for GET /api/auth/csrf-token. Sending token: ${req.csrfToken()}`);
      res.json({ csrfToken: req.csrfToken() });
  });
} else {
  logger.info('CSRF protection is DISABLED in test environment.');
}

// Rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100
});
// Zastosuj rate limiting do wszystkich ścieżek /api/
app.use('/api/', limiter);

// Routes - /api/auth zdefiniowany PO endpointcie CSRF
// --- DEBUG LOG --- 
logger.info('Defining /api/auth routes...');
app.use('/api/auth', (req, res, next) => {
    // --- DEBUG LOG --- 
    logger.info(`Request received for /api/auth path: ${req.method} ${req.originalUrl}`);
    // Sprawdź, czy to nie jest przypadkiem żądanie CSRF token
    if (req.originalUrl === '/api/auth/csrf-token') {
        logger.warn('WARN: CSRF token request reached /api/auth router! This should not happen.');
    }
    next(); // Przekaż do właściwego routera authRoutes
}, authRoutes);

// Serve HTML files FIRST
// --- DEBUG LOG --- 
logger.info('Defining HTML routes (/, /b2b-registration.html, /verify)...');

// Redirect /register.html to /b2b-registration.html
app.get('/register.html', (req, res) => {
  res.redirect('/b2b-registration.html');
});

// Serve b2b-registration.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'b2b-registration.html'));
});

// Obsługa ścieżki /b2b-registration.html
app.get('/b2b-registration.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'b2b-registration.html'));
});

app.get('/verify', (req, res) => {
  // Zwróć prosty HTML lub dedykowany plik dla weryfikacji
  // UWAGA: Logika weryfikacji jest w /api/auth/verify
  res.sendFile(path.join(__dirname, 'public', 'verification-status.html')); // Przykładowy plik
});

// Static files LAST (before error handler)
// --- DEBUG LOG --- 
logger.info('Defining static file serving from public/ ...');
app.use(express.static(path.join(__dirname, 'public')));

// Error handling - dodaj obsługę błędów CSRF tylko jeśli jest włączone
app.use((err, req, res, next) => {
  logger.error('Server error', err);
  if (process.env.NODE_ENV !== 'test' && csrfProtection && err.code === 'EBADCSRFTOKEN') {
    logger.error('CSRF error', err);
    res.status(403).json({ message: 'Błąd CSRF: Nieprawidłowy lub brakujący token.', error: 'Invalid CSRF token' });
  } else {
    res.status(500).json({ message: 'Wystąpił wewnętrzny błąd serwera.', error: 'Internal server error' });
  }
});

// Only start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });
}

module.exports = app;
