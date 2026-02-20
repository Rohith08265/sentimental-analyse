import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { MessageSquare, BarChart3, ShieldCheck, Sparkles } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay }}
        className="glass-card"
        style={{ flex: 1, textAlign: 'center' }}
    >
        <div style={{
            width: '60px',
            height: '60px',
            background: 'rgba(26, 54, 93, 0.1)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--primary)'
        }}>
            <Icon size={32} />
        </div>
        <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{description}</p>
    </motion.div>
);

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="home-page">
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>

            <section className="hero" style={{ padding: '6rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(212, 175, 55, 0.1)',
                                color: '#856404',
                                padding: '8px 16px',
                                borderRadius: '100px',
                                marginBottom: '2rem',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}
                        >
                            <Sparkles size={16} />
                            SREC Nandyal Official Review Platform
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '1.5rem' }}
                        >
                            Understand Every <span style={{ color: 'var(--primary-light)' }}>Voice</span>. <br />
                            Improve Every <span style={{ color: 'var(--secondary)' }}>Event</span>.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem' }}
                        >
                            Advanced AI-powered sentiment analysis for college events.
                            Transforming student feedback into actionable campus insights.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}
                        >
                            {(!user || user.role === 'student') && (
                                <button className="btn btn-primary" onClick={() => navigate('/submit')}>
                                    <MessageSquare size={20} /> Submit Review
                                </button>
                            )}
                            {(!user || user.role === 'admin') && (
                                <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
                                    <BarChart3 size={20} /> View Analytics
                                </button>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>

            <section style={{ padding: '4rem 0 8rem' }}>
                <div className="container">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } }
                        }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}
                    >
                        <FeatureCard
                            icon={MessageSquare}
                            title="Easy Feedback"
                            description="Seamlessly share your thoughts on workshops, fests, and technical seminars."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Real-time Insights"
                            description="Visualize sentiment trends across multiple events with high-precision AI analysis."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Secure Platform"
                            description="Restricted access for authenticated @srecnandyal.edu.in students."
                            delay={0.3}
                        />
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Home;
