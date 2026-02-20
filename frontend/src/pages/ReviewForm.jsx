import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Star, Info, Heart, Meh, Frown } from 'lucide-react';
import Sentiment from 'sentiment';
const sentimentAnalyzer = new Sentiment();

const ReviewForm = () => {
    // ... (rest of the component logic already in previous step)
    const [formData, setFormData] = useState({
        studentName: '',
        eventName: '',
        eventType: 'Workshop',
        rating: 5,
        description: ''
    });
    const [realtimeSentiment, setRealtimeSentiment] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleDescriptionChange = (e) => {
        const text = e.target.value;
        setFormData({ ...formData, description: text });

        if (text.trim().length > 5) {
            const result = sentimentAnalyzer.analyze(text);
            let label = 'Neutral';
            if (result.score > 0) label = 'Positive';
            else if (result.score < 0) label = 'Negative';
            setRealtimeSentiment(label);
        } else {
            setRealtimeSentiment(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/reviews/submit`, formData);
            setSuccess(true);
            setFormData({
                studentName: '',
                eventName: '',
                eventType: 'Workshop',
                rating: 5,
                description: ''
            });
            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div className="bg-blob blob-1"></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '4rem', alignItems: 'start' }}>
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                        Share Your <span style={{ color: 'var(--secondary)' }}>Experience</span>
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Your feedback helps the college administration organize better events for the student community.
                        Every review is analyzed using AI to understand the sentiment and improve future initiatives.
                    </p>

                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px', color: 'white' }}>
                            <Info size={24} />
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Registering as a student allows you to provide honest feedback across all campus events.
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card"
                >
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label>Student Name</label>
                                <input
                                    type="text"
                                    placeholder="Your full name"
                                    value={formData.studentName}
                                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label>Event Name</label>
                                <input
                                    type="text"
                                    placeholder="Event title"
                                    value={formData.eventName}
                                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label>Event Type</label>
                                <select
                                    value={formData.eventType}
                                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                                >
                                    <option>Workshop</option>
                                    <option>Fest</option>
                                    <option>Seminar</option>
                                    <option>Cultural</option>
                                    <option>Technical</option>
                                </select>
                            </div>
                            <div>
                                <label>Rating (1-5)</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '12px' }}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={24}
                                            fill={s <= formData.rating ? 'var(--secondary)' : 'none'}
                                            stroke={s <= formData.rating ? 'var(--secondary)' : '#cbd5e0'}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setFormData({ ...formData, rating: s })}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>Review Description</label>
                                <AnimatePresence>
                                    {realtimeSentiment && (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '0.85rem',
                                                fontWeight: '700',
                                                color: realtimeSentiment === 'Positive' ? '#10b981' : realtimeSentiment === 'Negative' ? '#ef4444' : '#f59e0b'
                                            }}
                                        >
                                            {realtimeSentiment === 'Positive' ? <Heart size={14} fill="#10b981" /> : realtimeSentiment === 'Negative' ? <Frown size={14} fill="#ef4444" /> : <Meh size={14} fill="#f59e0b" />}
                                            AI Preview: {realtimeSentiment}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <textarea
                                rows="5"
                                placeholder="What was your favorite part? What could be improved?"
                                value={formData.description}
                                onChange={handleDescriptionChange}
                                required
                                style={{ transition: 'var(--transition-fast)' }}
                            ></textarea>
                        </div>

                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{ color: '#27ae60', marginBottom: '1rem', fontWeight: '600', textAlign: 'center' }}
                                >
                                    Review submitted successfully! Thank you for the feedback.
                                </motion.div>
                            )}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ color: '#e74c3c', marginBottom: '1rem', fontWeight: '600', textAlign: 'center' }}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            <Send size={18} /> {submitting ? 'Submitting...' : 'Submit Final Review'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ReviewForm;
