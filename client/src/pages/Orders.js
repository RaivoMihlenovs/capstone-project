import React, { useState, useEffect } from 'react';
import { getOrders } from '../api';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getOrders();
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
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
    <div className="container orders-page">
      <h1>My Orders</h1>

      {error && <div className="error">{error}</div>}

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Order #{order.id}</h3>
                  <p className="order-date">
                    {new Date(order.created_at).toLocaleDateString()} at{' '}
                    {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <span className={getStatusClass(order.status)}>{order.status}</span>
              </div>

              <div className="order-items">
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <div className="order-item-image">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} />
                      ) : (
                        <div className="no-image-order">📦</div>
                      )}
                    </div>
                    <div className="order-item-details">
                      <p className="order-item-name">{item.name}</p>
                      <p className="order-item-quantity">Quantity: {item.quantity}</p>
                    </div>
                    <div className="order-item-price">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <span className="order-total-label">Total:</span>
                <span className="order-total">${parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;