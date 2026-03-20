const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// New: Get user profile/role (after Supabase Auth login)
router.get('/profile', protect, authController.getProfile);

// Legacy routes (return 410 Gone)
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
