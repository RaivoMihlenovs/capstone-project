# To setup locally:
npm install
cd client
npm install

# Setup a postgresql database:
create a .env file in the root directory
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ecommerce_capstone

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port (optional, defaults to 3001)
PORT=3001

# To run after setup:
npm run dev
cd client
npm start
