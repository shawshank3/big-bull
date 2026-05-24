# BigBull Trading Dashboard - Backend API

## 📋 Project Structure

```
big-bull-api/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.js  # MongoDB connection
│   ├── controllers/     # Business logic
│   │   ├── authController.js
│   │   └── holdingsController.js
│   ├── middleware/      # Express middleware
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/          # MongoDB schemas
│   │   ├── User.js
│   │   ├── Holding.js
│   │   └── Watchlist.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── holdingsRoutes.js
│   │   └── portfolioRoutes.js
│   ├── utils/           # Utility functions
│   │   ├── jwt.js
│   │   └── response.js
│   └── server.js        # Express app setup
├── scripts/
│   └── seed.js          # Database seeding
├── .env                 # Environment variables (local)
├── .env.example         # Environment template
├── index.js             # Server entry point
└── package.json         # Dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   cd big-bull-api
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your configuration:
   ```
   PORT=4000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/bigbull
   JWT_SECRET=your_super_secret_key_here
   ```

3. **Seed the database** (optional)
   ```bash
   npm run seed
   ```
   This creates a demo user with sample holdings:
   - **Email**: demo@bigbull.com
   - **Password**: Demo@123

### Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:4000`

### Production

Build and start:
```bash
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication Endpoints

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

#### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

#### Get Profile
```
GET /auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "+1234567890",
  "bio": "Investment enthusiast"
}
```

### Holdings Endpoints

#### Get All Holdings
```
GET /holdings
Authorization: Bearer <token>
```

#### Get Mutual Funds
```
GET /holdings/mutuals
Authorization: Bearer <token>
```

#### Get Stocks
```
GET /holdings/stocks
Authorization: Bearer <token>
```

#### Create Holding
```
POST /holdings
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "stock",
  "name": "Apple Inc.",
  "symbol": "AAPL",
  "qty": 10,
  "avgPrice": 150.00,
  "currentPrice": 175.00,
  "notes": "Growth stock"
}
```

#### Update Holding
```
PUT /holdings/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "qty": 15,
  "currentPrice": 180.00
}
```

#### Delete Holding
```
DELETE /holdings/:id
Authorization: Bearer <token>
```

### Portfolio Endpoints

#### Get Portfolio Summary
```
GET /portfolio/summary
Authorization: Bearer <token>
```

#### Get Portfolio Stats
```
GET /portfolio/stats
Authorization: Bearer <token>
```

## 🔐 Authentication

All endpoints (except `/auth/register` and `/auth/login`) require JWT authentication.

Include the token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

## 🗄️ Database Models

### User Schema
- name (String, required)
- email (String, unique, required)
- password (String, hashed, required)
- phone (String)
- bio (String)
- avatar (String)
- createdAt & updatedAt

### Holding Schema
- user (ObjectId reference to User)
- type (enum: 'mutual', 'stock')
- name, symbol, qty, avgPrice, currentPrice
- notes (optional)
- createdAt & updatedAt

### Watchlist Schema
- user (ObjectId reference to User)
- symbol, name, type
- targetPrice (optional)
- notes (optional)

## 🔒 Security Features

- Password Hashing with Bcryptjs
- JWT Authentication
- Protected Routes with middleware
- Input Validation with Mongoose
- CORS enabled

## 📦 Dependencies

- express, mongoose, bcryptjs, jsonwebtoken, cors, dotenv

## 📄 License

MIT License
