import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';

function App() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCartCount(0);
  };

  const handleUserUpdate = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} cartCount={cartCount} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail user={user} setCartCount={setCartCount} />} />
          <Route path="/cart" element={user ? <Cart setCartCount={setCartCount} /> : <Navigate to="/login" />} />
          <Route path="/orders" element={user ? <Orders /> : <Navigate to="/login" />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={user?.is_admin ? <AdminDashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin/products" 
            element={user?.is_admin ? <AdminProducts /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin/orders" 
            element={user?.is_admin ? <AdminOrders /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;