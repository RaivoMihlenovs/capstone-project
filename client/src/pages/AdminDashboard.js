import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../api';
import './AdminDashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getAdminStats();
      setStats(response.data);
    } catch (err) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="container admin-dashboard">
      <h1>Admin Dashboard</h1>

      {error && <div className="error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>Total Products</h3>
              <p className="stat-value">{stats.total_products}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <h3>Total Orders</h3>
              <p className="stat-value">{stats.total_orders}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Total Customers</h3>
              <p className="stat-value">{stats.total_customers}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>Total Revenue</h3>
              <p className="stat-value">${parseFloat(stats.total_revenue).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="admin-actions">
        <Link to="/admin/products" className="admin-action-card">
          <div className="action-icon">📦</div>
          <h3>Manage Products</h3>
          <p>Create, update, and delete products</p>
        </Link>

        <Link to="/admin/orders" className="admin-action-card">
          <div className="action-icon">📋</div>
          <h3>Manage Orders</h3>
          <p>View and update order statuses</p>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;