import React, { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../api';
import './AdminOrders.css';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const statuses = ['Pending', 'Confirmed', 'Payment Pending', 'Payment Received', 'Delivered', 'Canceled'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getAllOrders();
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setSuccess('Order status updated');
      fetchOrders();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update order status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'Pending': 'badge-pending',
      'Confirmed': 'badge-confirmed',
      'Payment Pending': 'badge-payment-pending',
      'Payment Received': 'badge-payment-received',
      'Delivered': 'badge-delivered',
      'Canceled': 'badge-canceled'
    };
    return `badge ${statusMap[status] || 'badge-pending'}`;
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="container admin-orders">
      <h1>Manage Orders</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {orders.length === 0 ? (
        <div className="no-orders">No orders yet.</div>
      ) : (
        <div className="orders-table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    <div className="customer-info">
                      <strong>{order.customer_name}</strong>
                      <br />
                      <small>{order.email}</small>
                    </div>
                  </td>
                  <td>
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="order-item-summary">
                        {item.name} x {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td>
                    <strong>${parseFloat(order.total_amount).toFixed(2)}</strong>
                  </td>
                  <td>
                    <span className={getStatusClass(order.status)}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="status-select"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;