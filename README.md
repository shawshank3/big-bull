# BigBull Trading Dashboard - Frontend UI

## 📋 Project Structure

```
big-bull-ui/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Alert.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── Table.jsx
│   │   └── layout/          # Layout components
│   │       ├── Navbar.jsx
│   │       ├── Sidebar.jsx
│   │       └── MainLayout.jsx
│   ├── pages/               # Page components
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── HoldingsPage.jsx
│   │   ├── PortfolioPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── store/               # Redux state management
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   └── holdingsSlice.js
│   │   └── store.js
│   ├── services/            # API services
│   │   └── api.js
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useHoldings.js
│   │   └── ProtectedRoute.jsx
│   ├── utils/               # Utility functions
│   │   ├── localStorage.js
│   │   └── format.js
│   ├── constants/           # App constants
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Backend API running on `http://localhost:4000`

### Installation

1. **Install dependencies**
   ```bash
   cd big-bull-ui
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your backend API URL:
   ```
   VITE_API_URL=http://localhost:4000/api
   VITE_APP_NAME=BigBull
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 🎨 Component Architecture

### Compound Component Pattern

Components are built using the compound component pattern for flexibility and reusability:

```jsx
<Card>
  <CardHeader>
    <h2>Title</h2>
  </CardHeader>
  <CardBody>
    Content here
  </CardBody>
  <CardFooter>
    Actions here
  </CardFooter>
</Card>
```

### Available Components

**Common Components:**
- Button (variants: primary, secondary, danger, outline)
- Input (with label and validation)
- Card (with compound parts)
- Modal (with compound parts)
- Alert (variants: success, danger, warning, info)
- Badge (variants: success, danger, warning, info)
- Table (with compound structure)

**Layout Components:**
- Navbar (top navigation)
- Sidebar (side menu)
- MainLayout (main wrapper)

## 📱 Pages & Features

### Authentication Pages
- **Login Page** - User login with email/password
- **Register Page** - New user registration

### Protected Pages (require login)
- **Dashboard** - Portfolio overview and statistics
- **Holdings** - View and manage all holdings
- **Portfolio** - Asset allocation and performance analysis

## 🔐 State Management (Redux)

**Auth Slice:**
- User information
- JWT token
- Authentication state
- Login/Register/Logout actions

**Holdings Slice:**
- Holdings list
- Filter and sort options
- Holdings operations

## 🌐 API Integration

**Available API methods:**
- `authAPI.register(data)`
- `authAPI.login(data)`
- `authAPI.getProfile()`
- `holdingsAPI.getAll()`
- `holdingsAPI.getMutuals()`
- `holdingsAPI.getStocks()`
- `portfolioAPI.getSummary()`

## 📊 Custom Hooks

**useAuth:** Handle authentication operations
```javascript
const { user, isLoading, login, register, logout } = useAuth();
```

**useHoldings:** Manage holdings operations
```javascript
const { holdings, isLoading, fetchHoldings, addHolding } = useHoldings();
```

## 🎨 Styling

- Tailwind CSS for utility-first styling
- Custom component classes in `src/main.css`
- Responsive design
- Custom color palette (primary, secondary, danger, etc.)

## 🚀 Features

✅ Modern React with Vite
✅ Tailwind CSS for styling
✅ Redux Toolkit for state management
✅ React Router for navigation
✅ Compound component pattern
✅ Custom hooks for reusability
✅ JWT authentication
✅ Form validation
✅ Responsive design
✅ Error handling

## 📦 Dependencies

- react, react-dom, react-router-dom
- @reduxjs/toolkit, react-redux
- axios, js-cookie
- tailwindcss, postcss, autoprefixer

## 🔌 Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API base URL |
| VITE_APP_NAME | Application name |

## 📄 License

MIT License

