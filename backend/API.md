# Authentication API Documentation

Base URL: `http://localhost:5000/api/auth`

## Endpoints

### Public Endpoints

#### POST /register
Register a new user account.

**Request Body:**
```json
{
  "username": "string (required, 3-50 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars, must include uppercase, lowercase, number, special char)",
  "display_name": "string (optional, max 100 chars)",
  "bio": "string (optional)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "display_name": "string",
      "avatar_url": "string | null",
      "bio": "string | null",
      "is_active": true,
      "is_verified": false,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    },
    "accessToken": "string (JWT, expires in 15m)",
    "refreshToken": "string (expires in 7d)"
  },
  "meta": {
    "registrationTime": "123ms"
  }
}
```

**Error Responses:**
- 400: Validation errors
- 409: Email or username already exists
- 429: Too many requests (5 per minute)

---

#### POST /login
Login with email/username and password.

**Request Body:**
```json
{
  "email": "string (required if username not provided)",
  "username": "string (required if email not provided)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "accessToken": "string (JWT, expires in 15m)",
    "refreshToken": "string (expires in 7d)"
  }
}
```

**Error Responses:**
- 400: Validation errors
- 401: Invalid credentials
- 403: Account deactivated
- 429: Too many requests (10 per minute)

---

#### POST /refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "string (new JWT)",
    "user": { /* user object */ }
  }
}
```

**Error Responses:**
- 400: Missing refresh token
- 401: Invalid or expired refresh token
- 429: Too many requests (20 per minute)

---

#### POST /logout
Logout and revoke refresh token.

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Protected Endpoints
All protected endpoints require an `Authorization` header with a Bearer token:
```
Authorization: Bearer <access_token>
```

#### GET /me
Get current user profile with statistics.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "display_name": "string",
    "avatar_url": "string | null",
    "bio": "string | null",
    "is_active": true,
    "is_verified": boolean,
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "last_login_at": "timestamp",
    "stats": {
      "total_bets": number,
      "bets_won": number,
      "bets_lost": number,
      "groups_joined": number,
      "win_percentage": number
    }
  }
}
```

**Error Responses:**
- 401: Not authenticated or invalid token
- 404: User not found

---

#### PATCH /me
Update user profile.

**Request Body:**
```json
{
  "display_name": "string (optional, max 100 chars)",
  "bio": "string (optional)",
  "avatar_url": "string (optional, max 500 chars)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user object */ }
}
```

**Error Responses:**
- 401: Not authenticated
- 400: Validation errors

---

#### POST /logout-all
Logout from all sessions (revoke all refresh tokens).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all sessions"
}
```

**Error Responses:**
- 401: Not authenticated

---

#### GET /sessions
Get all active sessions for current user.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "expires_at": "timestamp",
        "created_at": "timestamp",
        "device_info": "string",
        "is_revoked": false
      }
    ],
    "count": number
  }
}
```

**Error Responses:**
- 401: Not authenticated

---

#### POST /verify-email
Verify user email (simplified version).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Responses:**
- 401: Not authenticated

---

## Authentication Flow

### Registration Flow
1. User submits registration form
2. Server validates input (username, email, password strength)
3. Server checks for existing email/username
4. Server hashes password with bcrypt
5. Server creates user in database
6. Server generates JWT access token (15m expiry)
7. Server generates refresh token (7d expiry)
8. Server stores hashed refresh token in database
9. Server returns user object and both tokens

**Performance:** User creation must complete in under 2 seconds (success criteria).

### Login Flow
1. User submits email/username and password
2. Server finds user by credential
3. Server verifies password with bcrypt
4. Server generates new access and refresh tokens
5. Server stores refresh token in database
6. Server updates last_login_at timestamp
7. Server returns user object and both tokens

### Token Refresh Flow
1. Client sends expired/expiring access token with valid refresh token
2. Server verifies refresh token signature
3. Server checks if refresh token is revoked or expired in database
4. Server generates new access token
5. Server returns new access token (refresh token remains valid)

### Logout Flow
1. Client sends refresh token to logout endpoint
2. Server marks refresh token as revoked in database
3. Access token becomes invalid when it expires (15m max)

## Security Features

- **Password Hashing:** bcrypt with 10 salt rounds
- **JWT Tokens:** Signed with secret keys
- **Refresh Token Storage:** Hashed in database (SHA-256)
- **Rate Limiting:** Prevents brute force attacks
- **CORS:** Configured for specific origins
- **Helmet:** Security headers
- **Input Validation:** Email, username, password strength
- **Input Sanitization:** Whitespace trimming

## Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "errors": {
    "field": ["error1", "error2"]
  }
}
```

## Rate Limits

- Global: 100 requests per 15 minutes per IP
- Registration: 5 requests per minute
- Login: 10 requests per minute
- Token refresh: 20 requests per minute

## Environment Variables

Required variables in `.env`:

```env
# Server
NODE_ENV=development
PORT=5000
HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=social_sports_betting
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
