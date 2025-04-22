const Inquiry = require('../../backend/models/Inquiry');
const User = require('../../backend/models/User');
const Product = require('../../backend/models/Product');

describe('Inquiry Model', () => {
    let user;
    let product;
    let validInquiryData;

    beforeEach(async () => {
        // Create a test user
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

        // Create a test product
        product = new Product({
            name: 'Test Product',
            oemNumber: 'ABC123',
            price: 100.50,
            category: 'Test Category',
            brand: 'Test Brand'
        });
        await product.save();

        // Prepare valid inquiry data
        validInquiryData = {
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
        };
    });

    describe('Validation', () => {
        it('should create a valid inquiry', async () => {
            const inquiry = new Inquiry(validInquiryData);
            const savedInquiry = await inquiry.save();
            expect(savedInquiry._id).toBeDefined();
            expect(savedInquiry.user.toString()).toBe(user._id.toString());
            expect(savedInquiry.items[0].product.toString()).toBe(product._id.toString());
            expect(savedInquiry.estimatedValue).toBe(validInquiryData.estimatedValue);
            expect(savedInquiry.totalAmount).toBe(validInquiryData.totalAmount);
        });

        it('should require user', async () => {
            const inquiryData = { ...validInquiryData };
            delete inquiryData.user;
            const inquiry = new Inquiry(inquiryData);
            await expect(inquiry.save()).rejects.toThrow();
        });

        it('should require at least one item', async () => {
            const inquiryData = { ...validInquiryData, items: [] };
            const inquiry = new Inquiry(inquiryData);
            await expect(inquiry.save()).rejects.toThrow();
        });

        it('should require valid product ID in items', async () => {
            const inquiryData = { ...validInquiryData };
            inquiryData.items[0].product = 'invalid-id';
            const inquiry = new Inquiry(inquiryData);
            await expect(inquiry.save()).rejects.toThrow();
        });

        it('should require positive quantity', async () => {
            const inquiryData = { ...validInquiryData };
            inquiryData.items[0].quantity = 0;
            const inquiry = new Inquiry(inquiryData);
            await expect(inquiry.save()).rejects.toThrow();
        });

        it('should require positive price', async () => {
            const inquiryData = { ...validInquiryData };
            inquiryData.items[0].price = -100;
            const inquiry = new Inquiry(inquiryData);
            await expect(inquiry.save()).rejects.toThrow();
        });

        it('should require valid delivery method', async () => {
            const inquiryData = { ...validInquiryData, deliveryMethod: 'invalid' };
            const inquiry = new Inquiry(inquiryData);
            await expect(inquiry.save()).rejects.toThrow();
        });

        it('should require valid payment method', async () => {
            const inquiryData = { ...validInquiryData, paymentMethod: 'invalid' };
            const inquiry = new Inquiry(inquiryData);
            await expect(inquiry.save()).rejects.toThrow();
        });
    });

    describe('Default Values', () => {
        it('should set default status to pending', async () => {
            const inquiry = new Inquiry(validInquiryData);
            const savedInquiry = await inquiry.save();
            expect(savedInquiry.status).toBe('pending');
        });

        it('should set default b2bDiscount to 0', async () => {
            const inquiryData = { ...validInquiryData };
            delete inquiryData.b2bDiscount;
            const inquiry = new Inquiry(inquiryData);
            const savedInquiry = await inquiry.save();
            expect(savedInquiry.b2bDiscount).toBe(0);
        });
    });

    describe('Calculations', () => {
        it('should calculate total amount correctly', async () => {
            const inquiry = new Inquiry(validInquiryData);
            const savedInquiry = await inquiry.save();
            
            const expectedTotal = validInquiryData.estimatedValue * (1 - validInquiryData.b2bDiscount / 100) + validInquiryData.deliveryCost;
            expect(savedInquiry.totalAmount).toBe(expectedTotal);
        });
    });
}); 