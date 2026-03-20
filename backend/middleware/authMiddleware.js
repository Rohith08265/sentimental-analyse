const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        // Verify the token with Supabase Auth
        const { data: { user }, error } = await supabaseClient.auth.getUser(token);

        if (error || !user) {
            console.log('Supabase auth verification failed:', error?.message);
            return res.status(401).json({ error: 'Token is not valid' });
        }

        // Set user info on request
        req.user = {
            id: user.id,
            email: user.email,
            supabaseUser: user
        };

        // Also fetch role from our users table
        const { data: dbUser } = await supabaseClient
            .from('users')
            .select('role')
            .eq('email', user.email.toLowerCase())
            .single();

        if (dbUser) {
            req.user.role = dbUser.role;
        } else {
            req.user.role = 'student';
        }

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Token verification failed' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Admins only' });
    }
};

module.exports = { protect, adminOnly };
