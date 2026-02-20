import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trash2, Filter, Search, TrendingUp, Users, Calendar, MessageSquare, Upload, FileText, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { useAuth } from '../context/AuthContext';

const CountUp = ({ to, duration = 1.5 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = parseInt(to);
        if (start === end) return;
        let totalMiliseconds = duration * 1000;
        let incrementTime = (totalMiliseconds / end);
        let timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start === end) clearInterval(timer);
        }, incrementTime);
        return () => clearInterval(timer);
    }, [to]);
    return <span>{count}{to.toString().includes('%') ? '%' : ''}</span>;
};

const Dashboard = () => {
    const location = useLocation();

    // Check for batchId in URL
    const queryParams = new URLSearchParams(location.search);
    const initialBatchId = queryParams.get('batchId') || 'latest';

    const [analytics, setAnalytics] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [viewMode, setViewMode] = useState(initialBatchId);
    const [batches, setBatches] = useState([]);

    const COLORS = ['#10b981', '#ef4444', '#f59e0b']; // Positive (Emerald-500), Negative (Red-500), Neutral (Amber-500)

    useEffect(() => {
        fetchData();
        if (viewMode === 'all' || viewMode === 'latest') {
            fetchBatches();
        }
    }, [viewMode]);

    const fetchBatches = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/reviews/batches`);
            setBatches(res.data);
        } catch (error) {
            console.error('Error fetching batches:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [analyticsRes, reviewsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/reviews/analytics?batchId=${viewMode}`),
                axios.get(`${import.meta.env.VITE_API_URL}/reviews?batchId=${viewMode}`)
            ]);
            setAnalytics(analyticsRes.data);
            setReviews(reviewsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCSVUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadError(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    // Map CSV fields to API expected fields (supporting specific headers from user image)
                    const reviewsToSubmit = results.data.map(row => {
                        const eventName = row['Event_Name'] || row['Event Name'] || row['Event'] || 'CSV Upload';
                        // Try to infer event type from name if not provided
                        let eventType = row['Category'] || row['Type'] || (eventName.toLowerCase().includes('fest') ? 'Fest' : 'Other');

                        return {
                            studentName: row['Student_Name'] || row['Student Name'] || row['Name'] || 'Anonymous',
                            eventName: eventName,
                            eventType: eventType,
                            rating: parseInt(row['Rating_Out_of_5'] || row['Rating'] || row['Score'] || 3),
                            description: row['Review_Description'] || row['Review'] || row['Feedback'] || row['Comment'] || ''
                        };
                    }).filter(r => r.description);

                    if (reviewsToSubmit.length === 0) {
                        throw new Error('No valid reviews found in CSV. Ensure you have a "Review" or "Feedback" column.');
                    }

                    await axios.post(`${import.meta.env.VITE_API_URL}/reviews/bulk-submit`, { reviews: reviewsToSubmit });
                    alert(`Successfully imported ${reviewsToSubmit.length} reviews!`);
                    fetchData();
                } catch (error) {
                    console.error('CSV Upload Error:', error);
                    setUploadError(error.response?.data?.error || error.message);
                } finally {
                    setUploading(false);
                }
            },
            error: (error) => {
                setUploadError('Failed to parse CSV file.');
                setUploading(false);
            }
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/reviews/${id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting review:', error);
            }
        }
    };

    const filteredReviews = reviews.filter(r =>
        r.eventName.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return (
        <div className="container" style={{ padding: '10rem 0', textAlign: 'center', position: 'relative' }}>
            <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                style={{ marginBottom: '2rem' }}
            >
                <TrendingUp size={64} color="var(--primary)" style={{ opacity: 0.8 }} />
            </motion.div>
            <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '800' }}>Calibrating Intelligence Engine...</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Synchronizing college sentiment data</p>
        </div>
    );

    if (!analytics) return (
        <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
            <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', borderTop: '4px solid #ef4444' }}>
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
                <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Restricted Access</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    Your current credentials do not permit viewing the analytics engine.
                    Please sign in as an administrator to access these insights.
                </p>
                <button className="btn btn-primary" style={{ marginTop: '2.5rem' }} onClick={() => window.location.reload()}>
                    Verify Identity
                </button>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container"
            style={{ padding: '4rem 0 8rem' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '3.5rem', lineHeight: '1', marginBottom: '0.8rem' }}>Intelligence Hub</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '500' }}>Deep-dive analysis of student sentiment and campus feedback.</p>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', background: 'var(--glass-bg)', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--glass-border)' }}>
                        <button
                            onClick={() => setViewMode('latest')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                background: viewMode === 'latest' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'latest' ? 'white' : 'var(--text-muted)',
                                transition: 'all 0.3s'
                            }}
                        >
                            Latest Response
                        </button>
                        <button
                            onClick={() => setViewMode('all')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                background: viewMode === 'all' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'all' ? 'white' : 'var(--text-muted)',
                                transition: 'all 0.3s'
                            }}
                        >
                            All Time Stats
                        </button>
                    </div>

                    {(batches.length > 0 && viewMode !== 'all') && (
                        <div style={{ marginTop: '1rem' }}>
                            <select
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--glass-bg)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.85rem',
                                    fontWeight: '600'
                                }}
                            >
                                <option value="latest">Latest Upload</option>
                                {batches.map(batch => (
                                    <option key={batch._id} value={batch._id}>
                                        Upload: {new Date(batch.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({batch.count} reviews)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleCSVUpload}
                            style={{ display: 'none' }}
                            id="csv-upload"
                            disabled={uploading}
                        />
                        <label
                            htmlFor="csv-upload"
                            className="btn btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                opacity: uploading ? 0.7 : 1,
                                background: 'var(--secondary)',
                                padding: '10px 20px'
                            }}
                        >
                            {uploading ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                    <Upload size={18} />
                                </motion.div>
                            ) : <Upload size={18} />}
                            {uploading ? 'Processing...' : 'Bulk Import CSV'}
                        </label>
                    </div>
                    <div style={{ background: 'var(--glass-bg)', padding: '10px 20px', borderRadius: '100px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={18} color="var(--primary)" />
                        <span style={{ fontWeight: '600' }}>Academic Session 2026</span>
                    </div>
                </div>
            </div>

            {uploadError && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#ef4444'
                    }}
                >
                    <AlertCircle size={20} />
                    <span style={{ fontWeight: '600' }}>{uploadError}</span>
                </motion.div>
            )}

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {[
                    { label: 'Total Feedback', val: analytics.total, icon: Users, color: 'var(--primary)' },
                    { label: 'Positive Score', val: `${analytics.positive}%`, icon: TrendingUp, color: '#10b981' },
                    { label: 'Negative Rate', val: `${analytics.negative}%`, icon: Filter, color: '#ef4444' },
                    { label: 'Neutral Volume', val: `${analytics.neutral}%`, icon: MessageSquare, color: '#f59e0b' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -5, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                        className="glass-card"
                        style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{stat.label}</span>
                            <stat.icon size={20} color={stat.color} />
                        </div>
                        <p style={{ fontSize: '2.2rem', fontWeight: '800', color: stat.color }}>
                            <CountUp to={stat.val} />
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem', marginBottom: '3rem' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Sentiment Split
                    </h3>
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics.sentimentDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {analytics.sentimentDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--glass-shadow)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Sentiment Trends by Event Type</h3>
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.eventWiseSentiment}>
                                <defs>
                                    <linearGradient id="pos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.2} /></linearGradient>
                                    <linearGradient id="neg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} /></linearGradient>
                                    <linearGradient id="neu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2} /></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Legend />
                                <Bar dataKey="Positive" fill="url(#pos)" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="Negative" fill="url(#neg)" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="Neutral" fill="url(#neu)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Table Overhaul */}
            <div className="glass-card" style={{ padding: '0' }}>
                <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: 0 }}>Recent Activity Feed</h3>
                    <div style={{ position: 'relative', width: '320px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '22px', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Find specific event feedback..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{ paddingLeft: '40px', marginTop: 0 }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700' }}>Reviewer</th>
                                <th style={{ padding: '1.2rem', textAlign: 'left', fontWeight: '700' }}>Event & Category</th>
                                <th style={{ padding: '1.2rem', textAlign: 'center', fontWeight: '700' }}>Rating</th>
                                <th style={{ padding: '1.2rem', textAlign: 'center', fontWeight: '700' }}>AI Sentiment</th>
                                <th style={{ padding: '1.2rem', textAlign: 'center', fontWeight: '700' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filteredReviews.map((r, idx) => (
                                    <motion.tr
                                        key={r._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{ borderBottom: '1px solid var(--glass-border)' }}
                                    >
                                        <td style={{ padding: '1.2rem' }}>
                                            <div style={{ fontWeight: '700' }}>{r.studentName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified Student</div>
                                        </td>
                                        <td style={{ padding: '1.2rem' }}>
                                            <div style={{ fontWeight: '600' }}>{r.eventName}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{r.eventType}</div>
                                        </td>
                                        <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                                            <span style={{ background: 'var(--secondary)', color: 'white', padding: '4px 10px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '800' }}>
                                                ★ {r.rating}.0
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '6px 16px',
                                                borderRadius: '30px',
                                                fontSize: '0.8rem',
                                                fontWeight: '800',
                                                background: r.sentiment === 'Positive' ? 'rgba(16, 185, 129, 0.1)' : r.sentiment === 'Negative' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: r.sentiment === 'Positive' ? '#10b981' : r.sentiment === 'Negative' ? '#ef4444' : '#f59e0b',
                                                border: `1px solid ${r.sentiment === 'Positive' ? 'rgba(16, 185, 129, 0.2)' : r.sentiment === 'Negative' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                            }}>
                                                {r.sentiment.toUpperCase()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDelete(r._id)}
                                                className="btn"
                                                style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
