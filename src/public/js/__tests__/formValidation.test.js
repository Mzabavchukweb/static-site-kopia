// Import the actual validation functions from script.js
const {
  validateRequired,
  validateNIP,
  validateEmail,
  validatePhone,
  validatePostalCode,
  validatePassword,
  validateConfirmPassword
} = require('../script'); // Adjust the path if necessary

// Mock the document object for confirmPassword validation
const mockPassword = 'Test123!@#';
global.document = {
  getElementById: jest.fn((id) => {
    if (id === 'password') {
      return { value: mockPassword };
    }
    return { value: '' };
  })
};

describe('Form Validation', () => {
  test('validates required fields', () => {
    const requiredFields = [
      { id: 'firstName', name: 'Imię' }, 
      { id: 'lastName', name: 'Nazwisko' }, 
      { id: 'companyName', name: 'Nazwa firmy' }, 
      { id: 'street', name: 'Ulica i numer' }, 
      { id: 'city', name: 'Miasto' }
    ];
    requiredFields.forEach(field => {
      expect(validateRequired('', field.name)).toBe(`${field.name} jest wymagane.`);
      expect(validateRequired('Test', field.name)).toBe(true);
    });
  });

  test('validates email format', () => {
    expect(validateEmail('invalid')).toBe('Nieprawidłowy format adresu email.');
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('')).toBe('Adres email jest wymagany.'); // Test empty case
  });

  test('validates phone number', () => {
    expect(validatePhone('123')).toBe('Nieprawidłowy format numeru telefonu (min. 9 cyfr).');
    expect(validatePhone('+48 123-456-789')).toBe(true);
    expect(validatePhone('')).toBe('Numer telefonu jest wymagany.'); // Test empty case
  });

  test('validates NIP', () => {
    expect(validateNIP('123')).toBe('NIP musi składać się z 10 cyfr.');
    expect(validateNIP('1111111111')).toBe('Nieprawidłowy numer NIP (błędna suma kontrolna).');
    expect(validateNIP('5252248481')).toBe(true); // Valid NIP
    expect(validateNIP('')).toBe('NIP jest wymagany.'); // Test empty case
  });

  test('validates postal code', () => {
    expect(validatePostalCode('12345')).toBe('Nieprawidłowy kod pocztowy (format XX-XXX).');
    expect(validatePostalCode('12-345')).toBe(true);
    expect(validatePostalCode('')).toBe('Kod pocztowy jest wymagany.'); // Test empty case
  });

  test('validates password', () => {
    // Test cases from the actual validatePassword function
    expect(validatePassword('')).toBe('Hasło jest wymagane.');
    expect(validatePassword('short')).toBe('Hasło musi mieć co najmniej 8 znaków.');
    expect(validatePassword('nouppercase1!')).toBe('Hasło musi zawierać co najmniej jedną wielką literę.');
    expect(validatePassword('NOLOWERCASE1!')).toBe('Hasło musi zawierać co najmniej jedną małą literę.');
    expect(validatePassword('NoDigitSpecial!')).toBe('Hasło musi zawierać co najmniej jedną cyfrę.');
    expect(validatePassword('NoSpecial123')).toBe('Hasło musi zawierać co najmniej jeden znak specjalny (@$!%*?&).');
    expect(validatePassword('Test123!@#')).toBe(true); // Valid password
  });

  test('validates password confirmation', () => {
    // Using the mocked document.getElementById('password') value
    expect(validateConfirmPassword('', mockPassword)).toBe('Potwierdzenie hasła jest wymagane.');
    expect(validateConfirmPassword('Different123!@#', mockPassword)).toBe('Hasła nie są takie same.');
    expect(validateConfirmPassword(mockPassword, mockPassword)).toBe(true);
    expect(validateConfirmPassword('SomeValue', '')).toBe(true); // Should pass if main password is empty
  });

  // Terms acceptance validation is typically handled directly in the form logic, not a separate function
  // Remove the specific test for 'validateField({ id: 'termsAccepted' }, ...)' if it existed

  // Test('validates terms acceptance', () => {
  //   const termsField = { id: 'termsAccepted' };
  //   expect(validateField(termsField, false)).toBe('Musisz zaakceptować regulamin');
  //   expect(validateField(termsField, true)).toBe(true);
  // });
}); 