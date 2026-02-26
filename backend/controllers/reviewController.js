const supabase = require('../supabaseClient');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

exports.submitReview = async (req, res) => {
    try {
        const { studentName, eventName, eventType, rating, description } = req.body;

        const result = sentiment.analyze(description);
        let sentimentLabel = 'Neutral';
        if (result.score > 0) sentimentLabel = 'Positive';
        else if (result.score < 0) sentimentLabel = 'Negative';

        const { data: newReview, error } = await supabase
            .from('reviews')
            .insert({
                student_name: studentName,
                event_name: eventName,
                event_type: eventType,
                rating,
                description,
                sentiment: sentimentLabel,
                score: result.score,
                batch_id: 'manual'
            })
            .select()
            .single();

        if (error) throw error;

        // Map back to camelCase for frontend compatibility
        const review = {
            _id: newReview.id,
            studentName: newReview.student_name,
            eventName: newReview.event_name,
            eventType: newReview.event_type,
            rating: newReview.rating,
            description: newReview.description,
            sentiment: newReview.sentiment,
            score: newReview.score,
            timestamp: newReview.timestamp,
            batchId: newReview.batch_id
        };

        res.status(201).json({ message: 'Review submitted successfully', review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReviews = async (req, res) => {
    try {
        const { batchId } = req.query;
        let query = supabase.from('reviews').select('*').order('timestamp', { ascending: false });

        if (batchId === 'latest') {
            const { data: latest } = await supabase
                .from('reviews')
                .select('batch_id')
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();
            if (latest) query = query.eq('batch_id', latest.batch_id);
        } else if (batchId === 'legacy_data') {
            query = query.in('batch_id', ['legacy_data', 'manual']);
        } else if (batchId && batchId !== 'all') {
            query = query.eq('batch_id', batchId);
        }

        const { data: reviews, error } = await query;
        if (error) throw error;

        // Map to camelCase for frontend
        const mapped = reviews.map(r => ({
            _id: r.id,
            studentName: r.student_name,
            eventName: r.event_name,
            eventType: r.event_type,
            rating: r.rating,
            description: r.description,
            sentiment: r.sentiment,
            score: r.score,
            timestamp: r.timestamp,
            batchId: r.batch_id
        }));

        res.status(200).json(mapped);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const { batchId } = req.query;
        let query = supabase.from('reviews').select('*');

        if (batchId === 'latest') {
            const { data: latest } = await supabase
                .from('reviews')
                .select('batch_id')
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();
            if (latest) query = query.eq('batch_id', latest.batch_id);
        } else if (batchId === 'legacy_data') {
            query = query.in('batch_id', ['legacy_data', 'manual']);
        } else if (batchId && batchId !== 'all') {
            query = query.eq('batch_id', batchId);
        }

        const { data: reviews, error } = await query;
        if (error) throw error;

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
            if (!acc[r.event_name]) {
                acc[r.event_name] = { name: r.event_name, Positive: 0, Negative: 0, Neutral: 0 };
            }
            acc[r.event_name][r.sentiment]++;
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
                student_name: r.studentName || 'Anonymous',
                event_name: r.eventName || 'External Feedback',
                event_type: r.eventType || 'Other',
                rating: r.rating || 3,
                description: r.description,
                sentiment: sentimentLabel,
                score: result.score,
                batch_id: batchId
            };
        });

        const { data: savedReviews, error } = await supabase
            .from('reviews')
            .insert(processedReviews)
            .select();

        if (error) throw error;
        res.status(201).json({ message: `${savedReviews.length} reviews processed and saved`, count: savedReviews.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBatches = async (req, res) => {
    try {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('batch_id, sentiment, timestamp');

        if (error) throw error;

        // Group by batch_id (replaces MongoDB aggregate)
        const batchMap = {};
        for (const r of reviews) {
            const bid = r.batch_id || 'legacy_data';
            if (!batchMap[bid]) {
                batchMap[bid] = {
                    _id: bid,
                    timestamp: r.timestamp,
                    total: 0,
                    positive: 0,
                    negative: 0,
                    neutral: 0
                };
            }
            batchMap[bid].total++;
            if (r.sentiment === 'Positive') batchMap[bid].positive++;
            else if (r.sentiment === 'Negative') batchMap[bid].negative++;
            else batchMap[bid].neutral++;
            // Track earliest timestamp
            if (new Date(r.timestamp) < new Date(batchMap[bid].timestamp)) {
                batchMap[bid].timestamp = r.timestamp;
            }
        }

        const batches = Object.values(batchMap).sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        let query = supabase.from('reviews').delete();

        if (batchId === 'legacy_data') {
            query = query.in('batch_id', ['legacy_data', 'manual']);
        } else {
            query = query.eq('batch_id', batchId);
        }

        const { data, error } = await query.select();
        if (error) throw error;

        const deletedCount = data ? data.length : 0;
        res.status(200).json({
            message: `Successfully deleted ${deletedCount} reviews from session ${batchId}`,
            count: deletedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
