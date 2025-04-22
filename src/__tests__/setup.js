// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Let the OS assign a random port

// Increase timeout for tests
jest.setTimeout(30000);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock document
global.document = {
  getElementById: jest.fn(() => ({
    value: 'Test123!@#'
  })),
  querySelector: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  body: {
    innerHTML: ''
  }
};

// Mock CSRF token
jest.mock('csurf', () => {
  return () => (req, res, next) => {
    req.csrfToken = () => 'test-csrf-token';
    next();
  };
});

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

// Global beforeAll hook
beforeAll(async () => {
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database(':memory:');
  await new Promise((resolve) => {
    db.run('DROP TABLE IF EXISTS users', resolve);
  });
});

// Global afterAll hook
afterAll(async () => {
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database(':memory:');
  await new Promise((resolve) => {
    db.run('DROP TABLE IF EXISTS users', resolve);
  });
  await new Promise((resolve) => db.close(resolve));
}); 