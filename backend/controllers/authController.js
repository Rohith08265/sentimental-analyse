const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { email, password, role, adminSecret } = req.body;
        console.log(`Registration attempt for: ${email}`);
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ error: 'User already exists' });

        let finalRole = 'student';
        if (role === 'admin' && adminSecret === process.env.ADMIN_SECRET_KEY) {
            finalRole = 'admin';
        }

        const user = new User({ email, password, role: finalRole });
        await user.save();
        res.status(201).json({ message: 'User registered' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for: ${email}`);
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: { id: user._id, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
