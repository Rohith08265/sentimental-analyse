import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { MessageSquare, BarChart3, ShieldCheck, Sparkles } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{
            y: -15,
            scale: 1.02,
            boxShadow: "0 30px 60px -12px rgba(15, 23, 42, 0.15)"
        }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 300 }}
        className="glass-card"
        style={{ flex: 1, textAlign: 'center', cursor: 'default' }}
    >
        <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: "spring" }}
            style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, hsla(var(--primary-h), var(--primary-s), 55%, 0.1), hsla(var(--secondary-h), var(--secondary-s), 60%, 0.1))',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem',
                color: 'var(--primary)',
                border: '1px solid var(--glass-border)'
            }}
        >
            <Icon size={40} />
        </motion.div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.2rem', fontWeight: '800' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7' }}>{description}</p>
    </motion.div>
);

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="home-page">
            <section className="hero" style={{ padding: '8rem 0 6rem', position: 'relative', overflow: 'hidden' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'white',
                                padding: '10px 24px',
                                borderRadius: '100px',
                                marginBottom: '3rem',
                                fontSize: '0.95rem',
                                fontWeight: '700',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <span style={{ color: 'var(--primary)' }}><Sparkles size={18} /></span>
                            <span className="gradient-text">Next-Gen Sentiment Analysis</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.8 }}
                            style={{ fontSize: '5.5rem', lineHeight: '1', marginBottom: '2rem', letterSpacing: '-0.04em' }}
                        >
                            Decipher the <span className="gradient-text">Pulse</span> <br />
                            of Your Campus.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            style={{
                                fontSize: '1.4rem',
                                color: 'var(--text-muted)',
                                marginBottom: '4rem',
                                maxWidth: '750px',
                                margin: '0 auto 4rem',
                                fontWeight: '500'
                            }}
                        >
                            Empower SREC Nandyal with AI-driven insights. We transform student voices
                            into visual stories, helping every event reach its full potential.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}
                        >
                            {(!user || user.role === 'student') && (
                                <button className="btn btn-primary" onClick={() => navigate('/submit')}>
                                    <MessageSquare size={22} /> Get Started
                                </button>
                            )}
                            {(!user || user.role === 'admin') && (
                                <button className="btn" style={{ background: 'white', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }} onClick={() => navigate('/dashboard')}>
                                    <BarChart3 size={22} /> Admin Studio
                                </button>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>

            <section style={{ padding: '6rem 0 10rem' }}>
                <div className="container">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '3rem'
                        }}
                    >
                        <FeatureCard
                            icon={MessageSquare}
                            title="Instant Feedback"
                            description="A frictionless experience for students to share deep insights on any college event within seconds."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Dynamic Analytics"
                            description="Real-time data processing that identifies trends, emotions, and areas for campus growth."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Elite Security"
                            description="Enterprise-grade authentication ensures your data is handled with the highest level of privacy."
                            delay={0.3}
                        />
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Home;
