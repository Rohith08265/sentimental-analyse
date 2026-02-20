import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="container" style={{ padding: '6rem 0' }}>
            <div className="bg-blob blob-1"></div>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{ maxWidth: '450px', margin: '0 auto', borderTop: '4px solid var(--primary)' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'rgba(26, 54, 93, 0.1)',
                        borderRadius: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: 'var(--primary)'
                    }}>
                        <LogIn size={32} />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Student Login</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Welcome back to SREC EduSentiment</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        style={{
                            background: 'rgba(231, 76, 60, 0.1)',
                            color: '#e74c3c',
                            padding: '12px',
                            borderRadius: '8px',
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

                <form onSubmit={handleSubmit}>
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
                        />
                    </div>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Lock size={14} /> Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '15px' }}>
                        Sign In to Platform
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Register here</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
