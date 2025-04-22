const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required']
    },
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    userName: {
        type: String,
        required: [true, 'User name is required'],
        trim: true
    },
    userEmail: {
        type: String,
        required: [true, 'User email is required'],
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        validate: {
            validator: Number.isInteger,
            message: 'Quantity must be a whole number'
        }
    },
    message: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: {
            values: ['New', 'In Progress', 'Completed', 'Cancelled'],
            message: '{VALUE} is not a valid status'
        },
        default: 'New'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    userPhone: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return !v || /^\+?\d{9,}$/.test(v);
            },
            message: 'Please enter a valid phone number'
        }
    },
    userCompanyName: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

inquirySchema.pre('save', function(next) {
    if (this.isNew) {
        this.status = 'New';
    }
    next();
});

const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = Inquiry; 