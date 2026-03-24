const axios = require('axios');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

/**
 * Standalone CSV Analyzer — works with ANY CSV containing feedback/review text.
 * Auto-detects the text column, uses Grok API for deep sentiment analysis,
 * and falls back to local `sentiment` library when the key is absent.
 *
 * Expects: { rows: [{ col1: "...", col2: "...", ... }], textColumn: "optional" }
 * Returns: { results: [...], summary: {...} }
 */
exports.analyzeCSV = async (req, res) => {
    try {
        const { rows, textColumn } = req.body;

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: 'No data rows provided. Upload a CSV with at least one row.' });
        }

        // ---- Auto-detect the text column if not provided ----
        const columns = Object.keys(rows[0]);
        let feedbackCol = textColumn;

        if (!feedbackCol) {
            const textHints = [
                'review', 'feedback', 'comment', 'description', 'text', 'message',
                'opinion', 'response', 'remarks', 'note', 'notes', 'content',
                'review_description', 'review_text', 'feedback_text', 'user_review',
                'customer_feedback', 'tweet', 'post', 'body', 'summary'
            ];

            feedbackCol = columns.find(c =>
                textHints.includes(c.toLowerCase().replace(/[^a-z]/g, ''))
            );

            if (!feedbackCol) {
                feedbackCol = columns.find(c =>
                    textHints.some(h => c.toLowerCase().replace(/[^a-z]/g, '').includes(h))
                );
            }

            // Fallback to the longest-average-value string column
            if (!feedbackCol) {
                let bestCol = null;
                let bestAvg = 0;
                for (const col of columns) {
                    const avg = rows.reduce((sum, r) => sum + (String(r[col] || '')).length, 0) / rows.length;
                    if (avg > bestAvg) {
                        bestAvg = avg;
                        bestCol = col;
                    }
                }
                feedbackCol = bestCol;
            }
        }

        if (!feedbackCol) {
            return res.status(400).json({ error: 'Could not detect a text/feedback column. Please specify the column name.' });
        }

        const texts = rows.map(r => String(r[feedbackCol] || '').trim()).filter(t => t.length > 0);

        if (texts.length === 0) {
            return res.status(400).json({ error: `The column "${feedbackCol}" has no text data.` });
        }

        // ---- Sentiment Analysis ----
        let analysisResults = null;

        if (process.env.GROK_API_KEY && process.env.GROK_API_KEY !== 'your_grok_api_key_here') {
            analysisResults = [];
            const chunkSize = 30;

            for (let i = 0; i < texts.length; i += chunkSize) {
                const chunk = texts.slice(i, i + chunkSize);
                try {
                    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
                        model: 'grok-3-mini-beta',
                        messages: [
                            {
                                role: 'system',
                                content: `You are an expert sentiment analyzer. I will give you a JSON array of text strings (feedback/reviews). 
Return ONLY a valid JSON array of the exact same length in the exact same order. 
Each element must be an object with these keys:
- "sentiment": strictly "Positive", "Negative", or "Neutral"
- "score": a number between -5 and 5
- "confidence": a number between 0 and 1
- "keywords": an array of up to 3 key emotion/topic words found in the text
Do NOT wrap in markdown code blocks.`
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
                        },
                        timeout: 60000
                    });

                    let content = response.data.choices[0].message.content.trim();
                    // Strip potential markdown wrappers
                    if (content.startsWith('```json')) content = content.substring(7);
                    else if (content.startsWith('```')) content = content.substring(3);
                    if (content.endsWith('```')) content = content.substring(0, content.length - 3);

                    const parsed = JSON.parse(content.trim());
                    if (Array.isArray(parsed) && parsed.length === chunk.length) {
                        analysisResults.push(...parsed);
                    } else {
                        console.warn('Grok response length mismatch, falling back to local');
                        analysisResults = null;
                        break;
                    }
                } catch (err) {
                    console.error('Grok Analyze Error:', err?.response?.data || err.message);
                    analysisResults = null;
                    break;
                }
            }
        }

        // Build final results
        const results = texts.map((text, idx) => {
            const originalRow = rows.find(r => String(r[feedbackCol] || '').trim() === text) || {};

            if (analysisResults && analysisResults[idx]) {
                return {
                    text,
                    sentiment: analysisResults[idx].sentiment,
                    score: analysisResults[idx].score,
                    confidence: analysisResults[idx].confidence || null,
                    keywords: analysisResults[idx].keywords || [],
                    source: 'grok-ai',
                    metadata: Object.fromEntries(
                        Object.entries(originalRow).filter(([k]) => k !== feedbackCol)
                    )
                };
            } else {
                // Local fallback
                const result = sentiment.analyze(text);
                let label = 'Neutral';
                if (result.score > 0) label = 'Positive';
                else if (result.score < 0) label = 'Negative';

                return {
                    text,
                    sentiment: label,
                    score: result.score,
                    confidence: null,
                    keywords: result.words.slice(0, 3),
                    source: 'local',
                    metadata: Object.fromEntries(
                        Object.entries(originalRow).filter(([k]) => k !== feedbackCol)
                    )
                };
            }
        });

        // Summary
        const total = results.length;
        const positive = results.filter(r => r.sentiment === 'Positive').length;
        const negative = results.filter(r => r.sentiment === 'Negative').length;
        const neutral = results.filter(r => r.sentiment === 'Neutral').length;
        const avgScore = (results.reduce((s, r) => s + r.score, 0) / total).toFixed(2);

        // Keyword frequency
        const keywordMap = {};
        results.forEach(r => {
            (r.keywords || []).forEach(kw => {
                const k = kw.toLowerCase();
                keywordMap[k] = (keywordMap[k] || 0) + 1;
            });
        });
        const topKeywords = Object.entries(keywordMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));

        res.status(200).json({
            detectedColumn: feedbackCol,
            allColumns: columns,
            source: analysisResults ? 'grok-ai' : 'local-sentiment',
            results,
            summary: {
                total,
                positive,
                negative,
                neutral,
                positivePercent: ((positive / total) * 100).toFixed(1),
                negativePercent: ((negative / total) * 100).toFixed(1),
                neutralPercent: ((neutral / total) * 100).toFixed(1),
                averageScore: parseFloat(avgScore),
                topKeywords
            }
        });
    } catch (error) {
        console.error('CSV Analysis Error:', error);
        res.status(500).json({ error: error.message });
    }
};
