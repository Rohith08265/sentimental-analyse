const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/analyze/csv — Analyze any CSV with feedback/review content
router.post('/csv', protect, analyzeController.analyzeCSV);

module.exports = router;
