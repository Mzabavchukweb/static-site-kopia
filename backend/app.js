const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const inquiryRoutes = require('./routes/inquiries');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inquiries', inquiryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app; 