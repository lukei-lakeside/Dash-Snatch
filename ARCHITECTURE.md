# Dash-Snatch System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DASH-SNATCH ECOSYSTEM                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   MOBILE APP     │  React Native / Flutter
│  (iOS/Android)   │  - Photo Capture
│                  │  - Map Visualization
│                  │  - User Dashboard
└────────┬─────────┘
         │ HTTPS / WebSocket
         ▼
┌──────────────────────────────────────────────────┐
│           API GATEWAY / LOAD BALANCER             │
│  (AWS ALB / Nginx / CloudFlare)                   │
└────────┬─────────────────────────────────────────┘
         │
    ┌────┴────┬────────────────┬─────────────────┐
    ▼         ▼                ▼                 ▼
┌────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐
│ Auth   │ │ Photo    │ │ Location   │ │ Leaderboard  │
│Service │ │Service   │ │Service     │ │& Stats       │
└────────┘ └──────────┘ └────────────┘ └──────────────┘
    │         │              │               │
    └─────────┴──────┬───────┴───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   IMAGE RECOGNITION        │
        │   SERVICE                  │
        │ - TensorFlow Model         │
        │ - ML Pipeline              │
        │ - Confidence Scoring       │
        └────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   PRIMARY DATABASE         │
        │   (PostgreSQL)             │
        │ - Users                    │
        │ - Photos                   │
        │ - Locations                │
        │ - XP/Rankings              │
        └────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    ▼                ▼                ▼
┌─────────┐   ┌─────────────┐   ┌─────────┐
│ Redis   │   │ Search      │   │ File    │
│ Cache   │   │ Engine      │   │ Storage │
│         │   │ (Algolia)   │   │ (S3)    │
└─────────┘   └─────────────┘   └─────────┘
```

## Backend Services Architecture

### 1. Authentication Service
**Responsibility:** User identity management and access control

```typescript
// Tech Stack: Node.js + Express
// Database: PostgreSQL

Endpoints:
- POST /auth/register
- POST /auth/login
- POST /auth/refresh-token
- POST /auth/logout
- GET /auth/me

Technologies:
- JWT (JSON Web Tokens)
- bcrypt for password hashing
- OAuth 2.0 for social login
```

### 2. Photo Service
**Responsibility:** Photo upload, validation, and storage management

```typescript
// Tech Stack: Node.js + Express
// File Storage: AWS S3 / Google Cloud Storage

Endpoints:
- POST /photos/upload
- GET /photos/:photoId
- GET /photos/user/:userId
- DELETE /photos/:photoId
- POST /photos/:photoId/rate
- GET /photos/nearby

Features:
- Multipart form data handling
- Image compression and resizing
- EXIF metadata extraction
- Async validation queue
- CDN integration for fast delivery
```

### 3. Image Recognition Service
**Responsibility:** AI-based photo validation

```python
# Tech Stack: Python + TensorFlow / PyTorch
# Model: Custom-trained CNN for Dash detection

Workflow:
1. Receive image from upload service
2. Preprocess image (resize, normalize)
3. Run through ML model
4. Generate confidence score
5. Return validation result

Output:
{
  "valid": true,
  "confidence": 0.92,
  "rank": "rare",
  "xp_reward": 50,
  "needs_review": false
}

Fallback Mechanism:
- If confidence < 75%: Queue for manual review
- Reviewers: Admin or community vote
```

### 4. Location Service
**Responsibility:** Geolocation tracking and mapping

```typescript
// Tech Stack: Node.js + Express
// Database: PostgreSQL with PostGIS (geospatial)
// Maps API: Google Maps / Mapbox

Endpoints:
- POST /locations/tag
- GET /locations/heatmap
- GET /locations/nearby
- GET /locations/leaderboard
- GET /locations/:locationId/stats

Features:
- GPS coordinate storage
- Geospatial queries (radius search)
- Heatmap generation (time-bucketed)
- Region-based clustering
- Privacy controls (public/private)
```

### 5. Leaderboard & Stats Service
**Responsibility:** Ranking calculation and statistics

```typescript
// Tech Stack: Node.js + Express
// Cache: Redis for hot data
// Database: PostgreSQL

Endpoints:
- GET /leaderboard/global
- GET /leaderboard/monthly
- GET /leaderboard/location
- GET /stats/user/:userId
- GET /stats/location/:locationId

Caching Strategy:
- Hourly leaderboard recalculation
- Redis cache with 1-hour TTL
- Real-time stats from DB
- Batch XP updates (every 5 minutes)
```

## Frontend Architecture

### Mobile App (React Native)

```
src/
├── screens/
│   ├── AuthStack/
│   │   ├── LoginScreen
│   │   ├── RegisterScreen
│   │   └── OnboardingScreen
│   ├── MainStack/
│   │   ├── CameraScreen
│   │   ├── MapScreen
│   │   ├── LeaderboardScreen
│   │   ├── ProfileScreen
│   │   └── PhotoHistoryScreen
│   └── Modal/
│       ├── PhotoReviewModal
│       └── SettingsModal
├── components/
│   ├── Camera/
│   ├── Map/
│   ├── PhotoCard/
│   ├── RankBadge/
│   └── LocationTag/
├── services/
│   ├── api.ts (API client)
│   ├── auth.ts (Auth management)
│   ├── storage.ts (Local storage)
│   └── location.ts (GPS handling)
├── store/
│   ├── authSlice.ts (Redux)
│   ├── photoSlice.ts
│   ├── userSlice.ts
│   └── mapSlice.ts
├── hooks/
│   ├── useCamera.ts
│   ├── useLocation.ts
│   ├── useFetch.ts
│   └── useAuth.ts
└── utils/
    ├── validators.ts
    ├── formatters.ts
    └── constants.ts
```

### State Management

```typescript
// Redux Toolkit Structure
{
  auth: {
    user: User | null,
    token: string,
    isLoading: boolean,
    error: string | null
  },
  photos: {
    items: Photo[],
    uploading: boolean,
    currentPhoto: Photo | null,
    error: string | null
  },
  user: {
    profile: UserProfile,
    stats: UserStats,
    achievements: Achievement[],
    isLoading: boolean
  },
  map: {
    heatmapData: HeatmapPoint[],
    locations: Location[],
    userLocation: Coordinates | null,
    zoom: number
  },
  ui: {
    theme: 'light' | 'dark',
    bottomTabIndex: number,
    notifications: Notification[]
  }
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP,
  privacy_settings JSONB
);
```

### Photos Table
```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  s3_url TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  is_valid BOOLEAN,
  confidence_score DECIMAL(3,2),
  rank VARCHAR(20), -- common, uncommon, rare, epic, legendary
  xp_awarded INTEGER,
  location GEOGRAPHY(POINT),
  location_name VARCHAR(255),
  location_privacy VARCHAR(20), -- public, friends, private
  is_flagged BOOLEAN DEFAULT FALSE,
  metadata JSONB -- EXIF data, device info
);

CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_location ON photos USING GIST(location);
CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at DESC);
```

### User Stats Table
```sql
CREATE TABLE user_stats (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  total_xp INTEGER DEFAULT 0,
  rank_level INTEGER DEFAULT 1,
  total_photos INTEGER DEFAULT 0,
  valid_photos INTEGER DEFAULT 0,
  legendary_count INTEGER DEFAULT 0,
  epic_count INTEGER DEFAULT 0,
  rare_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Locations Table
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  coordinate GEOGRAPHY(POINT) NOT NULL,
  location_name VARCHAR(255),
  address TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  photo_count INTEGER DEFAULT 0,
  last_sighting TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locations_coordinate ON locations USING GIST(coordinate);
```

## API Design

### Request/Response Format

```typescript
// Success Response
{
  success: true,
  status: 200,
  data: { /* response data */ },
  meta: {
    timestamp: "2026-06-02T15:30:00Z",
    version: "1.0"
  }
}

// Error Response
{
  success: false,
  status: 400,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid photo format",
    details: { field: "message array" }
  },
  meta: {
    timestamp: "2026-06-02T15:30:00Z",
    version: "1.0"
  }
}
```

### Rate Limiting

```
- Standard: 100 requests/minute per user
- Photo Upload: 10 uploads/minute
- Leaderboard: 20 requests/minute
- Location Tag: 30 requests/minute
```

## Deployment Architecture

### Development Environment
- Local: Docker Compose with PostgreSQL, Redis, services
- Testing: GitHub Actions CI/CD

### Staging Environment
- AWS EC2 instances
- RDS PostgreSQL
- ElastiCache Redis
- S3 for file storage

### Production Environment
- AWS ECS (Elastic Container Service)
- Aurora PostgreSQL (RDS)
- ElastiCache Redis cluster
- CloudFront CDN
- Application Load Balancer
- Auto-scaling groups

### CI/CD Pipeline

```yaml
Trigger: Push to main/staging
  ├─ Lint & Type Check
  ├─ Unit Tests
  ├─ Integration Tests
  ├─ Build Docker Image
  ├─ Push to ECR
  ├─ Deploy to Staging
  ├─ E2E Tests
  └─ Deploy to Production (manual approval)
```

## Security Architecture

### Data Protection
- HTTPS/TLS encryption in transit
- AES-256 encryption at rest (S3)
- Database encryption (AWS RDS)
- API key rotation (monthly)

### Authentication & Authorization
- JWT tokens with 1-hour expiry
- Refresh tokens with 7-day expiry
- Role-based access control (RBAC)
- OAuth 2.0 for social login

### Image Validation Security
- EXIF metadata validation
- File type verification
- File size limits (max 50MB)
- Malware scanning on upload

### API Security
- Rate limiting per user
- CORS configuration
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- CSRF tokens for state-changing operations

## Monitoring & Logging

### Metrics to Track
- API response times
- Error rates by endpoint
- ML model accuracy
- Database query performance
- Photo validation queue length
- User engagement metrics

### Logging Stack
- Application logs: Winston (Node.js)
- Infrastructure logs: CloudWatch
- Error tracking: Sentry
- Performance monitoring: DataDog

## Scalability Considerations

1. **Database:** PostgreSQL read replicas for query distribution
2. **Cache:** Redis cluster for distributed caching
3. **File Storage:** S3 with CloudFront CDN
4. **API:** Load balancing with auto-scaling groups
5. **Processing:** Async job queue for ML inference and data updates
