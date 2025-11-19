import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, addToCart } from '../api';
import './ProductDetail.css';

function ProductDetail({ user, setCartCount }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await getProduct(id);
      setProduct(response.data);
    } catch (err) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    setError('');
    setSuccess('');

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > product.stock) {
      setError(`Please enter a valid quantity between 1 and ${product.stock}`);
      setAddingToCart(false);
      return;
    }

    try {
      await addToCart({ product_id: product.id, quantity: qty });
      setSuccess('Added to cart!');
      setCartCount(prev => prev + qty);
      setQuantity(qty.toString());
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="loading">Loading product...</div>;
  if (error && !product) return <div className="container"><div className="error">{error}</div></div>;
  if (!product) return <div className="container"><p>Product not found</p></div>;

  return (
    <div className="container product-detail">
      <div className="product-detail-grid">
        <div className="product-detail-image">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <div className="no-image-large">📦</div>
          )}
        </div>

        <div className="product-detail-info">
          <h1>{product.name}</h1>
          {product.category && <span className="product-category">{product.category}</span>}
          
          <div className="product-price-large">
            ${parseFloat(product.price).toFixed(2)}
          </div>

          <p className="product-description-full">{product.description}</p>

          <div className="product-stock-info">
            {product.stock > 0 ? (
              <span className="in-stock">✓ In Stock ({product.stock} available)</span>
            ) : (
              <span className="out-of-stock">✗ Out of Stock</span>
            )}
          </div>

          {success && <div className="success">{success}</div>}
          {error && <div className="error">{error}</div>}

          {product.stock > 0 && (
            <div className="add-to-cart-section">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      setQuantity(e.target.value);
                    }
                  }}
                />
              </div>

              <button
                onClick={handleAddToCart}
                className="btn-primary add-to-cart-btn"
                disabled={addingToCart}
              >
                {addingToCart ? 'Adding...' : '🛒 Add to Cart'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;