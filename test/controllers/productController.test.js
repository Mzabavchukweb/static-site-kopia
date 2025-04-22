const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../backend/app');
const Product = require('../../backend/models/Product');
const User = require('../../backend/models/User');

describe('Product Controller', () => {
    let admin;
    let adminToken;
    let product;

    beforeAll(async () => {
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

        // Get admin token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'admin123'
            });
        adminToken = loginResponse.body.token;

        // Create test product
        product = new Product({
            name: 'Test Product',
            oemNumber: 'ABC123',
            price: 100.50,
            category: 'Test Category',
            brand: 'Test Brand'
        });
        await product.save();
    });

    afterAll(async () => {
        await Product.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe('GET /api/products', () => {
        it('should get all products', async () => {
            const response = await request(app)
                .get('/api/products');

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe('Test Product');
        });

        it('should filter products by category', async () => {
            const response = await request(app)
                .get('/api/products?category=Test Category');

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
        });

        it('should return empty array for non-existent category', async () => {
            const response = await request(app)
                .get('/api/products?category=NonExistent');

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(0);
        });
    });

    describe('GET /api/products/:id', () => {
        it('should get product by id', async () => {
            const response = await request(app)
                .get(`/api/products/${product._id}`);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Test Product');
        });

        it('should return 404 for non-existent product', async () => {
            const response = await request(app)
                .get('/api/products/123456789012');

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/products', () => {
        it('should create new product as admin', async () => {
            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'New Product',
                    oemNumber: 'XYZ789',
                    price: 200.00,
                    category: 'New Category',
                    brand: 'New Brand'
                });

            expect(response.status).toBe(201);
            expect(response.body.name).toBe('New Product');
        });

        it('should not create product without required fields', async () => {
            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Incomplete Product'
                });

            expect(response.status).toBe(400);
        });

        it('should not create product with duplicate oemNumber', async () => {
            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Duplicate Product',
                    oemNumber: 'ABC123',
                    price: 300.00,
                    category: 'Test Category',
                    brand: 'Test Brand'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/products/:id', () => {
        it('should update product as admin', async () => {
            const response = await request(app)
                .put(`/api/products/${product._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    price: 150.00
                });

            expect(response.status).toBe(200);
            expect(response.body.price).toBe(150.00);
        });

        it('should not update non-existent product', async () => {
            const response = await request(app)
                .put('/api/products/123456789012')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    price: 200.00
                });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should delete product as admin', async () => {
            const response = await request(app)
                .delete(`/api/products/${product._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        it('should not delete non-existent product', async () => {
            const response = await request(app)
                .delete('/api/products/123456789012')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });
}); 