const request = require('supertest');
const app = require('../app');
const User = require('../models/user');

describe('API Tests', () => {
    const testUser = {
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'test@example.com',
        phone: '123456789',
        companyName: 'Test Company',
        nip: '1234567890',
        street: 'Test Street 1',
        postalCode: '12-345',
        city: 'Test City',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        termsAccepted: true
    };

    beforeEach(async () => {
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(':memory:');
        await new Promise((resolve) => {
            db.run('DROP TABLE IF EXISTS users', resolve);
        });
    });

    test('should register a new user', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send(testUser)
            .set('Accept', 'application/json')
            .set('X-CSRF-Token', 'test-csrf-token')
            .expect(201);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('userId');
        expect(response.body.message).toContain('Rejestracja przebiegła pomyślnie');
    });

    test('should reject duplicate email', async () => {
        // First registration
        await request(app)
            .post('/api/auth/register')
            .send(testUser)
            .set('Accept', 'application/json')
            .set('X-CSRF-Token', 'test-csrf-token');

        // Duplicate registration
        const response = await request(app)
            .post('/api/auth/register')
            .send(testUser)
            .set('Accept', 'application/json')
            .set('X-CSRF-Token', 'test-csrf-token')
            .expect(400);

        expect(response.body.error).toBe('Ten adres email jest już zarejestrowany');
    });

    test('should reject duplicate NIP', async () => {
        // First registration
        await request(app)
            .post('/api/auth/register')
            .send(testUser)
            .set('Accept', 'application/json')
            .set('X-CSRF-Token', 'test-csrf-token');

        // Duplicate NIP registration
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                ...testUser,
                email: 'another@example.com'
            })
            .set('Accept', 'application/json')
            .set('X-CSRF-Token', 'test-csrf-token')
            .expect(400);

        expect(response.body.error).toBe('Ten NIP jest już zarejestrowany');
    });

    test('should reject invalid data', async () => {
        const invalidUser = {
            ...testUser,
            email: 'invalid-email',
            phone: '123',
            nip: '123',
            password: 'weak'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(invalidUser)
            .set('Accept', 'application/json')
            .set('X-CSRF-Token', 'test-csrf-token')
            .expect(400);

        expect(response.body).toHaveProperty('errors');
        expect(response.body.errors).toBeInstanceOf(Array);
    });

    test('should verify user with valid token', async () => {
        // Register user first
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(testUser)
            .set('Accept', 'application/json')
            .set('X-CSRF-Token', 'test-csrf-token');

        const verifyResponse = await request(app)
            .get(`/api/auth/verify?token=${registerResponse.body.verificationToken}`)
            .expect(200);

        expect(verifyResponse.body.message).toBe('Konto zostało pomyślnie zweryfikowane');
    });

    test('should reject invalid verification token', async () => {
        const response = await request(app)
            .get('/api/auth/verify?token=invalid-token')
            .expect(400);

        expect(response.body.error).toBe('Nieprawidłowy lub nieaktualny token weryfikacyjny');
    });
}); 