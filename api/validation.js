// Input validation and sanitization utilities

// Sanitize string input: trim whitespace and remove basic XSS
function sanitizeString(str, maxLength = 1000) {
  if (typeof str !== 'string') {
    throw new Error('Input must be a string');
  }

  // Trim whitespace
  let sanitized = str.trim();

  // Check length
  if (sanitized.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }

  // Basic XSS protection - remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]*>/g, ''); // Remove any remaining HTML tags

  return sanitized;
}

// Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  return email.toLowerCase().trim();
}

// Validate positive number
function validatePositiveNumber(value, fieldName = 'value') {
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return num;
}

// Validate positive integer
function validatePositiveInteger(value, fieldName = 'value') {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return num;
}

// Validate required fields
function validateRequired(value, fieldName = 'field') {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${fieldName} is required`);
  }
  return value;
}

// Validate password strength (basic)
function validatePassword(password) {
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  return password;
}

// Validate product data
function validateProductData(data) {
  const validated = {};

  validated.name = validateRequired(sanitizeString(data.name, 200), 'Product name');
  validated.description = sanitizeString(data.description || '', 2000);
  validated.price = validatePositiveNumber(data.price, 'Price');
  validated.stock = validatePositiveInteger(data.stock, 'Stock');
  validated.category = data.category ? sanitizeString(data.category, 100) : null;
  validated.image_url = data.image_url ? sanitizeString(data.image_url, 500) : null;

  return validated;
}

// Validate user registration data
function validateUserRegistration(data) {
  const validated = {};

  validated.name = validateRequired(sanitizeString(data.name, 100), 'Name');
  validated.email = validateRequired(validateEmail(data.email), 'Email');
  validated.password = validateRequired(validatePassword(data.password), 'Password');

  return validated;
}

// Validate user login data
function validateUserLogin(data) {
  const validated = {};

  validated.email = validateRequired(validateEmail(data.email), 'Email');
  validated.password = validateRequired(data.password, 'Password');

  return validated;
}

// Validate cart item data
function validateCartItem(data) {
  const validated = {};

  validated.product_id = validatePositiveInteger(data.product_id, 'Product ID');
  validated.quantity = validatePositiveInteger(data.quantity, 'Quantity');

  return validated;
}

module.exports = {
  sanitizeString,
  validateEmail,
  validatePositiveNumber,
  validatePositiveInteger,
  validateRequired,
  validatePassword,
  validateProductData,
  validateUserRegistration,
  validateUserLogin,
  validateCartItem
};