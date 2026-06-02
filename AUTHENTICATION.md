# Dash-Snatch Authentication System

## Overview

The authentication system is the core security layer of Dash-Snatch, managing user identity, access control, and session management. It uses industry-standard JWT tokens with refresh token rotation for secure, stateless authentication.

## Authentication Flow

### 1. User Registration Flow

```
┌─────────────┐
│   User App  │
└──────┬──────┘
       │ POST /auth/register
       │ { email, username, password }
       ▼
┌──────────────────────┐
│  Validation Service  │
│ - Email format       │
│ - Username length    │
│ - Password strength  │
└──────┬───────────────┘
       │ Valid
       ▼
┌──────────────────────┐
│  Database Check      │
│ - Email exists?      │
│ - Username exists?   │
└──────┬───────────────┘
       │ Available
       ▼
┌──────────────────────┐
│  Hash Password       │
│  (bcrypt + salt)     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Create User Record  │
│  in Database         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Return Success      │
│  + Redirect to Login │
└──────────────────────┘
```

### 2. User Login Flow

```
┌─────────────┐
│   User App  │
└──────┬──────┘
       │ POST /auth/login
       │ { email, password }
       ▼
┌──────────────────────┐
│  Find User by Email  │
└──────┬───────────────┘
       │ User Found
       ▼
┌──────────────────────┐
│  Verify Password     │
│  (bcrypt compare)    │
└──────┬───────────────┘
       │ Password Valid
       ▼
┌──────────────────────┐
│  Generate JWT Token  │
│  (1 hour expiry)     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Generate Refresh    │
│  Token (7 days)      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Store Refresh Token │
│  in Database         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Return Tokens +     │
│  User Data           │
└──────────────────────┘
```

### 3. Token Refresh Flow

```
┌──────────────────┐
│   Frontend App   │
└────────┬─────────┘
         │ Access token expired
         │ Send: refresh_token
         ▼
┌──────────────────────┐
│  Validate Refresh    │
│  Token Signature     │
└──────┬───────────────┘
       │ Valid
       ▼
┌──────────────────────┐
│  Check Database      │
│  - Token exists?     │
│  - Hasn't expired?   │
│  - Revoked?          │
└──────┬───────────────┘
       │ Valid
       ▼
┌──────────────────────┐
│  Generate New        │
│  Access Token        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Return New Access   │
│  Token + Data        │
└──────────────────────┘
```

## API Endpoints

### POST `/api/v1/auth/register`

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "dashunter23",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "status": 201,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "dashunter23",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2026-06-02T15:45:00Z"
    }
  },
  "meta": {
    "timestamp": "2026-06-02T15:45:00Z"
  }
}
```

**Validation Rules:**
- Email: Valid email format, unique
- Username: 3-50 characters, alphanumeric + underscore, unique
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- firstName/lastName: 1-100 characters

**Error Responses:**
```json
// 400 Bad Request - Validation Failed
{
  "success": false,
  "status": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email already exists"],
      "password": ["Password must contain at least one special character"]
    }
  }
}

// 409 Conflict - Username/Email exists
{
  "success": false,
  "status": 409,
  "error": {
    "code": "USER_EXISTS",
    "message": "Email or username already registered"
  }
}
```

---

### POST `/api/v1/auth/login`

Authenticate user and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "dashunter23",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": null
    }
  },
  "meta": {
    "timestamp": "2026-06-02T15:45:00Z",
    "expiresIn": 3600
  }
}
```

**Error Responses:**
```json
// 401 Unauthorized - Invalid credentials
{
  "success": false,
  "status": 401,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}

// 404 Not Found - User doesn't exist
{
  "success": false,
  "status": 404,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

---

### POST `/api/v1/auth/refresh`

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "meta": {
    "timestamp": "2026-06-02T15:45:00Z",
    "expiresIn": 3600
  }
}
```

**Error Responses:**
```json
// 401 Unauthorized - Invalid token
{
  "success": false,
  "status": 401,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Refresh token is invalid or expired"
  }
}
```

---

### GET `/api/v1/auth/me`

Get current authenticated user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "dashunter23",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": "https://cdn.example.com/avatars/...",
      "bio": "Hunting for Dash!",
      "createdAt": "2026-06-02T15:45:00Z"
    }
  }
}
```

---

### POST `/api/v1/auth/logout`

Logout user and invalidate refresh token.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### POST `/api/v1/auth/change-password`

Change user password.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "Password changed successfully"
  }
}
```

---

## JWT Token Structure

### Access Token
```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "dashunter23",
  "iat": 1677840000,
  "exp": 1677843600,
  "type": "access"
}

Signature: HMAC-SHA256(header + payload + secret)
```

**Expiration:** 1 hour (3600 seconds)

### Refresh Token
```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1677840000,
  "exp": 1678444800,
  "type": "refresh"
}

Signature: HMAC-SHA256(header + payload + secret)
```

**Expiration:** 7 days (604800 seconds)

---

## Implementation Guide

### Backend (Node.js + Express)

```typescript
// src/services/authService.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const pool = new Pool();
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

export class AuthService {
  // Register new user
  async register(email: string, username: string, password: string) {
    // Validate inputs
    this.validateEmail(email);
    this.validateUsername(username);
    this.validatePassword(password);

    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existing.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, created_at`,
      [email, username, hashedPassword]
    );

    return result.rows[0];
  }

  // Login user
  async login(email: string, password: string) {
    // Find user
    const result = await pool.query(
      'SELECT id, email, username, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token
    await pool.query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    };
  }

  // Generate access token
  private generateAccessToken(userId: string): string {
    return jwt.sign(
      { sub: userId, type: 'access' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  // Generate refresh token
  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { sub: userId, type: 'refresh' },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Refresh access token
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
      
      // Check if token exists in DB
      const result = await pool.query(
        `SELECT id FROM sessions 
         WHERE refresh_token = $1 AND expires_at > NOW()`,
        [refreshToken]
      );

      if (result.rows.length === 0) {
        throw new Error('Token not found or expired');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(decoded.sub);
      const newRefreshToken = this.generateRefreshToken(decoded.sub);

      // Update refresh token
      await pool.query(
        `UPDATE sessions SET refresh_token = $1, expires_at = $2 
         WHERE refresh_token = $3`,
        [newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), refreshToken]
      );

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Validate password strength
  private validatePassword(password: string) {
    if (password.length < 8) throw new Error('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) throw new Error('Password must contain uppercase');
    if (!/[a-z]/.test(password)) throw new Error('Password must contain lowercase');
    if (!/[0-9]/.test(password)) throw new Error('Password must contain number');
    if (!/[!@#$%^&*]/.test(password)) throw new Error('Password must contain special char');
  }

  private validateEmail(email: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) throw new Error('Invalid email format');
  }

  private validateUsername(username: string) {
    if (username.length < 3 || username.length > 50) {
      throw new Error('Username must be 3-50 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }
  }
}
```

---

### Frontend (React Native)

```typescript
// src/services/authService.ts
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.API_URL,
      timeout: 10000
    });

    // Add request interceptor to include token
    this.api.interceptors.request.use(async (config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.refreshToken) {
          try {
            await this.refreshAccessToken();
            return this.api.request(error.config);
          } catch (refreshError) {
            this.logout();
            throw refreshError;
          }
        }
        throw error;
      }
    );
  }

  // Register
  async register(email: string, username: string, password: string) {
    try {
      const response = await this.api.post('/auth/register', {
        email,
        username,
        password
      });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Login
  async login(email: string, password: string) {
    try {
      const response = await this.api.post('/auth/login', {
        email,
        password
      });

      const { accessToken, refreshToken, user } = response.data.data;

      // Store tokens
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      await this.persistTokens(accessToken, refreshToken);

      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Refresh access token
  private async refreshAccessToken() {
    const response = await this.api.post('/auth/refresh', {
      refreshToken: this.refreshToken
    });

    const { accessToken, refreshToken } = response.data.data;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    await this.persistTokens(accessToken, refreshToken);
  }

  // Logout
  async logout() {
    try {
      await this.api.post('/auth/logout', {
        refreshToken: this.refreshToken
      });
    } finally {
      this.accessToken = null;
      this.refreshToken = null;
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await this.api.get('/auth/me');
      return response.data.data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Restore session from storage
  async restoreSession() {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Persist tokens
  private async persistTokens(accessToken: string, refreshToken: string) {
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
  }

  // Handle API errors
  private handleError(error: any) {
    if (error.response) {
      const { status, data } = error.response;
      return {
        status,
        message: data.error?.message || 'An error occurred',
        code: data.error?.code,
        details: data.error?.details
      };
    }
    return {
      status: 500,
      message: 'Network error'
    };
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

export default new AuthService();
```

---

### Redux Setup

```typescript
// src/store/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../services/authService';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: { email: string; username: string; password: string }) => {
    return await authService.register(credentials.email, credentials.username, credentials.password);
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    return await authService.login(credentials.email, credentials.password);
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Registration failed';
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  }
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
```

---

## Security Best Practices

1. **Password Storage**
   - Always hash passwords with bcrypt (min 10 rounds)
   - Never store plain passwords
   - Never log passwords

2. **Token Security**
   - Use HTTPS only (never HTTP)
   - Store refresh tokens in secure, httpOnly cookies on backend
   - Keep JWT secrets in environment variables
   - Rotate secrets periodically

3. **Token Expiration**
   - Access token: 1 hour expiry
   - Refresh token: 7 days expiry
   - Implement token rotation on refresh

4. **Rate Limiting**
   - Limit login attempts: 5 per minute per IP
   - Limit register attempts: 3 per hour per IP
   - Implement CAPTCHA for repeated failures

5. **Session Management**
   - Invalidate all sessions on password change
   - Invalidate refresh token on logout
   - Log all login/logout events
   - Monitor suspicious activity

6. **Data Protection**
   - Validate all inputs
   - Sanitize outputs
   - Use parameterized queries
   - Implement CORS properly

---

## Testing

### Unit Tests for Auth Service

```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user', async () => {
      const result = await authService.register(
        'test@example.com',
        'testuser',
        'Password123!'
      );
      expect(result.id).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should reject weak passwords', async () => {
      await expect(
        authService.register('test@example.com', 'testuser', 'weak')
      ).rejects.toThrow();
    });

    it('should reject duplicate email', async () => {
      await authService.register('test@example.com', 'user1', 'Password123!');
      await expect(
        authService.register('test@example.com', 'user2', 'Password123!')
      ).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      await authService.register('test@example.com', 'testuser', 'Password123!');
      const result = await authService.login('test@example.com', 'Password123!');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await authService.register('test@example.com', 'testuser', 'Password123!');
      await expect(
        authService.login('test@example.com', 'WrongPassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

---

## Monitoring & Logging

- Log all authentication attempts (success/failure)
- Monitor failed login attempts per IP
- Alert on suspicious activity (multiple failed attempts, unusual locations)
- Track token refresh frequency
- Monitor password change events
