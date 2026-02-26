const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const reviewRoutes = require('./routes/reviewRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'https://sentimental-analyse.vercel.app'],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        const db = require('./supabaseClient');
        const { data, error } = await db.from('users').select('id').limit(1);
        res.json({
            status: 'ok',
            db: error ? 'disconnected' : 'connected',
            dbStatus: error ? error.message : 'connected'
        });
    } catch (err) {
        res.json({ status: 'error', db: 'disconnected', dbStatus: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database: ${process.env.SUPABASE_URL ? 'Supabase (Cloud)' : 'SQLite (Local)'}`);
});
