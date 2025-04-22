const User = require('../../backend/models/User');
const mongoose = require('mongoose');

describe('User Model', () => {
    const validUserData = {
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
    };

    describe('Validation', () => {
        it('should create a valid user', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();
            expect(savedUser._id).toBeDefined();
            expect(savedUser.email).toBe(validUserData.email);
            expect(savedUser.firstName).toBe(validUserData.firstName);
            expect(savedUser.lastName).toBe(validUserData.lastName);
            expect(savedUser.companyName).toBe(validUserData.companyName);
            expect(savedUser.nip).toBe(validUserData.nip);
            expect(savedUser.phone).toBe(validUserData.phone);
            expect(savedUser.address).toEqual(validUserData.address);
        });

        it('should require email', async () => {
            const userData = { ...validUserData };
            delete userData.email;
            const user = new User(userData);
            await expect(user.save()).rejects.toThrow();
        });

        it('should require valid email format', async () => {
            const userData = { ...validUserData, email: 'invalid-email' };
            const user = new User(userData);
            await expect(user.save()).rejects.toThrow();
        });

        it('should require password with minimum length', async () => {
            const userData = { ...validUserData, password: '12345' };
            const user = new User(userData);
            await expect(user.save()).rejects.toThrow();
        });

        it('should require password with at least one digit', async () => {
            const userData = { ...validUserData, password: 'password' };
            const user = new User(userData);
            await expect(user.save()).rejects.toThrow();
        });

        it('should hash password before saving', async () => {
            const user = new User(validUserData);
            await user.save();
            expect(user.password).not.toBe(validUserData.password);
        });

        it('should compare password correctly', async () => {
            const user = new User(validUserData);
            await user.save();
            const isMatch = await user.comparePassword(validUserData.password);
            expect(isMatch).toBe(true);
        });
    });

    describe('Unique Fields', () => {
        it('should not allow duplicate email', async () => {
            const user1 = new User(validUserData);
            await user1.save();
            
            const user2 = new User({ ...validUserData, nip: '0987654321' });
            await expect(user2.save()).rejects.toThrow();
        });

        it('should not allow duplicate NIP', async () => {
            const user1 = new User(validUserData);
            await user1.save();
            
            const user2 = new User({ ...validUserData, email: 'test2@example.com' });
            await expect(user2.save()).rejects.toThrow();
        });
    });

    describe('Default Values', () => {
        it('should set default role to user', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();
            expect(savedUser.role).toBe('user');
        });

        it('should set default isActive to true', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();
            expect(savedUser.isActive).toBe(true);
        });

        it('should set default country to Polska', async () => {
            const userData = { ...validUserData };
            delete userData.address.country;
            const user = new User(userData);
            const savedUser = await user.save();
            expect(savedUser.address.country).toBe('Polska');
        });
    });
}); 