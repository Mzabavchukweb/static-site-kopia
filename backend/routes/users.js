const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { getUsers, deleteUser } = require('../controllers/userController');

router.use(protect);
router.use(admin);

router.get('/', getUsers);
router.delete('/:id', deleteUser);

module.exports = router; 