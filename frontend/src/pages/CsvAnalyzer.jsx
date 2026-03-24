import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Upload, FileText, Zap, Brain, AlertCircle, CheckCircle2,
    TrendingUp, TrendingDown, Minus, Download, RotateCcw, Sparkles,
    ChevronDown, Tag
} from 'lucide-react';

const COLORS = {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#f59e0b',
    pie: ['#10b981', '#ef4444', '#f59e0b']
};

const SentimentBadge = ({ label }) => {
    const colors = {
        Positive: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.25)' },
        Negative: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)' },
        Neutral: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' }
    };
    const c = colors[label] || colors.Neutral;
    return (
        <span style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: '100px',
            fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em',
            background: c.bg, color: c.color, border: `1px solid ${c.border}`
        }}>
            {label?.toUpperCase()}
        </span>
    );
};

const CsvAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [parsedRows, setParsedRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [selectedColumn, setSelectedColumn] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = useCallback((f) => {
        if (!f || !f.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
            return;
        }
        setError(null);
        setResults(null);
        setFile(f);

        Papa.parse(f, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                if (result.data.length === 0) {
                    setError('CSV file is empty.');
                    return;
                }
                setParsedRows(result.data);
                setColumns(Object.keys(result.data[0]));
                setSelectedColumn('');
            },
            error: () => setError('Failed to parse CSV file.')
        });
    }, []);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        handleFile(f);
    };

    const handleAnalyze = async () => {
        if (parsedRows.length === 0) return;
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/analyze/csv`,
                { rows: parsedRows, textColumn: selectedColumn || undefined }
            );
            setResults(response.data);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setParsedRows([]);
        setColumns([]);
        setSelectedColumn('');
        setResults(null);
        setError(null);
    };

    const handleDownload = () => {
        if (!results) return;
        const csvData = results.results.map(r => ({
            Text: r.text,
            Sentiment: r.sentiment,
            Score: r.score,
            Confidence: r.confidence ?? 'N/A',
            Keywords: (r.keywords || []).join(', '),
            Engine: r.source,
            ...r.metadata
        }));
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sentiment_analysis_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container"
            style={{ padding: '4rem 0 8rem' }}
        >
            {/* Hero Header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    style={{
                        width: '80px', height: '80px', borderRadius: '24px',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem', boxShadow: '0 12px 40px rgba(139, 92, 246, 0.3)'
                    }}
                >
                    <Brain size={40} color="white" />
                </motion.div>
                <h1 className="gradient-text" style={{ fontSize: '3rem', lineHeight: 1.1, marginBottom: '0.8rem' }}>
                    AI CSV Analyzer
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Upload any CSV file with feedback, reviews, or comments — our AI engine will
                    automatically detect the text column and deliver deep sentiment analysis.
                </p>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '1rem',
                    background: 'rgba(139, 92, 246, 0.1)', padding: '8px 16px', borderRadius: '100px',
                    border: '1px solid rgba(139, 92, 246, 0.2)', fontSize: '0.85rem', fontWeight: '700',
                    color: 'var(--primary)'
                }}>
                    <Sparkles size={16} />
                    Powered by Grok AI with Local Fallback
                </div>
            </div>

            {/* Upload Zone */}
            {!results && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => !file && document.getElementById('csv-analyzer-upload').click()}
                        className="glass-card"
                        style={{
                            padding: '4rem 2rem',
                            textAlign: 'center',
                            cursor: file ? 'default' : 'pointer',
                            border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--glass-border)'}`,
                            background: dragOver ? 'rgba(139, 92, 246, 0.05)' : 'var(--glass-bg)',
                            transition: 'all 0.3s ease',
                            marginBottom: '2rem'
                        }}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => handleFile(e.target.files[0])}
                            style={{ display: 'none' }}
                            id="csv-analyzer-upload"
                        />

                        {!file ? (
                            <>
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                >
                                    <Upload size={48} color="var(--primary)" style={{ opacity: 0.7 }} />
                                </motion.div>
                                <h3 style={{ marginTop: '1.5rem', fontSize: '1.3rem' }}>
                                    Drop your CSV here or click to browse
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    Supports any CSV with text data — reviews, feedback, comments, tweets, etc.
                                </p>
                            </>
                        ) : (
                            <div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '12px', marginBottom: '1.5rem'
                                }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: 'rgba(16, 185, 129, 0.1)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <FileText size={24} color="#10b981" />
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: '700', fontSize: '1rem' }}>{file.name}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {parsedRows.length} rows · {columns.length} columns detected
                                        </div>
                                    </div>
                                    <CheckCircle2 size={24} color="#10b981" />
                                </div>

                                {/* Column Selector */}
                                {columns.length > 0 && (
                                    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                                        <label style={{
                                            fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)',
                                            display: 'block', marginBottom: '0.5rem', textAlign: 'left'
                                        }}>
                                            <Tag size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                                            Text column (auto-detected if left empty)
                                        </label>
                                        <select
                                            value={selectedColumn}
                                            onChange={(e) => setSelectedColumn(e.target.value)}
                                            style={{
                                                width: '100%', padding: '12px 16px', borderRadius: '12px',
                                                border: '1px solid var(--glass-border)', background: 'var(--glass-bg)',
                                                color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '600',
                                                marginBottom: '1.5rem'
                                            }}
                                        >
                                            <option value="">Auto-detect (recommended)</option>
                                            {columns.map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>

                                        {/* Preview */}
                                        <div style={{
                                            background: 'rgba(0,0,0,0.03)', borderRadius: '12px',
                                            padding: '1rem', marginBottom: '1.5rem', textAlign: 'left',
                                            maxHeight: '200px', overflow: 'auto', border: '1px solid var(--glass-border)'
                                        }}>
                                            <div style={{
                                                fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)',
                                                marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em'
                                            }}>
                                                Data Preview (first 5 rows)
                                            </div>
                                            {parsedRows.slice(0, 5).map((row, i) => (
                                                <div key={i} style={{
                                                    padding: '6px 0', borderBottom: i < 4 ? '1px solid var(--glass-border)' : 'none',
                                                    fontSize: '0.82rem', color: 'var(--text-main)',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                }}>
                                                    <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>#{i + 1}</span>
                                                    {columns.slice(0, 3).map(c => (
                                                        <span key={c} style={{ marginRight: '16px' }}>
                                                            <strong>{c}:</strong> {String(row[c] || '').substring(0, 40)}
                                                        </span>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                            <button
                                                onClick={handleAnalyze}
                                                disabled={loading}
                                                className="btn btn-primary"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    padding: '14px 32px', fontSize: '1rem', fontWeight: '800',
                                                    opacity: loading ? 0.7 : 1
                                                }}
                                            >
                                                {loading ? (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                                        <Zap size={20} />
                                                    </motion.div>
                                                ) : <Zap size={20} />}
                                                {loading ? 'Analyzing with AI...' : 'Analyze Sentiment'}
                                            </button>
                                            <button
                                                onClick={handleReset}
                                                className="btn"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    padding: '14px 24px', background: 'var(--glass-bg)',
                                                    border: '1px solid var(--glass-border)'
                                                }}
                                            >
                                                <RotateCcw size={18} />
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px', padding: '1rem', marginBottom: '2rem',
                            display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444'
                        }}
                    >
                        <AlertCircle size={20} />
                        <span style={{ fontWeight: '600' }}>{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Animation */}
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card"
                    style={{ textAlign: 'center', padding: '4rem 2rem', marginBottom: '2rem' }}
                >
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        style={{ marginBottom: '1.5rem' }}
                    >
                        <Brain size={56} color="var(--primary)" />
                    </motion.div>
                    <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                        AI is Analyzing Your Data...
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Processing {parsedRows.length} entries through Grok AI sentiment engine
                    </p>
                    <div style={{
                        width: '200px', height: '4px', background: 'var(--glass-border)',
                        borderRadius: '100px', margin: '1.5rem auto 0', overflow: 'hidden'
                    }}>
                        <motion.div
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                            style={{
                                width: '50%', height: '100%', borderRadius: '100px',
                                background: 'linear-gradient(90deg, var(--primary), var(--secondary))'
                            }}
                        />
                    </div>
                </motion.div>
            )}

            {/* Results Section */}
            {results && (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Results Header */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: '2rem'
                    }}>
                        <div>
                            <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                                Analysis Results
                            </h2>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <span style={{
                                    background: results.source === 'grok-ai' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: results.source === 'grok-ai' ? 'var(--primary)' : '#f59e0b',
                                    padding: '4px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '700',
                                    border: `1px solid ${results.source === 'grok-ai' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                }}>
                                    {results.source === 'grok-ai' ? '🧠 Grok AI' : '⚡ Local Engine'}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Column: <strong>{results.detectedColumn}</strong>
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleDownload}
                                className="btn btn-primary"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 20px', background: 'var(--secondary)'
                                }}
                            >
                                <Download size={18} /> Export CSV
                            </button>
                            <button
                                onClick={handleReset}
                                className="btn"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 20px', background: 'var(--glass-bg)',
                                    border: '1px solid var(--glass-border)'
                                }}
                            >
                                <RotateCcw size={18} /> New Analysis
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        {[
                            { label: 'Total Analyzed', val: results.summary.total, icon: FileText, color: 'var(--primary)' },
                            { label: 'Positive', val: `${results.summary.positivePercent}%`, icon: TrendingUp, color: COLORS.positive },
                            { label: 'Negative', val: `${results.summary.negativePercent}%`, icon: TrendingDown, color: COLORS.negative },
                            { label: 'Neutral', val: `${results.summary.neutralPercent}%`, icon: Minus, color: COLORS.neutral }
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
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                                        {stat.label}
                                    </span>
                                    <stat.icon size={20} color={stat.color} />
                                </div>
                                <p style={{ fontSize: '2.2rem', fontWeight: '800', color: stat.color, margin: 0 }}>
                                    {stat.val}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                        {/* Pie Chart */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card">
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Sparkles size={20} color="var(--primary)" /> Sentiment Distribution
                            </h3>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Positive', value: results.summary.positive },
                                                { name: 'Negative', value: results.summary.negative },
                                                { name: 'Neutral', value: results.summary.neutral }
                                            ]}
                                            cx="50%" cy="50%" innerRadius={65} outerRadius={95}
                                            paddingAngle={6} dataKey="value" stroke="none"
                                        >
                                            {COLORS.pie.map((c, i) => <Cell key={i} fill={c} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Top Keywords */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card">
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Tag size={20} color="var(--secondary)" /> Top Keywords
                            </h3>
                            {results.summary.topKeywords.length > 0 ? (
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={results.summary.topKeywords} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="rgba(255,255,255,0.1)" />
                                            <XAxis type="number" axisLine={false} tickLine={false} />
                                            <YAxis dataKey="word" type="category" axisLine={false} tickLine={false} width={100}
                                                tick={{ fontSize: '0.82rem', fontWeight: 600 }} />
                                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                                {results.summary.topKeywords.map((_, i) => (
                                                    <Cell key={i} fill={`hsl(${260 + i * 12}, 70%, ${55 + i * 3}%)`} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 0' }}>
                                    No keywords extracted
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Average Score */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card"
                        style={{
                            marginBottom: '2.5rem', padding: '2rem', textAlign: 'center',
                            background: `linear-gradient(135deg, ${results.summary.averageScore >= 0 ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)'}, var(--glass-bg))`
                        }}
                    >
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                            Overall Sentiment Score
                        </div>
                        <div style={{
                            fontSize: '3.5rem', fontWeight: '900',
                            color: results.summary.averageScore > 0 ? COLORS.positive : results.summary.averageScore < 0 ? COLORS.negative : COLORS.neutral
                        }}>
                            {results.summary.averageScore > 0 ? '+' : ''}{results.summary.averageScore}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Scale: -5 (Very Negative) to +5 (Very Positive)
                        </div>
                    </motion.div>

                    {/* Results Table */}
                    <div className="glass-card" style={{ padding: 0 }}>
                        <div style={{
                            padding: '2rem', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', borderBottom: '1px solid var(--glass-border)'
                        }}>
                            <h3 style={{ margin: 0 }}>Detailed Results</h3>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Showing {results.results.length} entries
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '1rem 1.2rem', textAlign: 'left', fontWeight: '700', width: '40px' }}>#</th>
                                        <th style={{ padding: '1rem 1.2rem', textAlign: 'left', fontWeight: '700' }}>Text</th>
                                        <th style={{ padding: '1rem 1.2rem', textAlign: 'center', fontWeight: '700' }}>Sentiment</th>
                                        <th style={{ padding: '1rem 1.2rem', textAlign: 'center', fontWeight: '700' }}>Score</th>
                                        {results.results[0]?.confidence !== null && (
                                            <th style={{ padding: '1rem 1.2rem', textAlign: 'center', fontWeight: '700' }}>Confidence</th>
                                        )}
                                        <th style={{ padding: '1rem 1.2rem', textAlign: 'center', fontWeight: '700' }}>Keywords</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.results.map((r, idx) => (
                                        <motion.tr
                                            key={idx}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: Math.min(idx * 0.02, 1) }}
                                            style={{ borderBottom: '1px solid var(--glass-border)' }}
                                        >
                                            <td style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{idx + 1}</td>
                                            <td style={{ padding: '1rem 1.2rem', maxWidth: '400px' }}>
                                                <div style={{
                                                    fontSize: '0.88rem', lineHeight: '1.5',
                                                    display: '-webkit-box', WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                                }}>
                                                    {r.text}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.2rem', textAlign: 'center' }}>
                                                <SentimentBadge label={r.sentiment} />
                                            </td>
                                            <td style={{
                                                padding: '1rem 1.2rem', textAlign: 'center',
                                                fontWeight: '800', fontSize: '0.95rem',
                                                color: r.score > 0 ? COLORS.positive : r.score < 0 ? COLORS.negative : COLORS.neutral
                                            }}>
                                                {r.score > 0 ? '+' : ''}{r.score}
                                            </td>
                                            {r.confidence !== null && (
                                                <td style={{ padding: '1rem 1.2rem', textAlign: 'center' }}>
                                                    <div style={{
                                                        width: '50px', height: '4px', background: 'var(--glass-border)',
                                                        borderRadius: '100px', margin: '0 auto', overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${(r.confidence * 100)}%`, height: '100%',
                                                            background: 'var(--primary)', borderRadius: '100px'
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {(r.confidence * 100).toFixed(0)}%
                                                    </span>
                                                </td>
                                            )}
                                            <td style={{ padding: '1rem 1.2rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    {(r.keywords || []).map((kw, ki) => (
                                                        <span key={ki} style={{
                                                            background: 'rgba(139, 92, 246, 0.08)',
                                                            color: 'var(--primary)',
                                                            padding: '2px 8px', borderRadius: '6px',
                                                            fontSize: '0.72rem', fontWeight: '600'
                                                        }}>
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default CsvAnalyzer;
