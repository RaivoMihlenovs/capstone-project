import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout, cartCount }) {
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