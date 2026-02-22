const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { email, password, role, adminSecret } = req.body;
        const normalizedEmail = email.toLowerCase();
        console.log(`Registration attempt for: ${normalizedEmail}`);

        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) return res.status(400).json({ error: 'User already exists' });

        let finalRole = 'student';
        if (role === 'admin' && adminSecret === process.env.ADMIN_SECRET_KEY) {
            finalRole = 'admin';
        }

        const user = new User({ email: normalizedEmail, password, role: finalRole });
        await user.save();
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
        console.log(`Login attempt for: ${normalizedEmail}`);

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.log(`User not found: ${normalizedEmail}`);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Password mismatch for: ${normalizedEmail}`);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1h' }
        );

        console.log(`Login successful for: ${normalizedEmail}`);
        res.json({
            token,
            user: { id: user._id, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: error.message });
    }
};
