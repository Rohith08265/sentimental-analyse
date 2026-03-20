const supabase = require('../supabaseClient');
const jwt = require('jsonwebtoken');

// Get user profile (role) - called after Supabase Auth login
exports.getProfile = async (req, res) => {
    try {
        const email = req.user.email;

        // Check if user exists in our users table
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            // User doesn't exist in our table yet - create them as student
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                    email: email.toLowerCase(),
                    password: 'supabase_auth', // placeholder, not used
                    role: 'student'
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error creating user profile:', insertError);
                return res.json({ role: 'student', email: email });
            }

            return res.json({
                role: newUser.role,
                email: newUser.email,
                id: newUser.id
            });
        }

        res.json({
            role: user.role,
            email: user.email,
            id: user.id
        });
    } catch (error) {
        console.error('Profile Error:', error);
        res.json({ role: 'student', email: req.user.email });
    }
};

// Legacy login (kept for backward compatibility, not used by new frontend)
exports.login = async (req, res) => {
    res.status(410).json({ error: 'Use Supabase Auth (Google or OTP) instead' });
};

// Legacy register (kept for backward compatibility, not used by new frontend)
exports.register = async (req, res) => {
    res.status(410).json({ error: 'Use Supabase Auth (Google or OTP) instead' });
};
