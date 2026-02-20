const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/submit', protect, reviewController.submitReview);
router.get('/', protect, adminOnly, reviewController.getReviews);
router.get('/analytics', protect, adminOnly, reviewController.getAnalytics);
router.get('/batches', protect, adminOnly, reviewController.getBatches);
router.delete('/batch/:batchId', protect, adminOnly, reviewController.deleteBatch);
router.post('/bulk-submit', protect, adminOnly, reviewController.bulkSubmitReviews);

module.exports = router;
