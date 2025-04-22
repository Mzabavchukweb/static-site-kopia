const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

// Dane testowe
const testUser = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'test@example.com',
    password: 'Test123!@#',
    companyName: 'Test Company',
    companyCountry: 'PL',
    nip: '1234567890',
    phone: '+48123456789',
    address: {
        street: 'Testowa 1',
        postalCode: '00-001',
        city: 'Warszawa'
    }
};

describe('Testy rejestracji i logowania', () => {
    beforeAll(async () => {
        // Połączenie z bazą testową
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db');
    });

    afterAll(async () => {
        // Zamknięcie połączenia
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Czyszczenie bazy przed każdym testem
        await User.deleteMany({});
    });

    describe('Rejestracja', () => {
        it('powinna zarejestrować nowego użytkownika', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);
        });

        it('nie powinna zarejestrować użytkownika z istniejącym emailem', async () => {
            // Najpierw rejestrujemy użytkownika
            await request(app)
                .post('/api/auth/register')
                .send(testUser);

            // Próbujemy zarejestrować tego samego użytkownika ponownie
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Użytkownik z tym adresem email już istnieje');
        });

        it('nie powinna zarejestrować użytkownika z nieprawidłowymi danymi', async () => {
            const invalidUser = {
                ...testUser,
                email: 'nieprawidłowy-email',
                password: '123'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(invalidUser);

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });
    });

    describe('Logowanie', () => {
        beforeEach(async () => {
            // Rejestrujemy użytkownika przed testami logowania
            await request(app)
                .post('/api/auth/register')
                .send(testUser);
        });

        it('powinno zalogować użytkownika z prawidłowymi danymi', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.email).toBe(testUser.email);
        });

        it('nie powinno zalogować użytkownika z nieprawidłowym hasłem', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'nieprawidłowe-hasło'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('Nieprawidłowe dane logowania');
        });
    });
}); 