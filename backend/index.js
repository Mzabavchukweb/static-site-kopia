require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const app = require('./app');

// Check required environment variables
const requiredEnvVars = ['JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB successfully');
        
        // Start server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log('Environment:', process.env.NODE_ENV);
            console.log('MongoDB URI:', process.env.MONGODB_URI);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        process.exit(1);
    }); 