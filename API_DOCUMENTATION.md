# Dash-Snatch API Documentation

## Overview

Complete API reference for Dash-Snatch backend services. All endpoints follow REST conventions and return JSON responses.

**Base URL:** `https://api.dash-snatch.com/api/v1`

**Authentication:** JWT Bearer Token in Authorization header

---

## Response Format

### Success Response

```json
{
  "success": true,
  "status": 200,
  "data": {
    // Response payload
  },
  "meta": {
    "timestamp": "2026-06-02T15:45:00Z",
    "version": "1.0"
  }
}
```

### Error Response

```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": ["error message"]
    }
  },
  "meta": {
    "timestamp": "2026-06-02T15:45:00Z",
    "version": "1.0"
  }
}
```

---

## Authentication Endpoints

### POST /auth/register

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "dashunter23",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "dashunter23",
      "createdAt": "2026-06-02T15:45:00Z"
    }
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` (400) - Invalid input
- `USER_EXISTS` (409) - Email or username already exists

---

### POST /auth/login

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "dashunter23"
    }
  },
  "meta": {
    "expiresIn": 3600
  }
}
```

**Error Codes:**
- `INVALID_CREDENTIALS` (401) - Wrong email or password
- `USER_NOT_FOUND` (404) - User doesn't exist

---

### POST /auth/refresh

Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### GET /auth/me

Get current authenticated user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "dashunter23",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": null,
      "bio": null
    }
  }
}
```

---

### POST /auth/logout

Logout and invalidate refresh token.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Photo Endpoints

### POST /photos/upload

Upload and validate a photo.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Form Data:**
- `photo` (file, required) - JPEG/PNG, max 50MB
- `locationLat` (number, optional) - GPS latitude
- `locationLng` (number, optional) - GPS longitude
- `locationName` (string, optional) - Location description
- `locationPrivacy` (string, optional) - "public" | "friends" | "private"

**Response (202 Accepted):**
```json
{
  "success": true,
  "status": 202,
  "data": {
    "photo": {
      "id": "uuid",
      "userId": "uuid",
      "uploadedAt": "2026-06-02T15:45:00Z",
      "isValid": null,
      "status": "processing"
    }
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` (400) - Invalid input
- `FILE_TOO_LARGE` (413) - File exceeds size limit
- `INVALID_FILE_TYPE` (415) - Unsupported file format

---

### GET /photos/:photoId

Get photo details.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "photo": {
      "id": "uuid",
      "userId": "uuid",
      "originalUrl": "https://cdn.example.com/...",
      "thumbnailUrl": "https://cdn.example.com/...",
      "uploadedAt": "2026-06-02T15:45:00Z",
      "isValid": true,
      "confidenceScore": 0.92,
      "rank": "rare",
      "xpAwarded": 50,
      "locationLat": 40.7128,
      "locationLng": -74.0060,
      "locationName": "Central Park",
      "locationPrivacy": "public"
    }
  }
}
```

---

### GET /photos/user/:userId

Get user's photos with pagination.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `sortBy` (string) - "recent" | "rank" | "xp"

**Response (200):**
```json
{
  "success": true,
  "data": {
    "photos": [
      { /* photo objects */ }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

### DELETE /photos/:photoId

Delete a photo.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Photo deleted successfully"
  }
}
```

---

## Location Endpoints

### POST /locations/tag

Tag a location for a photo.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "photoId": "uuid",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "locationName": "Central Park",
  "privacy": "public"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "location": {
      "id": "uuid",
      "coordinate": [40.7128, -74.0060],
      "locationName": "Central Park",
      "photoCount": 1,
      "lastSighting": "2026-06-02T15:45:00Z"
    }
  }
}
```

---

### GET /locations/nearby

Find nearby locations.

**Query Parameters:**
- `latitude` (number, required)
- `longitude` (number, required)
- `radius` (number, default: 1000) - meters
- `limit` (number, default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "id": "uuid",
        "coordinate": [40.7128, -74.0060],
        "locationName": "Central Park",
        "photoCount": 45,
        "distance": 234,
        "lastSighting": "2026-06-02T15:45:00Z"
      }
    ]
  }
}
```

---

### GET /locations/heatmap

Get heatmap data for map visualization.

**Query Parameters:**
- `bounds` (string) - "minLat,minLng,maxLat,maxLng"
- `zoom` (number, default: 12)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "heatmapPoints": [
      {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "intensity": 45,
        "rank": "hot"
      }
    ]
  }
}
```

---

### GET /locations/leaderboard

Get top locations by photos.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `sortBy` (string) - "photos" | "recent" | "quality"

**Response (200):**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "rank": 1,
        "locationName": "Central Park",
        "photoCount": 156,
        "averageRank": "rare",
        "lastSighting": "2026-06-02T15:45:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 342
    }
  }
}
```

---

## User Endpoints

### GET /users/:userId

Get user profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "dashunter23",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": "https://cdn.example.com/...",
      "bio": "Hunting for Dash!",
      "createdAt": "2026-06-02T15:45:00Z"
    }
  }
}
```

---

### PATCH /users/:userId

Update user profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Hunting for Dash!",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "dashunter23",
      "firstName": "John",
      "lastName": "Doe",
      "bio": "Hunting for Dash!"
    }
  }
}
```

---

### GET /users/:userId/stats

Get user statistics and achievements.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalXP": 4150,
      "rankLevel": 4,
      "totalPhotos": 42,
      "validPhotos": 36,
      "legendaryCount": 0,
      "epicCount": 2,
      "rareCount": 8,
      "uncommonCount": 15,
      "commonCount": 11
    },
    "achievements": [
      {
        "id": "uuid",
        "type": "first_photo",
        "title": "First Shot",
        "unlockedAt": "2026-06-02T15:45:00Z"
      }
    ]
  }
}
```

---

## Leaderboard Endpoints

### GET /leaderboard/global

Get global XP leaderboard.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 100)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "username": "dashunter23",
        "avatarUrl": "https://cdn.example.com/...",
        "totalXP": 5250,
        "rankLevel": 5,
        "photoCount": 78
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 1250
    },
    "userRank": {
      "rank": 47,
      "totalXP": 4150
    }
  }
}
```

---

### GET /leaderboard/monthly

Get monthly leaderboard (resets monthly).

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 100)
- `month` (string, optional) - "YYYY-MM", defaults to current

**Response (200):** Same as global leaderboard

---

### GET /leaderboard/locations

Get locations leaderboard.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 100)
- `sortBy` (string) - "photos" | "recent" | "quality"

**Response (200):** Location ranking data

---

## Error Handling

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

### Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1677843600
```

**Limits:**
- Standard endpoint: 100 requests/minute
- Photo upload: 10 requests/minute
- Leaderboard: 20 requests/minute
- Auth endpoints: 5 requests/minute

---

## Webhooks (Future)

Webhooks for real-time events:

- `photo.validated` - Photo validation complete
- `user.ranked_up` - User reached new rank
- `achievement.unlocked` - User unlocked achievement
- `location.milestone` - Location reached milestone

---

## Testing the API

### Using cURL

```bash
# Register
curl -X POST https://api.dash-snatch.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123!"
  }'

# Login
curl -X POST https://api.dash-snatch.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# Get current user
curl -X GET https://api.dash-snatch.com/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import the Postman collection: `postman_collection.json`
2. Set environment variable: `api_url = https://api.dash-snatch.com/api/v1`
3. Run requests from the collection

### Using Thunder Client

1. Import: `thunder-collection.json`
2. Set base URL in environment
3. Execute requests

---

## API Versioning

Current version: **v1**

- Breaking changes will increment major version
- New endpoints are backward compatible
- Deprecated endpoints will be marked 3 versions before removal
- Version sunset timeline: 12 months

---

## SDK/Client Libraries

Official client libraries:

- **JavaScript/TypeScript:** `@dash-snatch/client`
- **Python:** `dash-snatch-py`
- **Dart:** `dash_snatch_flutter`

Install:
```bash
npm install @dash-snatch/client
```

Usage:
```typescript
import { DashSnatchClient } from '@dash-snatch/client';

const client = new DashSnatchClient({
  baseURL: 'https://api.dash-snatch.com/api/v1'
});

const user = await client.auth.login({
  email: 'user@example.com',
  password: 'password'
});
```
