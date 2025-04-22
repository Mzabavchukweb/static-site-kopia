const Inquiry = require('../models/Inquiry');
const Product = require('../models/Product');
const User = require('../models/User');

// Create a new inquiry
exports.createInquiry = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, message, quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: 'Proszę podać prawidłową ilość produktu' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Produkt nie znaleziony' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        }

        const newInquiry = new Inquiry({
            user: userId,
            product: productId,
            productName: product.name,
            userName: `${user.firstName} ${user.lastName}`,
            userEmail: user.email,
            userPhone: user.phone || '',
            userCompanyName: user.companyName || '',
            quantity: quantity,
            message: message || ''
        });

        await newInquiry.save();

        res.status(201).json({ message: 'Zapytanie zostało wysłane pomyślnie', inquiry: newInquiry });
    } catch (error) {
        console.error('Błąd podczas tworzenia zapytania:', error);
        res.status(500).json({ message: 'Błąd serwera podczas wysyłania zapytania', error: error.message });
    }
};

// Get all user inquiries
exports.getUserInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find({ user: req.user._id })
            .sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get inquiry by ID
exports.getInquiryById = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id)
            .populate('user', 'firstName lastName email companyName phone')
            .populate('product');

        if (!inquiry) {
            return res.status(404).json({ message: 'Zapytanie nie znalezione' });
        }

        // Check if user is authorized to view this inquiry
        if (inquiry.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(inquiry);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

// Update inquiry status (admin only)
exports.updateInquiryStatus = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { status } = req.body;
        const allowedStatuses = ['Nowe', 'W trakcie', 'Zakończone', 'Anulowane'];
        if (!allowedStatuses.includes(status)){
            return res.status(400).json({ message: 'Nieprawidłowy status' });
        }

        const inquiry = await Inquiry.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!inquiry) {
            return res.status(404).json({ message: 'Zapytanie nie znalezione' });
        }
        res.json({ message: 'Status zapytania zaktualizowany', inquiry });
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

// Cancel inquiry
exports.cancelInquiry = async (req, res) => {
    try {
        const inquiry = await Inquiry.findById(req.params.id);

        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        // Check if user is authorized to cancel this inquiry
        if (inquiry.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Only allow cancellation if inquiry is still pending
        if (inquiry.status !== 'pending') {
            return res.status(400).json({ message: 'Can only cancel pending inquiries' });
        }

        inquiry.status = 'cancelled';
        await inquiry.save();

        res.json(inquiry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Pobieranie wszystkich zapytań (dla admina)
exports.getAllInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
}; 