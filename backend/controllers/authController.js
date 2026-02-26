const supabase = require('../supabaseClient');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();
        console.log(`Registration attempt for: ${normalizedEmail}`);

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', normalizedEmail)
            .single();

        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: newUser, error } = await supabase
            .from('users')
            .insert({ email: normalizedEmail, password: hashedPassword, role: 'student' })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'User registered' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();
        console.log(`[LOGIN] Attempt: ${normalizedEmail}`);

        const startTime = Date.now();
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .single();

        console.log(`[LOGIN] Query took: ${Date.now() - startTime}ms`);

        if (error || !user) {
            console.log(`User not found: ${normalizedEmail}`);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Password mismatch for: ${normalizedEmail}`);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1h' }
        );

        console.log(`Login successful for: ${normalizedEmail}`);
        res.json({
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: error.message });
    }
};
