const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../backend/app');
const User = require('../../backend/models/User');

describe('Auth Controller', () => {
    let user;

    beforeAll(async () => {
        // Create test user
        user = new User({
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            companyName: 'Test Company',
            nip: '1234567890',
            phone: '+48123456789',
            address: {
                street: 'Test Street',
                postalCode: '00-000',
                city: 'Test City',
                country: 'Polska'
            }
        });
        await user.save();
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'new@example.com',
                    password: 'password123',
                    firstName: 'New',
                    lastName: 'User',
                    companyName: 'New Company',
                    nip: '9876543210',
                    phone: '+48987654321',
                    address: {
                        street: 'New Street',
                        postalCode: '00-001',
                        city: 'New City',
                        country: 'Polska'
                    }
                });

            expect(response.status).toBe(201);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('new@example.com');
        });

        it('should not register with existing email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    firstName: 'Duplicate',
                    lastName: 'User',
                    companyName: 'Duplicate Company',
                    nip: '1111111111',
                    phone: '+48111111111',
                    address: {
                        street: 'Duplicate Street',
                        postalCode: '00-002',
                        city: 'Duplicate City',
                        country: 'Polska'
                    }
                });

            expect(response.status).toBe(400);
        });

        it('should not register with invalid data', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: '123',
                    firstName: 'Invalid',
                    lastName: 'User'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('test@example.com');
        });

        it('should not login with incorrect password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
        });

        it('should not login with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        let token;

        beforeEach(async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            token = loginResponse.body.token;
        });

        it('should get current user data', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.email).toBe('test@example.com');
            expect(response.body.password).toBeUndefined();
        });

        it('should not get user data without token', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.status).toBe(401);
        });

        it('should not get user data with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
        });
    });
}); 