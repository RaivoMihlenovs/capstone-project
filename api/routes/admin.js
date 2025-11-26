const express = require('express');
const { pool } = require('../db/setup');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validateProductData } = require('../validation');

const router = express.Router();

// All routes require authentication and admin access
router.use(authMiddleware, adminMiddleware);

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

// Create product
router.post('/products', async (req, res) => {
  try {
    // Validate and sanitize input
    const validatedData = validateProductData(req.body);
    const { name, description, price, stock, image_url, category } = validatedData;
    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock, image_url, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, price, stock, image_url, category]
    );

    // Update stats
    await updateStats();

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update product
router.put('/products/:id', async (req, res) => {
  try {
    // Validate and sanitize input
    const validatedData = validateProductData(req.body);
    const { name, description, price, stock, image_url, category } = validatedData;
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, stock = $4, image_url = $5, category = $6 WHERE id = $7 RETURNING *',
      [name, description, price, stock, image_url, category, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update stats
    await updateStats();

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, u.email, u.name as customer_name,
        json_agg(json_build_object(
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'price', oi.price,
          'name', p.name
        )) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id, u.email, u.name
      ORDER BY o.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status
router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Confirmed', 'Payment Pending', 'Payment Received', 'Delivered', 'Canceled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update stats
    await updateStats();

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Always calculate and save latest stats
    const calculated = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM users WHERE is_admin = false) as total_customers,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'Canceled') as total_revenue
    `);

    const statData = calculated.rows[0];

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

    res.json(statData);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;