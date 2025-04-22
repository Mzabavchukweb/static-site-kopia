const Product = require('../models/Product');

// Publiczny endpoint - podstawowe informacje o produktach
exports.getPublicProducts = async (req, res) => {
    try {
        const { category, brand, search } = req.query;
        const query = {};

        if (category) query.category = category;
        if (brand) query['compatibility.brand'] = brand;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { oemNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // Zwracamy tylko podstawowe informacje
        const products = await Product.find(query).select('name category oemNumber compatibility.brand thumbnail');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

// Publiczny endpoint - podstawowe informacje o pojedynczym produkcie
exports.getPublicProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .select('name category oemNumber compatibility.brand thumbnail description');
        if (!product) {
            return res.status(404).json({ message: 'Produkt nie znaleziony' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

// Chroniony endpoint - pełne informacje o produktach (tylko dla zalogowanych)
exports.getAllProducts = async (req, res) => {
    try {
        const { category, brand, minPrice, maxPrice, availability, search } = req.query;
        const query = {};

        if (category) query.category = category;
        if (brand) query['compatibility.brand'] = brand;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        if (availability) query.availability = availability;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { oemNumber: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const products = await Product.find(query);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

// Chroniony endpoint - pełne informacje o pojedynczym produkcie (tylko dla zalogowanych)
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Produkt nie znaleziony' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

// Tylko dla administratorów
exports.createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!product) {
            return res.status(404).json({ message: 'Produkt nie znaleziony' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Produkt nie znaleziony' });
        }
        res.json({ message: 'Produkt usunięty pomyślnie' });
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
}; 