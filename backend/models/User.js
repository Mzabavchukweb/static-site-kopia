const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Lista obsługiwanych krajów z ich kodami NIP/VAT
const SUPPORTED_COUNTRIES = {
    'PL': { name: 'Polska', nipLength: 10, nipRegex: /^\d{10}$/ },
    'DE': { name: 'Niemcy', nipLength: 9, nipRegex: /^\d{9}$/ },
    'CZ': { name: 'Czechy', nipLength: 8, nipRegex: /^\d{8}$/ }
};

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Imię jest wymagane'],
        trim: true,
        minlength: [2, 'Imię musi mieć co najmniej 2 znaki'],
        maxlength: [50, 'Imię nie może przekraczać 50 znaków']
    },
    lastName: {
        type: String,
        required: [true, 'Nazwisko jest wymagane'],
        trim: true,
        minlength: [2, 'Nazwisko musi mieć co najmniej 2 znaki'],
        maxlength: [50, 'Nazwisko nie może przekraczać 50 znaków']
    },
    email: {
        type: String,
        required: [true, 'Email jest wymagany'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Nieprawidłowy format adresu email']
    },
    password: {
        type: String,
        required: [true, 'Hasło jest wymagane'],
        minlength: [8, 'Hasło musi mieć co najmniej 8 znaków'],
        validate: {
            validator: function(v) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
            },
            message: 'Hasło musi zawierać co najmniej jedną wielką literę, jedną małą literę, jedną cyfrę i jeden znak specjalny'
        }
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    companyName: {
        type: String,
        required: [true, 'Nazwa firmy jest wymagana'],
        trim: true,
        minlength: [2, 'Nazwa firmy musi mieć co najmniej 2 znaki'],
        maxlength: [100, 'Nazwa firmy nie może przekraczać 100 znaków']
    },
    companyCountry: {
        type: String,
        required: [true, 'Kraj firmy jest wymagany'],
        enum: {
            values: Object.keys(SUPPORTED_COUNTRIES),
            message: 'Nieobsługiwany kraj'
        }
    },
    nip: {
        type: String,
        required: [true, 'NIP jest wymagany'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                const country = SUPPORTED_COUNTRIES[this.companyCountry];
                return country.nipRegex.test(v);
            },
            message: function(props) {
                const country = SUPPORTED_COUNTRIES[this.companyCountry];
                return `NIP musi składać się z ${country.nipLength} cyfr`;
            }
        }
    },
    phone: {
        type: String,
        required: [true, 'Numer telefonu jest wymagany'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^\+?[0-9\s-]{9,}$/.test(v);
            },
            message: 'Nieprawidłowy format numeru telefonu'
        }
    },
    address: {
        street: {
            type: String,
            required: [true, 'Ulica jest wymagana'],
            trim: true,
            maxlength: [100, 'Nazwa ulicy nie może przekraczać 100 znaków']
        },
        postalCode: {
            type: String,
            required: [true, 'Kod pocztowy jest wymagany'],
            trim: true,
            validate: {
                validator: function(v) {
                    const country = SUPPORTED_COUNTRIES[this.companyCountry];
                    switch(country) {
                        case 'PL':
                            return /^\d{2}-\d{3}$/.test(v);
                        case 'DE':
                            return /^\d{5}$/.test(v);
                        case 'CZ':
                            return /^\d{3}\s?\d{2}$/.test(v);
                        default:
                            return true;
                    }
                },
                message: function(props) {
                    const country = SUPPORTED_COUNTRIES[this.companyCountry];
                    switch(country) {
                        case 'PL':
                            return 'Nieprawidłowy format kodu pocztowego (XX-XXX)';
                        case 'DE':
                            return 'Nieprawidłowy format kodu pocztowego (XXXXX)';
                        case 'CZ':
                            return 'Nieprawidłowy format kodu pocztowego (XXX XX)';
                        default:
                            return 'Nieprawidłowy format kodu pocztowego';
                    }
                }
            }
        },
        city: {
            type: String,
            required: [true, 'Miasto jest wymagane'],
            trim: true,
            maxlength: [50, 'Nazwa miasta nie może przekraczać 50 znaków']
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    accountLockedUntil: {
        type: Date
    }
}, {
    timestamps: true
});

// Wirtualne pola
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('formattedPhone').get(function() {
    return this.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
});

// Middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Metody
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateVerificationToken = function() {
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    this.emailVerificationToken = token;
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 godziny
    
    return token;
};

userSchema.methods.incrementFailedLoginAttempts = async function() {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= 5) {
        this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minut
    }
    await this.save();
};

userSchema.methods.resetFailedLoginAttempts = async function() {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = null;
    await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 