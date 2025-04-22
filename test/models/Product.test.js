const Product = require('../../backend/models/Product');

describe('Product Model', () => {
    const validProductData = {
        name: 'Test Product',
        oemNumber: 'ABC123',
        description: 'Test description',
        price: 100.50,
        category: 'Test Category',
        brand: 'Test Brand',
        images: ['https://example.com/image1.jpg'],
        specifications: {
            weight: '1kg',
            dimensions: '10x10x10'
        }
    };

    describe('Validation', () => {
        it('should create a valid product', async () => {
            const product = new Product(validProductData);
            const savedProduct = await product.save();
            expect(savedProduct._id).toBeDefined();
            expect(savedProduct.name).toBe(validProductData.name);
            expect(savedProduct.oemNumber).toBe(validProductData.oemNumber);
            expect(savedProduct.price).toBe(validProductData.price);
            expect(savedProduct.category).toBe(validProductData.category);
            expect(savedProduct.brand).toBe(validProductData.brand);
        });

        it('should require name', async () => {
            const productData = { ...validProductData };
            delete productData.name;
            const product = new Product(productData);
            await expect(product.save()).rejects.toThrow();
        });

        it('should require oemNumber', async () => {
            const productData = { ...validProductData };
            delete productData.oemNumber;
            const product = new Product(productData);
            await expect(product.save()).rejects.toThrow();
        });

        it('should require valid oemNumber format', async () => {
            const productData = { ...validProductData, oemNumber: 'abc!@#' };
            const product = new Product(productData);
            await expect(product.save()).rejects.toThrow();
        });

        it('should require price', async () => {
            const productData = { ...validProductData };
            delete productData.price;
            const product = new Product(productData);
            await expect(product.save()).rejects.toThrow();
        });

        it('should require positive price', async () => {
            const productData = { ...validProductData, price: -100 };
            const product = new Product(productData);
            await expect(product.save()).rejects.toThrow();
        });

        it('should require category', async () => {
            const productData = { ...validProductData };
            delete productData.category;
            const product = new Product(productData);
            await expect(product.save()).rejects.toThrow();
        });

        it('should require brand', async () => {
            const productData = { ...validProductData };
            delete productData.brand;
            const product = new Product(productData);
            await expect(product.save()).rejects.toThrow();
        });
    });

    describe('Unique Fields', () => {
        it('should not allow duplicate oemNumber', async () => {
            const product1 = new Product(validProductData);
            await product1.save();
            
            const product2 = new Product({ ...validProductData, name: 'Different Name' });
            await expect(product2.save()).rejects.toThrow();
        });
    });

    describe('Default Values', () => {
        it('should set default availability to available', async () => {
            const product = new Product(validProductData);
            const savedProduct = await product.save();
            expect(savedProduct.availability).toBe('available');
        });

        it('should set default estimatedDeliveryTime to 0', async () => {
            const product = new Product(validProductData);
            const savedProduct = await product.save();
            expect(savedProduct.estimatedDeliveryTime).toBe(0);
        });

        it('should set default isActive to true', async () => {
            const product = new Product(validProductData);
            const savedProduct = await product.save();
            expect(savedProduct.isActive).toBe(true);
        });
    });

    describe('Optional Fields', () => {
        it('should allow empty description', async () => {
            const productData = { ...validProductData };
            delete productData.description;
            const product = new Product(productData);
            const savedProduct = await product.save();
            expect(savedProduct.description).toBeUndefined();
        });

        it('should allow empty images array', async () => {
            const productData = { ...validProductData };
            delete productData.images;
            const product = new Product(productData);
            const savedProduct = await product.save();
            expect(savedProduct.images).toEqual([]);
        });

        it('should allow empty specifications', async () => {
            const productData = { ...validProductData };
            delete productData.specifications;
            const product = new Product(productData);
            const savedProduct = await product.save();
            expect(savedProduct.specifications).toEqual({});
        });
    });
}); 