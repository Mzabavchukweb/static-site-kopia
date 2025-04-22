const request = require('supertest');
const app = require('../app');
const { User, db, closeDb } = require('../models/user');

describe('E2E Registration Process', () => {
    const testUser = {
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'test.e2e@example.com',
        phone: '123456789',
        companyName: 'Test E2E Company',
        nip: '1112223330',
        street: 'Test Street 1',
        postalCode: '12-345',
        city: 'Test City',
        password: 'TestPass123!@#',
        confirmPassword: 'TestPass123!@#',
        termsAccepted: true
    };

    let server;
    let verificationToken;

    beforeAll(async () => {
        console.log("Rozpoczynanie beforeAll dla E2E...");
        const runDb = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function(err) {
                    if (err) {
                        console.error('Błąd wykonania SQL:', sql, params, err);
                        reject(err);
                    } else {
                        resolve(this);
                    }
                });
            });
        };

        try {
            server = await new Promise((resolve, reject) => {
                const s = app.listen(0, () => {
                    console.log(`Serwer testowy E2E nasłuchuje na porcie ${s.address().port}`);
                    resolve(s);
                });
                s.on('error', reject);
            });
        } catch (err) {
            console.error('Nie udało się uruchomić serwera testowego E2E:', err);
            throw err;
        }

        try {
            await runDb(`
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
                    verificationToken TEXT UNIQUE,
                    tokenExpiry INTEGER,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);
            await runDb('DELETE FROM users');
            console.log('Baza danych testowa E2E zainicjalizowana pomyślnie.');
        } catch (err) {
            console.error('Krytyczny błąd inicjalizacji bazy danych E2E:', err);
            if (server) await new Promise(resolve => server.close(resolve));
            throw err;
        }
        console.log("Zakończono beforeAll dla E2E.");
    }, 40000);

    afterAll(async () => {
        console.log("Rozpoczynanie afterAll dla E2E...");
        try {
            await closeDb();
        } catch (err) {
            console.error('Błąd podczas zamykania bazy danych:', err);
        }
        try {
            if (server) {
                await new Promise((resolve, reject) => {
                    server.close((err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                console.log('Serwer testowy E2E zamknięty.');
            }
        } catch(err) {
            console.error('Błąd podczas zamykania serwera testowego:', err);
        }
        console.log("Zakończono afterAll dla E2E.");
    });

    beforeEach(async () => {
        try {
            await new Promise((resolve, reject) => {
                db.run('DELETE FROM users', (err) => err ? reject(err) : resolve());
            });
        } catch (err) {
            console.error('Błąd podczas czyszczenia tabeli w beforeEach:', err);
            throw err;
        }
    });

    test('should complete full registration process', async () => {
        const response = await request(server)
            .post('/api/auth/register')
            .send(testUser)
            .set('Accept', 'application/json')
            .expect(201);

        expect(response.body).toHaveProperty('userId');
        expect(response.body).toHaveProperty('message', 'Rejestracja przebiegła pomyślnie! Sprawdź swoją skrzynkę email, aby aktywować konto.');

        const tokenRow = await new Promise((resolve, reject) => {
            db.get('SELECT verificationToken FROM users WHERE email = ?', [testUser.email], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        expect(tokenRow).toBeDefined();
        expect(tokenRow.verificationToken).toBeDefined();
        verificationToken = tokenRow.verificationToken;
        expect(typeof verificationToken).toBe('string');

        const verifyResponse = await request(server)
            .get(`/api/auth/verify?token=${verificationToken}`)
            .expect(200)
            .expect('Content-Type', /html/);

        expect(verifyResponse.text).toContain('Konto zostało pomyślnie zweryfikowane!');
        expect(verifyResponse.text).toContain('Możesz się teraz zalogować.');

        const userRow = await new Promise((resolve, reject) => {
            db.get('SELECT isVerified FROM users WHERE email = ?', [testUser.email], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        expect(userRow).toBeDefined();
        expect(userRow.isVerified).toBe(1);
    }, 15000);

    test('should handle invalid registration data (e.g., invalid email, weak password)', async () => {
        const invalidUser = {
            ...testUser,
            email: 'invalid-email-format',
            password: 'short',
            nip: '123'
        };

        const response = await request(server)
            .post('/api/auth/register')
            .send(invalidUser)
            .set('Accept', 'application/json')
            .expect(400);

        expect(response.body).toHaveProperty('message', 'Wystąpiły błędy walidacji. Sprawdź dane formularza.');
        expect(response.body).toHaveProperty('errors');
        expect(Array.isArray(response.body.errors)).toBe(true);
        const errorParams = response.body.errors.map(err => err.param);
        expect(errorParams).toEqual(expect.arrayContaining(['email', 'password', 'nip']));
    });

    test('should handle duplicate email registration with 409 status', async () => {
        await request(server)
            .post('/api/auth/register')
            .send(testUser)
            .expect(201);

        const response = await request(server)
            .post('/api/auth/register')
            .send(testUser)
            .set('Accept', 'application/json')
            .expect(409);

        expect(response.body).toHaveProperty('message', 'Rejestracja nie powiodła się.');
        expect(response.body).toHaveProperty('errors');
        expect(Array.isArray(response.body.errors)).toBe(true);
        expect(response.body.errors[0]).toHaveProperty('param', 'email');
        expect(response.body.errors[0]).toHaveProperty('msg', 'Podany adres email jest już zarejestrowany w systemie.');
    });

    test('should handle duplicate NIP registration with 409 status', async () => {
        await request(server)
            .post('/api/auth/register')
            .send(testUser)
            .expect(201);

        const userWithSameNip = {
            ...testUser,
            email: 'another.email@example.com',
            firstName: 'Anna',
            lastName: 'Nowak'
        };

        const response = await request(server)
            .post('/api/auth/register')
            .send(userWithSameNip)
            .set('Accept', 'application/json')
            .expect(409);

        expect(response.body).toHaveProperty('message', 'Rejestracja nie powiodła się.');
        expect(response.body).toHaveProperty('errors');
        expect(Array.isArray(response.body.errors)).toBe(true);
        expect(response.body.errors[0]).toHaveProperty('param', 'nip');
        expect(response.body.errors[0]).toHaveProperty('msg', 'Podany NIP jest już zarejestrowany w systemie.');
    });

    test('should handle invalid verification token with 400 status and HTML response', async () => {
        const invalidToken = 'this-is-an-invalid-token';
        const response = await request(server)
            .get(`/api/auth/verify?token=${invalidToken}`)
            .expect(400)
            .expect('Content-Type', /html/);

        expect(response.text).toContain('Weryfikacja nie powiodła się');
        expect(response.text).toContain('Link weryfikacyjny jest nieprawidłowy, wygasł lub został już użyty.');
    });
}); 