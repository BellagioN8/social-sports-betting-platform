# Social Sports Betting Platform

A social platform for managing, tracking, and discussing sports betting activities without handling real bets. This platform provides a safe environment for users to engage with friends over sports betting without financial risks, focusing on community and entertainment value.

## 🎯 Project Goal

Build a social platform that allows users to:
- Track and manage simulated sports bets
- Join groups and chat with friends
- View live sports scores and updates (powered by API Sports)
- Engage in friendly competition without financial risk

## 📈 Success Criteria

1. At least 200 active users within the first month
2. 95% uptime for live scores page
3. 80% of user sessions involve bet entry or chat usage
4. Zero data breaches
5. User creation time < 2 seconds

## 📚 Documentation

- **[PLANNING.md](PLANNING.md)** - Architecture, technology decisions, and system design
- **[TASK.md](TASK.md)** - Active tasks, backlog, and development roadmap
- **[Database Schema](backend/src/database/SCHEMA.md)** - Complete database documentation

## Architecture

### Three-Tier Architecture

**Frontend (React)**
- User interface for bet management
- Group management and chat interface
- Live scores display
- Mobile-responsive design

**Backend (Node.js/Express)**
- RESTful API endpoints
- JWT-based authentication
- WebSocket support for real-time chat
- External API integration for live scores
- Data encryption for sensitive information

**Database (PostgreSQL)**
- User accounts and authentication
- Bet tracking and history
- Group management
- Cached live scores

## Project Structure

```
social-sports-betting-platform/
├── frontend/              # React frontend application
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Page components
│       ├── services/      # API client services
│       ├── utils/         # Utility functions
│       └── styles/        # CSS/styling files
├── backend/               # Node.js backend API
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── config/        # Configuration files
│   │   └── utils/         # Utility functions
│   └── tests/             # Backend tests
└── package.json           # Workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** v14 or higher
- **npm** or **yarn**
- **Docker** (optional, for containerized deployment)
- **API Sports API Key** (optional, for real NFL data)

### Quick Start with Docker (Recommended)

The fastest way to get the entire stack running:

```bash
# 1. Clone the repository
git clone https://github.com/BellagioN8/social-sports-betting-platform.git
cd social-sports-betting-platform

# 2. Set up environment variables
cp .env.docker.example .env
# Edit .env with your configuration

# 3. Start all services
docker-compose up -d

# 4. Initialize the database
docker-compose exec backend npm run db:setup

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Database: localhost:5433
```

### Manual Installation

#### 1. Clone and Install

```bash
git clone https://github.com/BellagioN8/social-sports-betting-platform.git
cd social-sports-betting-platform

# Install all dependencies
npm run install:all
```

#### 2. Database Setup

```bash
# Make sure PostgreSQL is running on port 5433 (or configure your port)

cd backend
cp .env.example .env
# Edit .env and update database credentials

# Initialize database and run migrations
npm run db:setup

# Test database connection
npm run db:test
```

#### 3. Configure Environment Variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:
- Database credentials
- JWT secrets (generate secure random strings)
- API Sports key (if using real data)
- Encryption key (64-character hex string)

**Generate Secure Keys:**
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. API Sports Setup (Optional)

For real NFL data:
1. Sign up at [api-sports.io](https://api-sports.io)
2. Subscribe to American Football API
3. Add your API key to `.env`:
```
USE_REAL_API=true
API_SPORTS_KEY=your_api_key_here
```

## 💻 Development

### Running the Full Stack

```bash
# From project root - runs both frontend and backend
npm run dev
```

### Running Services Separately

```bash
# Backend (from project root or backend/)
npm run dev:backend
# or
cd backend && npm run dev

# Frontend (from project root or frontend/)
npm run dev:frontend
# or
cd frontend && npm start

# Access points:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# API Docs: http://localhost:5000/api
# Health Check: http://localhost:5000/health
```

### Docker Development

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart backend

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up --build
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/services/sportsApiService.test.js
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### Linting

```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

## Validation Commands

### L1 - Linting
```bash
npm run lint:backend
# Expected: No lint errors
```

### L2 - Unit Tests
```bash
npm run test
# Expected: All tests pass with > 80% coverage
```

### L3 - E2E Tests
```bash
npm run test:e2e
# Expected: End-to-end tests pass without failures
```

## Key Features

- **User Authentication**: Secure registration and login system
- **Bet Management**: Create, track, and manage simulated bets
- **Group Features**: Create/join groups for social betting
- **Real-time Chat**: WebSocket-powered group chat
- **Live Scores**: Real-time sports scores and updates
- **Mobile Responsive**: Optimized for mobile devices

## Security Considerations

- All bet-related data is encrypted
- JWT-based authentication with secure token management
- Rate limiting on API endpoints
- CORS and Helmet middleware for security headers
- Zero tolerance for data breaches

## Known Considerations

1. Compliance with laws regarding betting simulation
2. Privacy mechanisms for group chats
3. Clear distinction from actual betting services
4. Sports prioritization for live scores (to be determined)

## Database

### Schema Overview

The platform uses PostgreSQL with the following core tables:

- **users**: User accounts and authentication
- **groups**: Social betting groups
- **group_members**: User-group relationships
- **bets**: Betting records with encrypted details
- **scores**: Cached live game data
- **messages**: Group chat messages
- **refresh_tokens**: JWT token management

For detailed schema documentation, see [backend/src/database/SCHEMA.md](backend/src/database/SCHEMA.md)

### Database Commands

```bash
# Set up database (creates DB and runs migrations)
cd backend && npm run db:setup

# Reset database (WARNING: deletes all data)
cd backend && npm run db:reset

# Test database connection
cd backend && npm run db:test
```

### Environment Variables

Required database environment variables in `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=social_sports_betting
DB_USER=postgres
DB_PASSWORD=your_password
```

## Technology Stack

**Frontend:**
- React 18
- React Router
- Axios for API calls
- WebSocket for real-time features

**Backend:**
- Node.js with Express
- PostgreSQL for database
- JWT for authentication
- WebSocket (ws) for real-time chat
- bcrypt for password hashing

**Testing:**
- Jest for unit tests
- Cypress for E2E tests
- Supertest for API testing

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
