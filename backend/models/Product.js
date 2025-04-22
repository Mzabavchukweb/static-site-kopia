const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        minlength: [2, 'Product name must be at least 2 characters long'],
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    oemNumber: {
        type: String,
        required: [true, 'OEM number is required'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[A-Za-z0-9-]+$/.test(v);
            },
            message: props => `${props.value} is not a valid OEM number. Use only letters, numbers, and hyphens.`
        }
    },
    description: {
        type: String,
        trim: true,
        default: '',
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        validate: {
            validator: function(v) {
                return Number.isFinite(v) && v >= 0;
            },
            message: props => `${props.value} is not a valid price`
        }
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        enum: {
            values: ['Engine Parts', 'Transmission', 'Suspension', 'Brakes', 'Electrical', 'Body Parts', 'Interior', 'Other'],
            message: '{VALUE} is not a valid category'
        }
    },
    brand: {
        type: String,
        required: [true, 'Brand is required'],
        trim: true,
        minlength: [2, 'Brand name must be at least 2 characters long'],
        maxlength: [50, 'Brand name cannot exceed 50 characters']
    },
    images: [{
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+\..+/.test(v);
            },
            message: props => `${props.value} is not a valid URL`
        }
    }],
    specifications: {
        type: Map,
        of: String,
        default: new Map()
    },
    availability: {
        type: String,
        enum: {
            values: ['In Stock', 'On Order', 'Out of Stock'],
            message: '{VALUE} is not a valid availability status'
        },
        default: 'In Stock'
    },
    estimatedDeliveryTime: {
        type: Number,
        default: 0,
        min: [0, 'Estimated delivery time cannot be negative'],
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not a valid number of days'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
    return `$${this.price.toFixed(2)}`;
});

// Index for faster searches
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ oemNumber: 1 }, { unique: true });
productSchema.index({ category: 1, brand: 1 });

module.exports = mongoose.model('Product', productSchema); 