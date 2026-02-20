const Review = require('../models/Review');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

exports.submitReview = async (req, res) => {
    try {
        const { studentName, eventName, eventType, rating, description } = req.body;

        const result = sentiment.analyze(description);
        let sentimentLabel = 'Neutral';
        if (result.score > 0) sentimentLabel = 'Positive';
        else if (result.score < 0) sentimentLabel = 'Negative';

        const newReview = new Review({
            studentName,
            eventName,
            eventType,
            rating,
            description,
            sentiment: sentimentLabel,
            score: result.score
        });

        await newReview.save();
        res.status(201).json({ message: 'Review submitted successfully', review: newReview });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReviews = async (req, res) => {
    try {
        const { batchId } = req.query;
        let query = {};

        if (batchId === 'latest') {
            const latestReview = await Review.findOne().sort({ timestamp: -1 });
            if (latestReview) query.batchId = latestReview.batchId;
        } else if (batchId === 'legacy_data') {
            query.batchId = { $in: [null, 'legacy_data', 'manual'] };
        } else if (batchId && batchId !== 'all') {
            query.batchId = batchId;
        }

        const reviews = await Review.find(query).sort({ timestamp: -1 });
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const { batchId } = req.query;
        let query = {};

        if (batchId === 'latest') {
            const latestReview = await Review.findOne().sort({ timestamp: -1 });
            if (latestReview) query.batchId = latestReview.batchId;
        } else if (batchId === 'legacy_data') {
            query.batchId = { $in: [null, 'legacy_data', 'manual'] };
        } else if (batchId && batchId !== 'all') {
            query.batchId = batchId;
        }

        const reviews = await Review.find(query);
        const total = reviews.length;

        if (total === 0) {
            return res.status(200).json({
                total: 0,
                positive: 0,
                negative: 0,
                neutral: 0,
                sentimentDistribution: [],
                eventWiseSentiment: []
            });
        }

        const counts = reviews.reduce((acc, r) => {
            acc[r.sentiment]++;
            return acc;
        }, { Positive: 0, Negative: 0, Neutral: 0 });

        const sentimentDistribution = [
            { name: 'Positive', value: counts.Positive },
            { name: 'Negative', value: counts.Negative },
            { name: 'Neutral', value: counts.Neutral }
        ];

        // Event-wise sentiment
        const eventMap = reviews.reduce((acc, r) => {
            if (!acc[r.eventName]) {
                acc[r.eventName] = { name: r.eventName, Positive: 0, Negative: 0, Neutral: 0 };
            }
            acc[r.eventName][r.sentiment]++;
            return acc;
        }, {});

        const eventWiseSentiment = Object.values(eventMap);

        res.status(200).json({
            total,
            positive: ((counts.Positive / total) * 100).toFixed(1),
            negative: ((counts.Negative / total) * 100).toFixed(1),
            neutral: ((counts.Neutral / total) * 100).toFixed(1),
            sentimentDistribution,
            eventWiseSentiment
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.bulkSubmitReviews = async (req, res) => {
    try {
        const { reviews } = req.body;
        if (!Array.isArray(reviews)) {
            return res.status(400).json({ error: 'Payload must be an array of reviews' });
        }

        const batchId = `batch_${Date.now()}`;

        const processedReviews = reviews.map(r => {
            const result = sentiment.analyze(r.description || '');
            let sentimentLabel = 'Neutral';
            if (result.score > 0) sentimentLabel = 'Positive';
            else if (result.score < 0) sentimentLabel = 'Negative';

            return {
                studentName: r.studentName || 'Anonymous',
                eventName: r.eventName || 'External Feedback',
                eventType: r.eventType || 'Uncategorized',
                rating: r.rating || 3,
                description: r.description,
                sentiment: sentimentLabel,
                score: result.score,
                timestamp: new Date(),
                batchId: batchId
            };
        });

        const savedReviews = await Review.insertMany(processedReviews);
        res.status(201).json({ message: `${savedReviews.length} reviews processed and saved`, count: savedReviews.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBatches = async (req, res) => {
    try {
        const batches = await Review.aggregate([
            {
                $project: {
                    batchId: { $ifNull: ["$batchId", "legacy_data"] },
                    sentiment: 1,
                    timestamp: 1
                }
            },
            {
                $group: {
                    _id: "$batchId",
                    timestamp: { $min: "$timestamp" },
                    total: { $sum: 1 },
                    positive: { $sum: { $cond: [{ $eq: ["$sentiment", "Positive"] }, 1, 0] } },
                    negative: { $sum: { $cond: [{ $eq: ["$sentiment", "Negative"] }, 1, 0] } },
                    neutral: { $sum: { $cond: [{ $eq: ["$sentiment", "Neutral"] }, 1, 0] } }
                }
            },
            { $sort: { timestamp: -1 } }
        ]);
        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        let query = {};

        if (batchId === 'legacy_data') {
            query.batchId = { $in: [null, 'legacy_data', 'manual'] };
        } else {
            query.batchId = batchId;
        }

        const result = await Review.deleteMany(query);
        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} reviews from session ${batchId}`,
            count: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
