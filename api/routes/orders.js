const express = require('express');
const { pool } = require('../db/setup');
const { authMiddleware } = require('../middleware/auth');

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

// Get user's orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, 
        json_agg(json_build_object(
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'price', oi.price,
          'name', p.name,
          'image_url', p.image_url
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.user.userId]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, 
        json_agg(json_build_object(
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'price', oi.price,
          'name', p.name,
          'image_url', p.image_url
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id
    `, [req.params.id, req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create order
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get cart items
    const cartResult = await client.query(`
      SELECT ci.product_id, ci.quantity, p.price, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
    `, [req.user.userId]);

    if (cartResult.rows.length === 0) {
      throw new Error('Cart is empty');
    }

    // Check stock availability
    for (const item of cartResult.rows) {
      if (item.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }
    }

    // Calculate total
    const total = cartResult.rows.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    // Create order
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, total, 'Pending']
    );

    const order = orderResult.rows[0];

    // Create order items and update stock
    for (const item of cartResult.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.product_id, item.quantity, item.price]
      );

      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.userId]);

    await client.query('COMMIT');

    // Update stats
    await updateStats();

    // Fetch complete order with items
    const completeOrder = await pool.query(`
      SELECT o.*,
        json_agg(json_build_object(
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'price', oi.price,
          'name', p.name,
          'image_url', p.image_url
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id
    `, [order.id]);

    res.status(201).json(completeOrder.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;