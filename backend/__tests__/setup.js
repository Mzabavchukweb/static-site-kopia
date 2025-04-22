const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'test.env') });

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({
            messageId: 'test-message-id'
        })
    })
}));

let mongod;

// Connect to the in-memory database before running tests
beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
});

// Clear database between tests
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
    jest.clearAllMocks();
});

// Close database connection after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
}); 