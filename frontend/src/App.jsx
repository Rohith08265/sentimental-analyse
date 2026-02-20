import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ReviewForm from './pages/ReviewForm';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import History from './pages/History';
import { AuthProvider, useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, LogOut, User as UserIcon, LayoutDashboard, PenLine, Home as HomeIcon, History as HistoryIcon } from 'lucide-react';
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const [darkMode, setDarkMode] = useState(false);
  const { user, loading, logout } = useAuth();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    const theme = !darkMode ? 'dark' : 'light';
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.body.setAttribute('data-theme', 'dark');
    }
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <nav className="glass-panel" style={{ position: 'sticky', top: 0, borderRadius: 0, border: 'none', borderBottom: '1px solid var(--glass-border)' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '100%' }}>
            <Link to="/" className="logo" style={{ textDecoration: 'none' }}>EduSentiment</Link>

            <ul className="nav-links">
              <li>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HomeIcon size={18} /> Home
                </Link>
              </li>

              {user && (
                <>
                  {user.role === 'student' && (
                    <li>
                      <Link to="/submit" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PenLine size={18} /> Submit Review
                      </Link>
                    </li>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <li>
                        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <LayoutDashboard size={18} /> Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <HistoryIcon size={18} /> History
                        </Link>
                      </li>
                    </>
                  )}
                </>
              )}

              <li style={{ height: '24px', width: '1px', background: 'var(--glass-border)' }}></li>

              {!user ? (
                <>
                  <li><Link to="/login">Sign In</Link></li>
                  <li><Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Join SREC</Link></li>
                </>
              ) : (
                <>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-light)', fontWeight: '700' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <span>{user.email.split('@')[0]}</span>
                  </li>
                  <li>
                    <button onClick={logout} style={{ background: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                      <LogOut size={18} /> Logout
                    </button>
                  </li>
                </>
              )}

              <li>
                <button
                  onClick={toggleDarkMode}
                  style={{ background: 'none', color: 'var(--text-main)', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <main style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/submit" element={
                <ProtectedRoute>
                  <ReviewForm />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute adminOnly={true}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute adminOnly={true}>
                  <History />
                </ProtectedRoute>
              } />
            </Routes>
          </AnimatePresence>
        </main>

        <footer style={{ background: 'rgba(0,0,0,0.02)', padding: '4rem 0', borderTop: '1px solid var(--glass-border)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '4rem', marginBottom: '3rem' }}>
              <div>
                <Link to="/" className="logo" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>EduSentiment</Link>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '400px' }}>
                  The official sentiment analysis platform for SREC Nandyal.
                  Leveraging AI to bridge the gap between student feedback and administrative action.
                </p>
              </div>
              <div>
                <h4 style={{ marginBottom: '1.5rem' }}>Platform</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <li><Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>How it Works</Link></li>
                  <li><Link to="/submit" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Submit Review</Link></li>
                  <li><Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Student Portal</Link></li>
                </ul>
              </div>
              <div>
                <h4 style={{ marginBottom: '1.5rem' }}>College</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  SREC Nandyal<br />
                  Andhra Pradesh, India<br />
                  contact@srecnandyal.edu.in
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                © 2026 SREC Nandyal. Engineered for Excellence.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
