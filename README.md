# BigBull Trading Dashboard — Backend API

Node.js + Express REST API for portfolio tracking, user auth, and an AI assistant powered by Google Gemini.

## Project structure

```
big-bull-api/
├── src/
│   ├── config/
│   │   ├── database.js      # MongoDB connection
│   │   └── chat.js          # Gemini model, system prompt, generation settings
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── holdingsController.js
│   │   └── chatController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Holding.js
│   │   └── Watchlist.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── holdingsRoutes.js
│   │   ├── portfolioRoutes.js
│   │   └── chatRoutes.js
│   ├── services/
│   │   └── chatService.js   # Portfolio context + Gemini API calls
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── response.js
│   │   └── avatarData.js
│   └── server.js
├── scripts/
│   └── seed.js
├── .env.example
├── index.js                 # Server entry + graceful shutdown
└── package.json
```

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- [Google AI Studio API key](https://aistudio.google.com/apikey) (required for chat)

### Installation

```bash
cd big-bull-api
npm install
cp .env.example .env
```

Configure `.env`:

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default `4000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_ACCESS_EXPIRES` | Access token TTL (e.g. `7d`) |
| `JWT_REFRESH_EXPIRES` | Refresh token TTL (e.g. `30d`) |
| `GEMENI_API_KEY` | Google Gemini API key (env name matches codebase) |

### Seed database (optional)

```bash
npm run seed
```

Demo user:

- **Email:** `demo@bigbull.com`
- **Password:** `Demo@123`

### Run

```bash
npm run dev    # nodemon
npm start      # production
```

API base: `http://localhost:4000`  
JSON API prefix: `http://localhost:4000/api`

On startup, the server logs whether `JWT_SECRET` and `GEMENI_API_KEY` are set.

## API reference

All protected routes require:

```
Authorization: Bearer <jwt_token>
```

Responses use a consistent envelope via `utils/response.js` (`success`, `message`, `data`).

### Authentication — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/register` | No | Create account |
| `POST` | `/login` | No | Login; returns JWT |
| `GET` | `/profile` | Yes | Current user profile |
| `PATCH` | `/profile` | Yes | Update name, phone, bio |
| `POST` | `/profile/avatar` | Yes | Upload profile photo (base64 in body) |
| `DELETE` | `/profile/avatar` | Yes | Remove profile photo |

**Register / login body**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

**Update profile body**

```json
{
  "name": "Jane Doe",
  "phone": "+1234567890",
  "bio": "Investment enthusiast"
}
```

### Holdings — `/api/holdings`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | All holdings for the user |
| `GET` | `/mutuals` | Mutual fund holdings only |
| `GET` | `/stocks` | Stock holdings only |
| `GET` | `/summary` | Portfolio summary (invested, current, allocation) |
| `GET` | `/:id` | Single holding |
| `POST` | `/` | Create holding |
| `PUT` | `/:id` | Update holding |
| `DELETE` | `/:id` | Delete holding |

**Create holding body**

```json
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

`type` must be `stock` or `mutual`.

### Portfolio — `/api/portfolio`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/summary` | Totals and mutual/stock allocation |
| `GET` | `/stats` | Counts, top/worst performer by return % |

### Chat (BigBull AI) — `/api/chat`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Send a message; get an AI reply |

**Request**

```json
{
  "message": "How is my portfolio allocated?"
}
```

**Response** (`data`)

```json
{
  "reply": "..."
}
```

The service loads the user’s holdings from MongoDB, builds a portfolio context block, and calls **Gemini 2.5 Flash** (`@google/genai`) with:

- A fixed system instruction (stocks/portfolios scope, no financial advice)
- **Google Search** tooling for live prices and news
- Stored holding prices labeled as last saved in the app, not live exchange ticks

Returns `400` if `message` is missing, `502` if Gemini returns no text, `503` if `GEMENI_API_KEY` is not set.

## Database models

### User

- `name`, `email` (unique), `password` (bcrypt hashed)
- `phone`, `bio`, `avatar` (optional)
- Timestamps

### Holding

- `user` (ref to User)
- `type`: `mutual` | `stock`
- `name`, `symbol`, `qty`, `avgPrice`, `currentPrice`, `notes`
- Timestamps

### Watchlist

- `user`, `symbol`, `name`, `type`, `targetPrice`, `notes`

## Security

- Bcrypt password hashing
- JWT on protected routes (`authMiddleware`)
- Mongoose validation
- CORS enabled
- `Cache-Control: no-store` on API responses
- JSON body limit `3mb` (avatars)

## Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `mongoose` | MongoDB ODM |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT auth |
| `cors` | Cross-origin requests |
| `dotenv` | Environment config |
| `@google/genai` | Gemini chat + search tools |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |
| `npm run seed` | Seed demo user and holdings |

## License

MIT
