const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

require('./setup');

describe('Inquiries Endpoints', () => {
    let userToken;
    let adminToken;
    
    const validUserData = {
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'test@example.com',
        password: 'TestPass123!',
        companyName: 'Test Company',
        nip: '1234567890',
        phone: '+48123456789',
        address: {
            street: 'Test Street 1',
            postalCode: '00-001',
            city: 'Warsaw',
            country: 'Polska'
        }
    };

    const validInquiryData = {
        title: 'Test Inquiry',
        description: 'This is a test inquiry',
        category: 'general',
        priority: 'medium'
    };

    beforeEach(async () => {
        // Create regular user and get token
        await request(app)
            .post('/api/auth/register')
            .send(validUserData);

        const userLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: validUserData.email,
                password: validUserData.password
            });
        userToken = userLogin.body.token;

        // Create admin user and get token
        const adminData = {
            ...validUserData,
            email: 'admin@example.com',
            nip: '0987654321',
            role: 'admin'
        };
        await request(app)
            .post('/api/auth/register')
            .send(adminData);

        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: adminData.email,
                password: adminData.password
            });
        adminToken = adminLogin.body.token;
    });

    describe('POST /api/inquiries', () => {
        it('should create new inquiry with valid data and user token', async () => {
            const res = await request(app)
                .post('/api/inquiries')
                .set('Authorization', `Bearer ${userToken}`)
                .send(validInquiryData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('title', validInquiryData.title);
            expect(res.body).toHaveProperty('status', 'pending');
        });

        it('should not create inquiry without authentication', async () => {
            const res = await request(app)
                .post('/api/inquiries')
                .send(validInquiryData);

            expect(res.status).toBe(401);
        });

        it('should not create inquiry with missing required fields', async () => {
            const invalidData = {
                title: 'Test Inquiry'
                // Missing other required fields
            };

            const res = await request(app)
                .post('/api/inquiries')
                .set('Authorization', `Bearer ${userToken}`)
                .send(invalidData);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/inquiries', () => {
        beforeEach(async () => {
            // Create some test inquiries
            await request(app)
                .post('/api/inquiries')
                .set('Authorization', `Bearer ${userToken}`)
                .send(validInquiryData);

            await request(app)
                .post('/api/inquiries')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    ...validInquiryData,
                    title: 'Second Inquiry'
                });
        });

        it('should get all inquiries for admin', async () => {
            const res = await request(app)
                .get('/api/inquiries')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBe(2);
        });

        it('should get only user\'s inquiries for regular user', async () => {
            const res = await request(app)
                .get('/api/inquiries')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.every(inquiry => inquiry.user.email === validUserData.email)).toBeTruthy();
        });

        it('should not get inquiries without authentication', async () => {
            const res = await request(app)
                .get('/api/inquiries');

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/inquiries/:id', () => {
        let inquiryId;

        beforeEach(async () => {
            // Create a test inquiry
            const inquiry = await request(app)
                .post('/api/inquiries')
                .set('Authorization', `Bearer ${userToken}`)
                .send(validInquiryData);

            inquiryId = inquiry.body._id;
        });

        it('should update inquiry status as admin', async () => {
            const res = await request(app)
                .put(`/api/inquiries/${inquiryId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'resolved' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status', 'resolved');
        });

        it('should not update inquiry as regular user', async () => {
            const res = await request(app)
                .put(`/api/inquiries/${inquiryId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ status: 'resolved' });

            expect(res.status).toBe(403);
        });

        it('should not update non-existent inquiry', async () => {
            const res = await request(app)
                .put('/api/inquiries/nonexistentid')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'resolved' });

            expect(res.status).toBe(404);
        });
    });
}); 