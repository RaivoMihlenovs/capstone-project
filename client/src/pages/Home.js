import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <div className="container">
          <h1>Welcome to Capstone</h1>
          <p>Discover amazing products at great prices</p>
          <Link to="/products" className="btn-primary hero-btn">
            Shop Now
          </Link>
        </div>
      </div>

      <div className="container features">
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🛍️</div>
            <h3>Wide Selection</h3>
            <p>Browse our extensive product catalog</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>Fast Delivery</h3>
            <p>Quick and reliable shipping</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Payment</h3>
            <p>Your transactions are safe with us</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💯</div>
            <h3>Quality Guaranteed</h3>
            <p>Only the best products for you</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;