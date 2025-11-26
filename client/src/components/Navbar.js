import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { becomeAdmin } from '../api';
import './Navbar.css';

function Navbar({ user, onLogout, onUserUpdate, cartCount }) {
  const [adminMessage, setAdminMessage] = useState('');

  const handleBecomeAdmin = async () => {
    if (!user) {
      setAdminMessage('Please login first');
      return;
    }

    try {
      const response = await becomeAdmin();
      // Update both user data and token
      localStorage.setItem('token', response.data.token);
      onUserUpdate(response.data.user);
      setAdminMessage('Successfully became admin!');
      // Clear message after 3 seconds
      setTimeout(() => setAdminMessage(''), 3000);
    } catch (err) {
      setAdminMessage('Failed to become admin');
      setTimeout(() => setAdminMessage(''), 3000);
    }
  };
  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          🛒 Capstone
        </Link>
        
        <div className="navbar-links">
          <Link to="/products">Products</Link>
          
          {user ? (
            <>
              <Link to="/cart" className="cart-link">
                Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/orders">My Orders</Link>
              
              {user.is_admin && (
                <Link to="/admin" className="admin-link">Admin</Link>
              )}

              {!user.is_admin && (
                <button
                  onClick={handleBecomeAdmin}
                  className="btn-secondary become-admin-btn"
                  title="Become Admin (Testing Only)"
                >
                  Become Admin
                </button>
              )}

              {adminMessage && (
                <span className={`admin-message ${adminMessage.includes('Successfully') ? 'success' : 'error'}`}>
                  {adminMessage}
                </span>
              )}

              <span className="user-name">Hello, {user.name}</span>
              <button onClick={onLogout} className="btn-secondary">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;