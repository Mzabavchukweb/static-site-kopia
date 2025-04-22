const mongoose = require('mongoose');
const User = require('../models/User');
const { register, login, verifyEmail, resendVerificationEmail } = require('../controllers/userController');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
    // Zatrzymaj istniejące połączenie jeśli istnieje
    await mongoose.disconnect();
    
    // Utwórz nowy serwer MongoDB w pamięci
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Połącz się z nową bazą danych
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

afterAll(async () => {
    // Wyczyść bazę danych i zamknij połączenie
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Wyczyść kolekcję użytkowników przed każdym testem
    await User.deleteMany({});
});

describe('User Controller', () => {
    describe('register', () => {
        it('should register a new user', async () => {
            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'Test123!',
                    firstName: 'John',
                    lastName: 'Doe',
                    companyName: 'Test Company',
                    nip: '1234567890',
                    phone: '123456789',
                    address: {
                        street: 'Test Street',
                        postalCode: '00-000',
                        city: 'Test City'
                    }
                }
            };

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Rejestracja zakończona sukcesem. Sprawdź swój email w celu weryfikacji konta.'
            });

            const user = await User.findOne({ email: 'test@example.com' });
            expect(user).toBeTruthy();
            expect(user.isEmailVerified).toBe(false);
            expect(user.firstName).toBe('John');
            expect(user.lastName).toBe('Doe');
            expect(user.companyName).toBe('Test Company');
        });

        it('should not register user with existing email', async () => {
            // Najpierw utwórz użytkownika
            const existingUser = new User({
                email: 'test@example.com',
                password: 'Test123!',
                firstName: 'John',
                lastName: 'Doe',
                companyName: 'Test Company',
                nip: '1234567890',
                phone: '123456789',
                address: {
                    street: 'Test Street',
                    postalCode: '00-000',
                    city: 'Test City'
                }
            });
            await existingUser.save();

            // Próbuj zarejestrować użytkownika z tym samym emailem
            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'Test123!',
                    firstName: 'Jane',
                    lastName: 'Doe',
                    companyName: 'Another Company',
                    nip: '0987654321',
                    phone: '987654321',
                    address: {
                        street: 'Another Street',
                        postalCode: '11-111',
                        city: 'Another City'
                    }
                }
            };

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Użytkownik o podanym adresie email już istnieje'
            });
        });
    });

    describe('login', () => {
        it('should not login unverified user', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'Test123!',
                firstName: 'John',
                lastName: 'Doe',
                companyName: 'Test Company',
                nip: '1234567890',
                phone: '123456789',
                address: {
                    street: 'Test Street',
                    postalCode: '00-000',
                    city: 'Test City'
                },
                isEmailVerified: false
            });
            await user.save();

            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'Test123!'
                }
            };

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Proszę zweryfikować swój adres email'
            });
        });
    });

    describe('verifyEmail', () => {
        it('should verify user email', async () => {
            const verificationToken = 'test-token';
            const user = new User({
                email: 'test@example.com',
                password: 'Test123!',
                firstName: 'John',
                lastName: 'Doe',
                companyName: 'Test Company',
                nip: '1234567890',
                phone: '123456789',
                address: {
                    street: 'Test Street',
                    postalCode: '00-000',
                    city: 'Test City'
                },
                emailVerificationToken: verificationToken,
                emailVerificationExpires: Date.now() + 3600000
            });
            await user.save();

            const req = {
                params: {
                    token: verificationToken
                }
            };

            const res = {
                json: jest.fn()
            };

            await verifyEmail(req, res);

            const updatedUser = await User.findById(user._id);
            expect(updatedUser.isEmailVerified).toBe(true);
            expect(updatedUser.emailVerificationToken).toBeUndefined();
            expect(updatedUser.emailVerificationExpires).toBeUndefined();
        });
    });

    describe('resendVerificationEmail', () => {
        it('should resend verification email', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'Test123!',
                firstName: 'John',
                lastName: 'Doe',
                companyName: 'Test Company',
                nip: '1234567890',
                phone: '123456789',
                address: {
                    street: 'Test Street',
                    postalCode: '00-000',
                    city: 'Test City'
                },
                isEmailVerified: false
            });
            await user.save();

            const req = {
                body: {
                    email: 'test@example.com'
                }
            };

            const res = {
                json: jest.fn()
            };

            await resendVerificationEmail(req, res);

            const updatedUser = await User.findById(user._id);
            expect(updatedUser.emailVerificationToken).toBeTruthy();
            expect(updatedUser.emailVerificationExpires).toBeTruthy();
            expect(res.json).toHaveBeenCalledWith({
                message: 'Email weryfikacyjny został wysłany ponownie'
            });
        });
    });
}); 