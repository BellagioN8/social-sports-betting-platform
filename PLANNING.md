# Social Sports Betting Platform - Planning & Architecture

**Project Start Date:** November 6, 2025
**Status:** Active Development
**Version:** 1.0.0

## 🎯 Project Vision

Build a social platform for managing, tracking, and discussing simulated sports betting activities without handling real money. The platform provides a safe environment for users to engage with friends over sports betting without financial risks, focusing on community and entertainment value.

## 🏗️ Architecture Overview

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - User Interface & Experience                          │
│  - Client-side routing & state management               │
│  - Real-time updates via WebSocket                      │
└─────────────────────────────────────────────────────────┘
                           ↓ HTTP/WS
┌─────────────────────────────────────────────────────────┐
│                Backend (Node.js/Express)                 │
│  - RESTful API endpoints                                │
│  - JWT-based authentication                             │
│  - WebSocket server for real-time features              │
│  - Business logic & data validation                     │
│  - External API integration (API Sports)                │
└─────────────────────────────────────────────────────────┘
                           ↓ SQL
┌─────────────────────────────────────────────────────────┐
│              Database (PostgreSQL 14)                    │
│  - User accounts & authentication                       │
│  - Bet tracking & history                               │
│  - Group management & memberships                       │
│  - Cached live scores                                   │
│  - Chat messages                                        │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18
- **Routing:** React Router v6
- **HTTP Client:** Axios with interceptors
- **State Management:** Context API
- **Styling:** Custom CSS with responsive design
- **Build Tool:** react-scripts (Create React App)

**Rationale:** React provides component reusability and excellent developer experience. Context API is sufficient for our authentication and state needs without adding Redux complexity.

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Authentication:** JWT (access + refresh tokens)
- **WebSocket:** ws library
- **Encryption:** bcrypt (passwords), crypto (bet data)
- **Validation:** Custom middleware
- **Rate Limiting:** express-rate-limit
- **Security:** Helmet, CORS

**Rationale:** Node.js provides excellent performance for I/O-heavy operations and real-time features. Express is battle-tested and has extensive middleware ecosystem.

### Database
- **RDBMS:** PostgreSQL 14
- **Driver:** node-postgres (pg)
- **Schema Management:** SQL migration files
- **Connection:** Connection pooling

**Rationale:** PostgreSQL offers ACID compliance, JSON support, and robust relational features needed for user data, bets, and groups.

### External Services
- **Sports Data:** API Sports (api-sports.io)
  - NFL data with paid plan (full season access)
  - Automatic fallback to mock data
  - 60-second refresh interval

**Rationale:** API Sports provides reliable, comprehensive NFL data. Fallback ensures platform works even during API outages.

## 📁 Project Structure

```
social-sports-betting-platform/
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── app.js             # Express app configuration
│   │   ├── index.js           # Server entry point
│   │   ├── websocket.js       # WebSocket server
│   │   ├── config/            # Configuration files
│   │   │   └── database.js    # DB connection & pooling
│   │   ├── controllers/       # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── betController.js
│   │   │   ├── groupController.js
│   │   │   └── scoreController.js
│   │   ├── database/          # Database setup & migrations
│   │   │   ├── setup.js       # DB initialization script
│   │   │   └── migrations/    # SQL migration files
│   │   ├── jobs/              # Background jobs
│   │   │   └── scoreUpdater.js # Automated score refresh
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.js        # JWT verification
│   │   │   ├── errorHandler.js
│   │   │   └── validators.js  # Input validation
│   │   ├── models/            # Data models
│   │   │   ├── Bet.js
│   │   │   ├── Group.js
│   │   │   ├── Message.js
│   │   │   ├── Score.js
│   │   │   └── User.js
│   │   ├── routes/            # API route definitions
│   │   │   ├── auth.js
│   │   │   ├── bets.js
│   │   │   ├── groups.js
│   │   │   └── scores.js
│   │   ├── services/          # Business logic
│   │   │   └── sportsApiService.js
│   │   └── utils/             # Helper functions
│   │       ├── encryption.js
│   │       └── jwt.js
│   ├── .env                   # Environment variables (not in git)
│   ├── .env.example           # Environment template
│   └── package.json           # Dependencies & scripts
│
├── frontend/                  # React frontend
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── src/
│   │   ├── App.js             # Main app component
│   │   ├── App.css            # Global styles
│   │   ├── index.js           # React entry point
│   │   ├── index.css          # Base CSS
│   │   ├── components/        # Reusable components
│   │   │   └── Navbar.js      # Navigation bar
│   │   ├── pages/             # Page components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── LiveScores.js
│   │   │   ├── Bets.js
│   │   │   └── Groups.js
│   │   └── services/          # API clients
│   │       ├── authService.js
│   │       └── apiClient.js
│   └── package.json           # Dependencies & scripts
│
├── README.md                  # Project documentation
├── PLANNING.md               # This file
└── package.json              # Workspace configuration
```

## 🔐 Security Architecture

### Authentication Flow
1. User submits credentials
2. Backend validates and generates JWT access token (15min) + refresh token (7d)
3. Access token stored in memory, refresh token in localStorage
4. All protected endpoints verify JWT via middleware
5. Expired access tokens refreshed using refresh token

### Data Protection
- **Passwords:** bcrypt with salt rounds
- **Bet Data:** AES-256 encryption for sensitive bet details
- **API Keys:** Environment variables only
- **CORS:** Restricted to frontend origin
- **Rate Limiting:** 100 requests per 15 minutes per IP

### Security Headers (Helmet)
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

## 🔄 Real-time Features

### WebSocket Implementation
- **Port:** 5001 (configurable)
- **Use Cases:**
  - Group chat messages
  - Live score updates
  - Bet result notifications (future)
- **Connection Management:**
  - User ID-based socket mapping
  - Automatic reconnection handling
  - Graceful cleanup on disconnect

### Background Jobs
- **Score Updater:**
  - Runs every 60 seconds
  - Fetches scores for all sports
  - Caches in PostgreSQL
  - Cleans up old scores (7+ days)

## 📊 Data Models

### Core Entities
1. **Users** - Authentication & profile
2. **Bets** - Encrypted bet records
3. **Groups** - Social betting groups
4. **Group Members** - User-group relationships
5. **Messages** - Group chat history
6. **Scores** - Cached game data
7. **Refresh Tokens** - JWT token management

### Key Relationships
- User → Bets (one-to-many)
- User ↔ Groups (many-to-many via group_members)
- Group → Messages (one-to-many)
- Scores: Independent cached data

## 🎨 Frontend Architecture

### Routing Strategy
- **Public Routes:** Login, Register
- **Protected Routes:** Dashboard, Scores, Bets, Groups
- **Route Guards:** Context-based authentication check
- **Redirect Logic:** Unauthenticated → Login, Authenticated → Dashboard

### State Management
- **AuthContext:** User authentication state
- **Local State:** Component-specific data
- **API Cache:** Axios response caching (future enhancement)

### Component Hierarchy
```
App (AuthContext Provider)
├── Router
│   ├── Navbar (if authenticated)
│   └── Routes
│       ├── Login
│       ├── Register
│       ├── Dashboard
│       │   ├── LiveGamesList
│       │   ├── RecentBetsList
│       │   └── QuickActions
│       ├── LiveScores
│       │   ├── FilterButtons
│       │   └── ScoreGrid
│       ├── Bets (placeholder)
│       └── Groups (placeholder)
```

## 🚀 Deployment Strategy

### Development
- Backend: `npm run dev` (nodemon on port 5000)
- Frontend: `npm start` (react-scripts on port 3000)
- Database: PostgreSQL on port 5433 (local)

### Production (Planned)
- **Backend:** Docker container → Cloud Run / Railway / Fly.io
- **Frontend:** Vercel / Netlify
- **Database:** Managed PostgreSQL (AWS RDS, Supabase, etc.)
- **Environment Variables:** Secure vault (not in code)

## 📈 Success Criteria

1. **Performance**
   - User creation < 2 seconds
   - API response time < 500ms (p95)
   - 95% uptime for live scores

2. **User Engagement**
   - 200+ active users within first month
   - 80% of sessions involve bet entry or chat

3. **Security**
   - Zero data breaches
   - All passwords encrypted
   - No API keys in code

4. **Code Quality**
   - >80% test coverage
   - No files >500 lines
   - All functions documented

## 🔮 Future Enhancements

### Phase 2 (Post-MVP)
- [ ] Complete bet creation/editing UI
- [ ] Real-time group chat with WebSocket
- [ ] User profile management
- [ ] Leaderboards & statistics
- [ ] Push notifications for bet results

### Phase 3
- [ ] Additional sports (NBA, MLB, NHL, Soccer)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Social features (friend requests, challenges)
- [ ] Payment integration for optional premium features

## 🐛 Known Limitations

1. **API Sports Free Tier:** Limited to 2-3 days of data (mitigated with paid plan)
2. **Mock Data Fallback:** Some sports use generated data (not real)
3. **WebSocket Scaling:** Current implementation doesn't support horizontal scaling
4. **No Email Verification:** Users can register with any email
5. **Basic Error Handling:** Some edge cases may not be fully covered

## 🔧 Configuration Management

### Environment Variables
All sensitive configuration via `.env`:
- Database credentials
- JWT secrets
- API keys
- Service ports
- Feature flags (e.g., `USE_REAL_API`)

### Configuration Files
- `backend/src/config/database.js` - DB connection pooling
- `backend/.env.example` - Template for environment setup
- `frontend/.env` - API URL configuration (future)

## 📝 Code Style & Conventions

### Backend (Node.js)
- **Style Guide:** Airbnb JavaScript Style Guide (relaxed)
- **Naming:**
  - Controllers: `{resource}Controller.js`
  - Models: PascalCase classes
  - Routes: kebab-case paths
- **Error Handling:** Try-catch with custom error middleware
- **Comments:** JSDoc for functions, inline for complex logic

### Frontend (React)
- **Naming:**
  - Components: PascalCase
  - Files: Match component name
  - CSS: Component-specific files
- **Hooks:** Consistent ordering (state, effects, callbacks)
- **Props:** Destructured at function signature
- **Comments:** Explain "why", not "what"

## 🧪 Testing Strategy

### Current State
- Manual testing via Postman/curl
- Database setup script with validation
- API health check endpoint

### Planned Testing
- **Unit Tests:** Jest for business logic (models, services)
- **Integration Tests:** Supertest for API endpoints
- **E2E Tests:** Cypress for user flows
- **Coverage Goal:** >80% for critical paths

## 📚 Documentation Standards

### Required Documentation
1. **README.md** - Setup, usage, commands
2. **PLANNING.md** - This document (architecture, decisions)
3. **TASK.md** - Active tasks and backlog
4. **API Docs** - Endpoint reference (future: Swagger/OpenAPI)
5. **Database Schema** - `backend/src/database/SCHEMA.md`

### Code Comments
- Every function should have a purpose comment
- Complex algorithms need step-by-step explanation
- TODOs must include date and reason

## 🔗 External Dependencies

### Critical Dependencies
- **express** - Web framework
- **pg** - PostgreSQL client
- **jsonwebtoken** - JWT handling
- **bcrypt** - Password hashing
- **axios** - HTTP client
- **ws** - WebSocket library
- **react** - Frontend framework
- **react-router-dom** - Routing

### Development Dependencies
- **nodemon** - Auto-restart server
- **jest** - Testing framework
- **eslint** - Linting

## 🎯 Current Development Focus

As of November 7, 2025:
- ✅ Backend API complete
- ✅ Database schema implemented
- ✅ API Sports integration (paid plan)
- ✅ Frontend authentication flow
- ✅ Live scores with filtering
- 🚧 Bet management UI (placeholder)
- 🚧 Group chat implementation (placeholder)
- 🚧 Unit test coverage
- 🚧 Docker deployment

---

**Last Updated:** November 7, 2025
**Maintained By:** Development Team
