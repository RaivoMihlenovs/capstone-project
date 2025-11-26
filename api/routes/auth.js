const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/setup');
const { authMiddleware } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../validation');

const router = express.Router();

// Function to update stats
const updateStats = async () => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM users WHERE is_admin = false) as total_customers,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'Canceled') as total_revenue
    `);

    const statData = stats.rows[0];

    await pool.query(`
      INSERT INTO stats (id, total_products, total_orders, total_customers, total_revenue)
      VALUES (1, $1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        total_products = EXCLUDED.total_products,
        total_orders = EXCLUDED.total_orders,
        total_customers = EXCLUDED.total_customers,
        total_revenue = EXCLUDED.total_revenue,
        updated_at = CURRENT_TIMESTAMP
    `, [statData.total_products, statData.total_orders, statData.total_customers, statData.total_revenue]);
  } catch (err) {
    console.error('Error updating stats:', err);
  }
};

// Register
router.post('/register', async (req, res) => {
  try {
    // Validate and sanitize input
    const validatedData = validateUserRegistration(req.body);
    const { email, password, name } = validatedData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, is_admin',
      [email, hashedPassword, name]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update stats
    await updateStats();

    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      // Handle validation errors
      res.status(400).json({ error: err.message });
    }
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    // Validate and sanitize input
    const validatedData = validateUserLogin(req.body);
    const { email, password } = validatedData;
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin
      },
      token
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Become admin (for testing purposes only)
router.post('/become-admin', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_admin = true WHERE id = $1 RETURNING id, email, name, is_admin',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Generate new token with updated admin status
    const token = jwt.sign(
      { userId: user.id, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Successfully became admin!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;