const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

const logDir = path.join(__dirname, '../../logs');

// Utwórz katalog logs jeśli nie istnieje
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const getLogFileName = () => {
  const date = format(new Date(), 'yyyy-MM-dd');
  return path.join(logDir, `error-${date}.log`);
};

const logger = {
  error: (message, error = null) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const logMessage = `[${timestamp}] ERROR: ${message}${error ? `\n${error.stack}` : ''}\n`;
    
    fs.appendFile(getLogFileName(), logMessage, (err) => {
      if (err) {
        console.error('Błąd podczas zapisywania logu:', err);
      }
    });
    
    // Wypisz błąd na konsolę w trybie development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${timestamp}]`, message);
      if (error) {
        console.error(error.stack);
      }
    }
  },

  info: (message) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const logMessage = `[${timestamp}] INFO: ${message}\n`;
    
    fs.appendFile(getLogFileName(), logMessage, (err) => {
      if (err) {
        console.error('Błąd podczas zapisywania logu:', err);
      }
    });
    
    // Wypisz informację na konsolę w trybie development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${timestamp}]`, message);
    }
  },

  warn: (message) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const logMessage = `[${timestamp}] WARN: ${message}\n`;
    
    fs.appendFile(getLogFileName(), logMessage, (err) => {
      if (err) {
        console.error('Błąd podczas zapisywania logu:', err);
      }
    });
    
    // Wypisz ostrzeżenie na konsolę w trybie development
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[${timestamp}]`, message);
    }
  }
};

module.exports = logger; 