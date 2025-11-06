# Social Sports Betting Platform

A social platform for managing, tracking, and discussing sports betting activities without handling real bets. This platform provides a safe environment for users to engage with friends over sports betting without financial risks, focusing on community and entertainment value.

## Project Goal

Build a social platform that allows users to:
- Track and manage simulated sports bets
- Join groups and chat with friends
- View live sports scores and updates
- Engage in friendly competition without financial risk

## Success Criteria

1. At least 200 active users within the first month
2. 95% uptime for live scores page
3. 80% of user sessions involve bet entry or chat usage
4. Zero data breaches
5. User creation time < 2 seconds

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

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/BellagioN8/social-sports-betting-platform.git
cd social-sports-betting-platform
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
# Create .env files in both frontend and backend directories
# See .env.example for required variables
```

4. Set up the database:
```bash
# Run database migrations (instructions coming soon)
```

### Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:5000
```

### Testing

Run all tests:
```bash
npm test
```

Run specific test suites:
```bash
npm run test:backend   # Backend unit tests
npm run test:frontend  # Frontend unit tests
npm run test:e2e       # End-to-end tests with Cypress
```

### Linting

Run linters:
```bash
npm run lint
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
