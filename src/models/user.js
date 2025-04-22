const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const dbPath = process.env.NODE_ENV === 'test' 
  ? path.join(__dirname, '../../test.sqlite')
  : path.join(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      companyName TEXT NOT NULL,
      nip TEXT UNIQUE NOT NULL,
      street TEXT NOT NULL,
      postalCode TEXT NOT NULL,
      city TEXT NOT NULL,
      password TEXT NOT NULL,
      isVerified INTEGER DEFAULT 0,
      isAdmin INTEGER DEFAULT 0,
      verificationToken TEXT UNIQUE,
      resetPasswordToken TEXT UNIQUE,
      resetPasswordExpires DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

const User = {
  async create(userData) {
    return new Promise(async (resolve, reject) => {
      try {
        const id = uuidv4();
        const verificationToken = uuidv4();
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const stmt = db.prepare(`
          INSERT INTO users (
            id, firstName, lastName, email, phone, companyName, 
            nip, street, postalCode, city, password, verificationToken, isAdmin
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          id,
          userData.firstName,
          userData.lastName,
          userData.email,
          userData.phone,
          userData.companyName,
          userData.nip,
          userData.street,
          userData.postalCode,
          userData.city,
          hashedPassword,
          verificationToken,
          userData.isAdmin || 0,
          function(err) {
            if (err) {
              if (err.message.includes('UNIQUE constraint failed: users.email')) {
                reject(new Error('Email already exists'));
              } else if (err.message.includes('UNIQUE constraint failed: users.nip')) {
                reject(new Error('NIP already exists'));
              } else {
                reject(err);
              }
            } else {
              resolve({ id, verificationToken });
            }
          }
        );
        stmt.finalize();
      } catch (error) {
        reject(error);
      }
    });
  },

  async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  },

  async findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  },

  async findByNip(nip) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE nip = ?', [nip], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  },

  async comparePassword(providedPassword, hashedPassword) {
    return bcrypt.compare(providedPassword, hashedPassword);
  },

  async verifyUser(token) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET isVerified = 1, verificationToken = NULL WHERE verificationToken = ?',
        [token],
        function(err) {
          if (err) {
             console.error("Błąd SQL podczas weryfikacji:", err);
             return reject(err);
          }
          if (this.changes === 0) {
            reject(new Error('Invalid verification token'));
          } else {
            resolve(true);
          }
        }
      );
    });
  },

  async createResetToken(email) {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await this.findByEmail(email);
        if (!user) {
          reject(new Error('User not found'));
          return;
        }

        const resetToken = uuidv4();
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1); // Token ważny przez 1 godzinę

        db.run(
          'UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?',
          [resetToken, resetExpires.toISOString(), email],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ resetToken, email: user.email });
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  },

  async resetPassword(token, newPassword) {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await new Promise((resolve, reject) => {
          db.get(
            'SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpires > ?',
            [token, new Date().toISOString()],
            (err, row) => {
              if (err) reject(err);
              resolve(row);
            }
          );
        });

        if (!user) {
          reject(new Error('Invalid or expired reset token'));
          return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        db.run(
          'UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?',
          [hashedPassword, user.id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(true);
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }
};

// Funkcja do zamykania bazy danych
const closeDb = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing the database', err);
        reject(err);
      } else {
        console.log('Closed the SQLite database connection.');
        resolve();
      }
    });
  });
};

// Handle database errors
db.on('error', (err) => {
    console.error('Database error:', err);
});

// Eksportuj User, db i closeDb
module.exports = { User, db, closeDb };
