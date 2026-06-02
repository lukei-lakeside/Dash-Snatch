# Dash-Snatch Testing Guide

## Overview

Comprehensive testing strategy for Dash-Snatch across all layers (unit, integration, E2E).

---

## Testing Stack

### Backend Testing
- **Test Framework:** Jest
- **Assertion Library:** Jest (built-in)
- **API Testing:** Supertest
- **Database Testing:** Jest with test database
- **Code Coverage:** Istanbul/nyc
- **Mocking:** Jest mocks, Sinon

### Frontend Testing
- **Test Framework:** Jest
- **Component Testing:** React Native Testing Library
- **E2E Testing:** Detox (mobile) or Cypress (web)
- **Snapshot Testing:** Jest snapshots
- **Code Coverage:** Istanbul/nyc

### Load Testing
- **Tool:** Artillery or k6
- **Target:** API endpoints under concurrent load

---

## Unit Tests

### Backend Unit Tests

**Location:** `backend/src/__tests__/unit/`

#### Auth Service Tests

```typescript
// src/__tests__/unit/services/authService.test.ts
import { AuthService } from '../../../services/authService';
import { Pool } from 'pg';

jest.mock('pg');

describe('AuthService', () => {
  let authService: AuthService;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    mockPool = new Pool() as jest.Mocked<Pool>;
    authService = new AuthService(mockPool);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [] }); // Check if exists
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'uuid-123',
          email: userData.email,
          username: userData.username
        }]
      });

      const result = await authService.register(
        userData.email,
        userData.username,
        userData.password
      );

      expect(result.email).toBe(userData.email);
      expect(result.id).toBeDefined();
    });

    it('should reject weak passwords', async () => {
      await expect(
        authService.register('test@example.com', 'testuser', 'weak')
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should reject duplicate email', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'existing-user-id' }]
      });

      await expect(
        authService.register('existing@example.com', 'newuser', 'SecurePass123!')
      ).rejects.toThrow('User already exists');
    });

    it('should validate email format', async () => {
      await expect(
        authService.register('invalid-email', 'testuser', 'SecurePass123!')
      ).rejects.toThrow('Invalid email format');
    });

    it('should validate username length', async () => {
      await expect(
        authService.register('test@example.com', 'ab', 'SecurePass123!')
      ).rejects.toThrow('Username must be 3-50 characters');
    });

    it('should hash password before storing', async () => {
      const hashSpy = jest.spyOn(require('bcrypt'), 'hash');
      
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'uuid' }] });

      await authService.register('test@example.com', 'testuser', 'SecurePass123!');

      expect(hashSpy).toHaveBeenCalledWith('SecurePass123!', 10);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const hashedPassword = await require('bcrypt').hash('SecurePass123!', 10);
      
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'uuid-123',
          email: 'test@example.com',
          username: 'testuser',
          password_hash: hashedPassword
        }]
      });

      const result = await authService.login('test@example.com', 'SecurePass123!');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should reject invalid password', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'uuid-123',
          email: 'test@example.com',
          username: 'testuser',
          password_hash: 'wrong-hash'
        }]
      });

      await expect(
        authService.login('test@example.com', 'WrongPassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should return 404 for non-existent user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        authService.login('nonexistent@example.com', 'SecurePass123!')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens', async () => {
      const refreshToken = 'valid-refresh-token';
      
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'session-id' }]
      });

      const result = await authService.refreshToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject expired refresh token', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        authService.refreshToken('expired-token')
      ).rejects.toThrow('Token not found or expired');
    });
  });
});
```

#### Photo Service Tests

```typescript
// src/__tests__/unit/services/photoService.test.ts
describe('PhotoService', () => {
  describe('uploadPhoto', () => {
    it('should create photo record and queue for validation', async () => {
      // Test implementation
    });

    it('should reject files larger than 50MB', async () => {
      // Test implementation
    });

    it('should validate file type (JPEG/PNG only)', async () => {
      // Test implementation
    });

    it('should extract EXIF metadata', async () => {
      // Test implementation
    });
  });

  describe('getPhoto', () => {
    it('should return photo with all metadata', async () => {
      // Test implementation
    });

    it('should return 404 for non-existent photo', async () => {
      // Test implementation
    });
  });
});
```

#### XP Service Tests

```typescript
// src/__tests__/unit/services/xpService.test.ts
describe('XPService', () => {
  describe('calculateRank', () => {
    it('should assign correct rank based on confidence', () => {
      const tests = [
        { confidence: 0.95, expected: 'rare' },
        { confidence: 0.85, expected: 'uncommon' },
        { confidence: 0.75, expected: 'common' },
        { confidence: 0.65, expected: null } // Needs review
      ];

      tests.forEach(({ confidence, expected }) => {
        const rank = xpService.calculateRank(confidence);
        expect(rank).toBe(expected);
      });
    });

    it('should calculate correct XP for each rank', () => {
      const tests = [
        { rank: 'common', expected: 10 },
        { rank: 'uncommon', expected: 25 },
        { rank: 'rare', expected: 50 },
        { rank: 'epic', expected: 100 },
        { rank: 'legendary', expected: 250 }
      ];

      tests.forEach(({ rank, expected }) => {
        const xp = xpService.getXPReward(rank);
        expect(xp).toBe(expected);
      });
    });
  });

  describe('updateUserRank', () => {
    it('should update user rank when XP threshold reached', async () => {
      // User at 900 XP (Level 4), earns 100 XP
      const result = await xpService.updateUserRank('user-id', 100);
      
      expect(result.newLevel).toBe(5);
      expect(result.totalXP).toBe(1000);
      expect(result.rankChanged).toBe(true);
    });

    it('should not update rank if threshold not reached', async () => {
      // User at 950 XP (Level 4), earns 25 XP
      const result = await xpService.updateUserRank('user-id', 25);
      
      expect(result.newLevel).toBe(4);
      expect(result.totalXP).toBe(975);
      expect(result.rankChanged).toBe(false);
    });
  });
});
```

---

## Integration Tests

### Backend Integration Tests

**Location:** `backend/src/__tests__/integration/`

#### Authentication Flow

```typescript
// src/__tests__/integration/auth.integration.test.ts
import request from 'supertest';
import app from '../../../app';
import { Pool } from 'pg';

describe('Authentication Flow (Integration)', () => {
  let pool: Pool;
  let userId: string;

  beforeAll(async () => {
    pool = new Pool({ database: process.env.TEST_DATABASE });
    // Setup test database
  });

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM users');
  });

  it('should complete full auth flow: register → login → refresh → logout', async () => {
    // Step 1: Register
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User'
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.user.email).toBe('test@example.com');

    // Step 2: Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();
    expect(loginRes.body.data.refreshToken).toBeDefined();

    const { accessToken, refreshToken } = loginRes.body.data;

    // Step 3: Get current user with access token
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('test@example.com');

    // Step 4: Refresh token
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();

    // Step 5: Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);

    // Verify token is invalidated
    const invalidRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(invalidRes.status).toBe(401);
  });

  it('should handle concurrent login requests', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!'
      });

    const loginPromises = Array(5).fill(null).map(() =>
      request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        })
    );

    const results = await Promise.all(loginPromises);

    results.forEach(res => {
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });
});
```

#### Photo Upload Flow

```typescript
// src/__tests__/integration/photos.integration.test.ts
describe('Photo Upload Flow (Integration)', () => {
  it('should upload photo, trigger validation, and update XP', async () => {
    // Setup: Login user
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'SecurePass123!' });

    const accessToken = loginRes.body.data.accessToken;

    // Upload photo
    const uploadRes = await request(app)
      .post('/api/v1/photos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('locationLat', '40.7128')
      .field('locationLng', '-74.0060')
      .field('locationName', 'Central Park')
      .field('locationPrivacy', 'public')
      .attach('photo', './test-assets/dash-photo.jpg');

    expect(uploadRes.status).toBe(202);
    const photoId = uploadRes.body.data.photo.id;

    // Wait for validation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check photo validation status
    const photoRes = await request(app)
      .get(`/api/v1/photos/${photoId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(photoRes.status).toBe(200);
    expect(photoRes.body.data.photo.isValid).toBe(true);
    expect(photoRes.body.data.photo.rank).toBeDefined();
    expect(photoRes.body.data.photo.xpAwarded).toBeGreaterThan(0);

    // Verify user XP was updated
    const userRes = await request(app)
      .get('/api/v1/users/test-user-id/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(userRes.body.data.stats.totalXP).toBeGreaterThan(0);
  });
});
```

---

## Frontend Tests

### Component Tests

```typescript
// src/__tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../../../components/Button';

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Click</Button>);
    
    fireEvent.press(screen.getByText('Click'));
    expect(onPress).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    render(
      <Button disabled onPress={onPress}>
        Click
      </Button>
    );
    
    fireEvent.press(screen.getByText('Click'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(<Button loading>Loading...</Button>);
    expect(screen.getByTestId('button-spinner')).toBeTruthy();
  });

  it('should apply correct variant styles', () => {
    const { getByText } = render(
      <Button variant="primary">Primary</Button>
    );
    
    expect(getByText('Primary')).toHaveStyle({ backgroundColor: '#6366F1' });
  });
});
```

### Authentication Flow Tests

```typescript
// src/__tests__/flows/authFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthStack } from '../../../navigation/AuthStack';

describe('Authentication Flow (E2E)', () => {
  it('should complete registration and login flow', async () => {
    render(<AuthStack />);

    // Should show login screen initially
    expect(screen.getByText('Login')).toBeTruthy();

    // Navigate to register
    fireEvent.press(screen.getByText('Create Account'));
    expect(screen.getByPlaceholderText('Enter email')).toBeTruthy();

    // Fill registration form
    fireEvent.changeText(
      screen.getByPlaceholderText('Enter email'),
      'test@example.com'
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Choose username'),
      'testuser'
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Enter password'),
      'SecurePass123!'
    );

    // Submit
    fireEvent.press(screen.getByText('Sign Up'));

    // Wait for API response
    await waitFor(() => {
      expect(screen.getByText('Account created!')).toBeTruthy();
    });

    // Should redirect to login
    fireEvent.press(screen.getByText('Continue to Login'));

    // Login
    fireEvent.changeText(
      screen.getByPlaceholderText('Email'),
      'test@example.com'
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Password'),
      'SecurePass123!'
    );
    fireEvent.press(screen.getByText('Login'));

    // Wait for navigation to home
    await waitFor(() => {
      expect(screen.getByText('Camera')).toBeTruthy();
    });
  });
});
```

---

## Test Coverage

### Coverage Targets

```
Statements   : 80%+
Branches     : 75%+
Functions    : 80%+
Lines        : 80%+
```

### Running Tests with Coverage

```bash
# Backend
npm run test:backend -- --coverage

# Frontend
npm run test:frontend -- --coverage

# Combined
npm run test:coverage
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: dash_snatch_test
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm run test:ci
        env:
          TEST_DATABASE_URL: postgres://postgres:password@localhost:5432/dash_snatch_test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Build
        run: npm run build
```

---

## Manual Testing Checklist

### Authentication
- [ ] Register new account
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error shown)
- [ ] Logout
- [ ] Refresh token
- [ ] Session persistence on app restart

### Photo Capture
- [ ] Open camera
- [ ] Capture photo
- [ ] Preview photo
- [ ] Gallery picker
- [ ] Permission prompts
- [ ] Upload with location tag
- [ ] View uploaded photo

### Leaderboards
- [ ] Global leaderboard loads
- [ ] Monthly leaderboard loads
- [ ] User rank highlighted
- [ ] Leaderboard sorting works
- [ ] Pagination works

### Map
- [ ] Map loads
- [ ] Heatmap displays correctly
- [ ] Can zoom in/out
- [ ] Location pins shown
- [ ] Tap location shows info

### Profile
- [ ] Profile loads
- [ ] Stats display correctly
- [ ] Achievement badges shown
- [ ] Photo history displays
- [ ] Edit profile works

---

## Performance Testing

### Load Testing Configuration

```yaml
# artillery-load-test.yml
config:
  target: "https://api.dash-snatch.com/api/v1"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Spike"

scenarios:
  - name: "Leaderboard Load"
    flow:
      - get:
          url: "/leaderboard/global?page=1&limit=100"
      - think: 3
      - get:
          url: "/leaderboard/monthly?page=1&limit=100"

  - name: "Photo Upload Flow"
    flow:
      - post:
          url: "/photos/upload"
          formData:
            photo: "@test-photo.jpg"
```

Run:
```bash
artillery run artillery-load-test.yml
```

---

## Debugging Tests

### VS Code Debug Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-coverage"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## Testing Best Practices

1. **Isolation:** Each test should be independent
2. **Clarity:** Use descriptive test names
3. **AAA Pattern:** Arrange, Act, Assert
4. **Mocking:** Mock external services
5. **Fixtures:** Use test data factories
6. **Cleanup:** Clean up after each test
7. **Determinism:** Tests should be repeatable
8. **Speed:** Unit tests < 100ms, integration < 1s
