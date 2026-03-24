import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Mail, Shield, ArrowRight, CheckCircle, Loader } from 'lucide-react';

const Register = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('email'); // 'email' | 'otp' | 'success'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { sendOtp, verifyOtp } = useAuth();
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await sendOtp(email);
            setStep('otp');
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyOtp(email, otp);
            setStep('success');
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            setError(err.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '6rem 0' }}>
            <div className="bg-blob blob-1"></div>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{ maxWidth: '480px', margin: '0 auto' }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        background: 'linear-gradient(135deg, hsla(var(--primary-h), var(--primary-s), 55%, 0.1), hsla(var(--secondary-h), var(--secondary-s), 60%, 0.1))',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: 'var(--primary)',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <UserPlus size={32} />
                    </div>
                    <h2 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                        Create Account
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        Join the SREC Intelligence Network
                    </p>
                </div>

                {/* Error Display */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                                background: 'rgba(231, 76, 60, 0.1)',
                                color: '#e74c3c',
                                padding: '12px',
                                borderRadius: '12px',
                                marginBottom: '1.5rem',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                fontWeight: '600',
                                border: '1px solid rgba(231, 76, 60, 0.2)'
                            }}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* OTP Flow */}
                <AnimatePresence mode="wait">
                    {step === 'email' && (
                        <motion.form
                            key="email-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleSendOtp}
                        >
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Mail size={14} /> College Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="id@srecnandyal.edu.in"
                                    style={{ fontSize: '1rem' }}
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                {loading ? (
                                    <><Loader size={18} className="spin-animation" /> Sending OTP...</>
                                ) : (
                                    <><ArrowRight size={18} /> Send OTP to Email</>
                                )}
                            </motion.button>
                        </motion.form>
                    )}

                    {step === 'otp' && (
                        <motion.form
                            key="otp-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleVerifyOtp}
                        >
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '12px',
                                padding: '14px',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '0.9rem',
                                color: '#10b981',
                                fontWeight: '600'
                            }}>
                                <CheckCircle size={18} />
                                OTP sent to {email}
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Shield size={14} /> Enter OTP Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    style={{
                                        fontSize: '1.5rem',
                                        textAlign: 'center',
                                        letterSpacing: '0.5em',
                                        fontWeight: '800'
                                    }}
                                    autoFocus
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                {loading ? (
                                    <><Loader size={18} className="spin-animation" /> Verifying...</>
                                ) : (
                                    <><UserPlus size={18} /> Verify & Create Account</>
                                )}
                            </motion.button>
                            <button
                                type="button"
                                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                                style={{
                                    width: '100%',
                                    marginTop: '1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    padding: '10px'
                                }}
                            >
                                ← Use a different email
                            </button>
                        </motion.form>
                    )}

                    {step === 'success' && (
                        <motion.div
                            key="success-step"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center', padding: '2rem 0' }}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem',
                                    color: '#10b981'
                                }}
                            >
                                <CheckCircle size={40} />
                            </motion.div>
                            <h3 style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                Account Created!
                            </h3>
                            <p style={{ color: 'var(--text-muted)' }}>Redirecting to dashboard...</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        By registering, you agree to the SREC platform terms.
                    </p>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{
                            color: 'var(--primary)',
                            fontWeight: '700',
                            textDecoration: 'none'
                        }}>
                            Sign in here
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
