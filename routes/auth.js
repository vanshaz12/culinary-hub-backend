const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcrypt');

router.post('/signup', async (req, res) => {
    // Check if the itemName is null or empty
    if (!itemName) {
        console.error('Item name cannot be empty');
        return;
    }
    try {
        const { name, email, password } = req.body

        // Check if the user already exists
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email])
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' })
        }

        // Hash the password
        const saltRounds = 10
        const passwordDigest = await bcrypt.hash(password, saltRounds)

        // Insert the user profile into the database
        const newUser = await db.query(
            'INSERT INTO users (name, email, password_digest) VALUES ($1, $2, $3) RETURNING *',
            [name, email, passwordDigest]
        )

        res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] })
    } catch (error) {
        console.error('Error occurred during user registration:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare the provided password with the stored password
        const match = await bcrypt.compare(password, user.rows[0].password_digest);
        if (!match) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Set the session data
        req.session.user = {
            id: user.rows[0].id,
            name: user.rows[0].name,
            email: user.rows[0].email,
        };

        // Login successful
        console.log('User logged in:', user.rows[0].name);
        res.status(200).json({ message: 'Login successful', user: req.session.user });
    } catch (error) {
        console.error('Error occurred during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/check-login', (req, res) => {
    console.log('req.session.user:', req.session.user);
    if (req.session.user) {
        // User is logged in
        res.status(200).json({ loggedIn: true, user: req.session.user });
    } else {
        // User is not logged in
        res.status(200).json({ loggedIn: false });
    }
});
router.get('/logout', (req, res) => {
    // Clear the session data
    req.session.destroy((err) => {
        if (err) {
            console.error('Error occurred during logout:', err);
            res.clearCookie('user_sid')
            res.status(500).json({ message: 'Internal server error' });
        } else {
            res.clearCookie('user_sid')
            res.status(200).json({ message: 'Logout successful' });
        }
    });
});

module.exports = router;
