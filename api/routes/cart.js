const express = require('express');
const { pool } = require('../db/setup');
const { authMiddleware } = require('../middleware/auth');
const { validateCartItem } = require('../validation');

const router = express.Router();

// Get user's cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image_url, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
    `, [req.user.userId]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add to cart
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Validate and sanitize input
    const validatedData = validateCartItem(req.body);
    const { product_id, quantity } = validatedData;
    const result = await pool.query(`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + $3
      RETURNING *
    `, [req.user.userId, product_id, quantity]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update cart item
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Validate quantity
    const validatedData = { quantity: req.body.quantity };
    const { quantity } = validateCartItem(validatedData);
    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remove from cart
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear cart
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.userId]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;