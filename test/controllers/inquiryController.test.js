const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../backend/app');
const Inquiry = require('../../backend/models/Inquiry');
const User = require('../../backend/models/User');
const Product = require('../../backend/models/Product');

describe('Inquiry Controller', () => {
    let user;
    let admin;
    let product;
    let userToken;
    let adminToken;
    let inquiry;

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

        // Create admin user
        admin = new User({
            email: 'admin@example.com',
            password: 'admin123',
            firstName: 'Admin',
            lastName: 'User',
            companyName: 'Admin Company',
            nip: '0987654321',
            phone: '+48987654321',
            address: {
                street: 'Admin Street',
                postalCode: '00-001',
                city: 'Admin City',
                country: 'Polska'
            },
            isAdmin: true
        });
        await admin.save();

        // Create test product
        product = new Product({
            name: 'Test Product',
            oemNumber: 'ABC123',
            price: 100.50,
            category: 'Test Category',
            brand: 'Test Brand'
        });
        await product.save();

        // Get tokens
        const userLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        userToken = userLogin.body.token;

        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'admin123'
            });
        adminToken = adminLogin.body.token;
    });

    beforeEach(async () => {
        // Create test inquiry
        inquiry = new Inquiry({
            user: user._id,
            items: [{
                product: product._id,
                quantity: 2,
                price: 100.50
            }],
            estimatedValue: 201.00,
            b2bDiscount: 10,
            deliveryCost: 20.00,
            totalAmount: 200.90,
            deliveryAddress: {
                street: 'Delivery Street',
                postalCode: '00-001',
                city: 'Delivery City',
                country: 'Polska'
            },
            deliveryMethod: 'standard',
            paymentMethod: 'bank_transfer'
        });
        await inquiry.save();
    });

    afterEach(async () => {
        await Inquiry.deleteMany({});
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Product.deleteMany({});
        await mongoose.connection.close();
    });

    describe('POST /api/inquiries', () => {
        it('should create a new inquiry', async () => {
            const response = await request(app)
                .post('/api/inquiries')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    items: [{
                        product: product._id,
                        quantity: 1,
                        price: 100.50
                    }],
                    estimatedValue: 100.50,
                    b2bDiscount: 5,
                    deliveryCost: 15.00,
                    totalAmount: 110.48,
                    deliveryAddress: {
                        street: 'New Street',
                        postalCode: '00-002',
                        city: 'New City',
                        country: 'Polska'
                    },
                    deliveryMethod: 'express',
                    paymentMethod: 'bank_transfer'
                });

            expect(response.status).toBe(201);
            expect(response.body.user).toBe(user._id.toString());
            expect(response.body.status).toBe('pending');
        });

        it('should not create inquiry without required fields', async () => {
            const response = await request(app)
                .post('/api/inquiries')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    items: []
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/inquiries', () => {
        it('should get all user inquiries', async () => {
            const response = await request(app)
                .get('/api/inquiries')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].user).toBe(user._id.toString());
        });
    });

    describe('GET /api/inquiries/:id', () => {
        it('should get inquiry by id', async () => {
            const response = await request(app)
                .get(`/api/inquiries/${inquiry._id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body._id).toBe(inquiry._id.toString());
        });

        it('should not get inquiry with invalid id', async () => {
            const response = await request(app)
                .get('/api/inquiries/invalid-id')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(500);
        });

        it('should not get other user inquiry', async () => {
            const otherUser = new User({
                email: 'other@example.com',
                password: 'password123',
                firstName: 'Other',
                lastName: 'User',
                companyName: 'Other Company',
                nip: '1111111111',
                phone: '+48111111111',
                address: {
                    street: 'Other Street',
                    postalCode: '00-003',
                    city: 'Other City',
                    country: 'Polska'
                }
            });
            await otherUser.save();

            const otherUserLogin = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'other@example.com',
                    password: 'password123'
                });

            const response = await request(app)
                .get(`/api/inquiries/${inquiry._id}`)
                .set('Authorization', `Bearer ${otherUserLogin.body.token}`);

            expect(response.status).toBe(403);
        });
    });

    describe('PUT /api/inquiries/:id/status', () => {
        it('should update inquiry status as admin', async () => {
            const response = await request(app)
                .put(`/api/inquiries/${inquiry._id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'processing'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('processing');
        });

        it('should not update inquiry status as regular user', async () => {
            const response = await request(app)
                .put(`/api/inquiries/${inquiry._id}/status`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    status: 'processing'
                });

            expect(response.status).toBe(403);
        });
    });

    describe('PUT /api/inquiries/:id/cancel', () => {
        it('should cancel pending inquiry', async () => {
            const response = await request(app)
                .put(`/api/inquiries/${inquiry._id}/cancel`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('cancelled');
        });

        it('should not cancel non-pending inquiry', async () => {
            inquiry.status = 'processing';
            await inquiry.save();

            const response = await request(app)
                .put(`/api/inquiries/${inquiry._id}/cancel`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(400);
        });
    });
}); 