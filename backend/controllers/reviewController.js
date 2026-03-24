const supabase = require('../supabaseClient');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const axios = require('axios');

exports.submitReview = async (req, res) => {
    try {
        const { studentName, eventName, eventType, rating, description } = req.body;

        let sentimentLabel = 'Neutral';
        let sentimentScore = 0;

        if (process.env.GROK_API_KEY) {
            try {
                const response = await axios.post('https://api.x.ai/v1/chat/completions', {
                    model: 'grok-beta',
                    messages: [
                        {
                            role: 'system',
                            content: 'Analyze the sentiment of the following review. Return ONLY a valid JSON object with two keys: "sentiment" (strictly "Positive", "Negative", or "Neutral") and "score" (a number between -5 and 5). Do NOT wrap in markdown block quotes.'
                        },
                        {
                            role: 'user',
                            content: description || ''
                        }
                    ],
                    temperature: 0.1
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
                    }
                });

                let content = response.data.choices[0].message.content.trim();
                if (content.startsWith('```json')) content = content.substring(7);
                else if (content.startsWith('```')) content = content.substring(3);
                if (content.endsWith('```')) content = content.substring(0, content.length - 3);

                const parsed = JSON.parse(content.trim());
                sentimentLabel = parsed.sentiment;
                sentimentScore = parsed.score;
            } catch (err) {
                console.error('Grok Single API Error:', err?.response?.data || err.message);
                const result = sentiment.analyze(description || '');
                if (result.score > 0) sentimentLabel = 'Positive';
                else if (result.score < 0) sentimentLabel = 'Negative';
                sentimentScore = result.score;
            }
        } else {
            const result = sentiment.analyze(description || '');
            if (result.score > 0) sentimentLabel = 'Positive';
            else if (result.score < 0) sentimentLabel = 'Negative';
            sentimentScore = result.score;
        }

        const { data: newReview, error } = await supabase
            .from('reviews')
            .insert({
                student_name: studentName,
                event_name: eventName,
                event_type: eventType,
                rating,
                description,
                sentiment: sentimentLabel,
                score: sentimentScore,
                batch_id: 'manual'
            })
            .select()
            .single();

        if (error) throw error;

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
        console.error('Submit Error:', error);
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
        const reviewsTextArray = reviews.map(r => r.description || '');
        let grokResults = null;

        if (process.env.GROK_API_KEY) {
            grokResults = [];
            const chunkSize = 50;
            for (let i = 0; i < reviewsTextArray.length; i += chunkSize) {
                const chunk = reviewsTextArray.slice(i, i + chunkSize);
                try {
                    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
                        model: 'grok-beta',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an expert sentiment analyzer. I will give you a JSON array of review descriptions. Return ONLY a valid JSON array of the exact same length in the exact same order. Each element must be an object with two keys: "sentiment" (strictly "Positive", "Negative", or "Neutral") and "score" (a number between -5 and 5). Do NOT wrap in markdown block quotes.'
                            },
                            {
                                role: 'user',
                                content: JSON.stringify(chunk)
                            }
                        ],
                        temperature: 0.1
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.GROK_API_KEY}`
                        }
                    });

                    let content = response.data.choices[0].message.content.trim();
                    if (content.startsWith('```json')) content = content.substring(7);
                    else if (content.startsWith('```')) content = content.substring(3);
                    if (content.endsWith('```')) content = content.substring(0, content.length - 3);
                    
                    const parsed = JSON.parse(content.trim());
                    if (Array.isArray(parsed) && parsed.length === chunk.length) {
                        grokResults.push(...parsed);
                    } else {
                        console.warn('Grok API mismatch in response length');
                        grokResults = null;
                        break;
                    }
                } catch (err) {
                    console.error('Grok API Error:', err?.response?.data || err.message);
                    grokResults = null;
                    break;
                }
            }
        }

        const processedReviews = reviews.map((r, index) => {
            let sentimentLabel = 'Neutral';
            let score = 0;

            if (grokResults && grokResults[index]) {
                sentimentLabel = grokResults[index].sentiment;
                score = grokResults[index].score;
            } else {
                const result = sentiment.analyze(r.description || '');
                if (result.score > 0) sentimentLabel = 'Positive';
                else if (result.score < 0) sentimentLabel = 'Negative';
                score = result.score;
            }

            return {
                student_name: r.studentName || 'Anonymous',
                event_name: r.eventName || 'External Feedback',
                event_type: r.eventType || 'Other',
                rating: r.rating || 3,
                description: r.description,
                sentiment: sentimentLabel,
                score: score,
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
        console.error('Bulk Submit Error:', error);
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
