# Dash-Snatch Implementation Plan

## Phase 1: Backend Foundation (Weeks 1-3)

### Sprint 1.1: Project Setup & Authentication (Week 1)

#### Tasks:
1. **Initialize Node.js Backend**
   - [ ] Setup Express.js server with TypeScript
   - [ ] Configure environment variables (.env)
   - [ ] Set up Docker and docker-compose for local development
   - [ ] Configure PostgreSQL with migrations
   - [ ] Setup Redis for caching

   ```bash
   npm init -y
   npm install express typescript ts-node dotenv cors helmet
   npm install -D @types/express @types/node
   ```

2. **Authentication Service**
   - [ ] Implement JWT token generation/validation
   - [ ] Create user registration endpoint
   - [ ] Create user login endpoint
   - [ ] Implement password hashing (bcrypt)
   - [ ] Create token refresh mechanism
   - [ ] Setup email verification (optional for MVP)
   - [ ] Implement logout functionality

   **Database Schema:**
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255) UNIQUE NOT NULL,
     username VARCHAR(50) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     first_name VARCHAR(100),
     last_name VARCHAR(100),
     avatar_url TEXT,
     bio TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     is_active BOOLEAN DEFAULT true
   );

   CREATE TABLE sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     refresh_token VARCHAR(500) UNIQUE NOT NULL,
     expires_at TIMESTAMP NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **API Endpoints (Auth)**
   ```
   POST   /api/v1/auth/register
   POST   /api/v1/auth/login
   POST   /api/v1/auth/refresh
   POST   /api/v1/auth/logout
   GET    /api/v1/auth/me
   POST   /api/v1/auth/change-password
   ```

4. **Middleware Setup**
   - [ ] Authentication middleware (JWT verification)
   - [ ] Error handling middleware
   - [ ] Request logging middleware
   - [ ] CORS configuration
   - [ ] Request validation middleware

5. **Testing**
   - [ ] Setup Jest for unit testing
   - [ ] Write auth service tests
   - [ ] Setup integration tests

---

### Sprint 1.2: User Service & Database (Week 2)

#### Tasks:
1. **User Profile Management**
   - [ ] GET /api/v1/users/:id (user details)
   - [ ] PATCH /api/v1/users/:id (update profile)
   - [ ] GET /api/v1/users/:id/stats (user statistics)
   - [ ] DELETE /api/v1/users/:id (account deletion)

2. **Database Schema for Users**
   ```sql
   CREATE TABLE user_stats (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID UNIQUE REFERENCES users(id),
     total_xp INTEGER DEFAULT 0,
     rank_level INTEGER DEFAULT 1,
     total_photos INTEGER DEFAULT 0,
     valid_photos INTEGER DEFAULT 0,
     legendary_count INTEGER DEFAULT 0,
     epic_count INTEGER DEFAULT 0,
     rare_count INTEGER DEFAULT 0,
     uncommon_count INTEGER DEFAULT 0,
     common_count INTEGER DEFAULT 0,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE user_achievements (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     achievement_type VARCHAR(50),
     unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX idx_user_stats_total_xp ON user_stats(total_xp DESC);
   CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
   ```

3. **User Validation**
   - [ ] Email validation
   - [ ] Username uniqueness validation
   - [ ] Password strength validation
   - [ ] Profile data sanitization

4. **Tests**
   - [ ] User creation tests
   - [ ] Profile update tests
   - [ ] Error handling tests

---

### Sprint 1.3: Photo Service Infrastructure (Week 3)

#### Tasks:
1. **Photo Upload Service**
   - [ ] Setup AWS S3 bucket configuration
   - [ ] Implement file upload endpoint
   - [ ] Add image compression middleware
   - [ ] Implement thumbnail generation
   - [ ] Add EXIF metadata extraction
   - [ ] Setup CloudFront CDN for delivery

   **Endpoint:**
   ```
   POST /api/v1/photos/upload
   ```

2. **Database Schema for Photos**
   ```sql
   CREATE TABLE photos (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     original_url TEXT NOT NULL,
     thumbnail_url TEXT,
     s3_key VARCHAR(255) UNIQUE,
     uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     is_valid BOOLEAN DEFAULT NULL,
     confidence_score DECIMAL(3,2),
     rank VARCHAR(20),
     xp_awarded INTEGER DEFAULT 0,
     location_lat DECIMAL(10,8),
     location_lng DECIMAL(11,8),
     location_name VARCHAR(255),
     location_privacy VARCHAR(20) DEFAULT 'public',
     is_flagged BOOLEAN DEFAULT FALSE,
     metadata JSONB
   );

   CREATE INDEX idx_photos_user_id ON photos(user_id);
   CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at DESC);
   CREATE INDEX idx_photos_location ON photos(location_lat, location_lng);
   CREATE INDEX idx_photos_is_valid ON photos(is_valid);
   ```

3. **File Processing Queue**
   - [ ] Setup Bull job queue for async processing
   - [ ] Implement image compression job
   - [ ] Implement ML validation job (async)
   - [ ] Setup error handling and retries

4. **API Endpoints**
   ```
   POST   /api/v1/photos/upload
   GET    /api/v1/photos/:photoId
   GET    /api/v1/photos/user/:userId
   DELETE /api/v1/photos/:photoId
   ```

5. **Tests**
   - [ ] File upload tests
   - [ ] Image validation tests
   - [ ] Queue processing tests

---

## Phase 2: ML & Location Services (Weeks 4-6)

### Sprint 2.1: Image Recognition Service (Week 4)

#### Tasks:
1. **ML Model Setup**
   - [ ] Create Python Flask microservice
   - [ ] Setup TensorFlow/PyTorch environment
   - [ ] Train/fine-tune CNN model for Dash detection
   - [ ] Implement inference pipeline
   - [ ] Setup model versioning

   **Service Architecture:**
   ```
   POST /predict
   Body: { image_url: string }
   Response: {
     valid: boolean,
     confidence: number (0-1),
     rank: string,
     xp_reward: number
   }
   ```

2. **Confidence Scoring & Ranking**
   - [ ] Implement confidence score calculation
   - [ ] Create rank assignment logic based on image quality
   - [ ] Setup manual review queue for low confidence (< 75%)

3. **Queue Integration**
   - [ ] Connect photo service to ML queue
   - [ ] Implement callback to update photo validation status
   - [ ] Setup retry mechanism for failed predictions

4. **Manual Review System**
   - [ ] Database schema for review queue
   - [ ] Admin review endpoints
   - [ ] Community voting option (future)

---

### Sprint 2.2: Location Service (Week 5)

#### Tasks:
1. **Geospatial Database Setup**
   - [ ] Install PostGIS extension
   - [ ] Create location tables with geographic indexes

   ```sql
   CREATE EXTENSION postgis;

   CREATE TABLE locations (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     coordinate GEOMETRY(POINT, 4326),
     location_name VARCHAR(255),
     address TEXT,
     city VARCHAR(100),
     country VARCHAR(100),
     photo_count INTEGER DEFAULT 0,
     last_sighting TIMESTAMP,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX idx_locations_coordinate ON locations USING GIST(coordinate);
   ```

2. **Location Endpoints**
   ```
   POST   /api/v1/locations/tag
   GET    /api/v1/locations/nearby?lat=X&lng=Y&radius=1000
   GET    /api/v1/locations/heatmap?bounds=...
   GET    /api/v1/locations/leaderboard
   GET    /api/v1/locations/:id/stats
   ```

3. **Geospatial Queries**
   - [ ] Implement nearby location search
   - [ ] Implement heatmap generation
   - [ ] Implement region clustering

4. **Privacy Controls**
   - [ ] User location privacy settings
   - [ ] Option to make location public/private
   - [ ] Friend-only visibility option

---

### Sprint 2.3: XP & Leaderboard System (Week 6)

#### Tasks:
1. **XP Calculation Engine**
   - [ ] Implement XP reward mapping
   - [ ] Create rank level progression table

   ```sql
   CREATE TABLE rank_progression (
     level INTEGER PRIMARY KEY,
     required_xp INTEGER,
     rank_name VARCHAR(50),
     UNIQUE(rank_name)
   );

   INSERT INTO rank_progression (level, required_xp, rank_name) VALUES
   (1, 0, 'Spotter'),
   (2, 100, 'Scout'),
   (3, 300, 'Tracker'),
   (4, 600, 'Hunter'),
   (5, 1000, 'Master Hunter'),
   (6, 1500, 'Legend');
   ```

2. **Leaderboard Endpoints**
   ```
   GET /api/v1/leaderboard/global?page=1&limit=100
   GET /api/v1/leaderboard/monthly?page=1&limit=100
   GET /api/v1/leaderboard/locations?page=1&limit=100
   GET /api/v1/leaderboard/quality?page=1&limit=100
   GET /api/v1/users/:id/rank
   ```

3. **Caching Strategy**
   - [ ] Cache leaderboards in Redis
   - [ ] Implement 1-hour cache TTL
   - [ ] Setup cache invalidation on score updates
   - [ ] Batch XP updates (every 5 minutes)

4. **Leaderboard Calculation**
   - [ ] Implement leaderboard query with joins
   - [ ] Optimize for performance
   - [ ] Add pagination

---

## Phase 3: Frontend Development (Weeks 7-10)

### Sprint 3.1: Project Setup & Auth UI (Week 7)

#### Tasks:
1. **React Native Project Setup**
   ```bash
   npx create-expo-app DashSnatch
   npm install @react-navigation/native @react-navigation/stack
   npm install @reduxjs/toolkit react-redux
   npm install axios
   npm install expo-camera expo-location
   ```

2. **Authentication Screens**
   - [ ] **Login Screen** - Email/password form with validation
   - [ ] **Register Screen** - Sign-up with email, username, password
   - [ ] **Onboarding Screen** - Welcome and permissions request
   - [ ] **Forgot Password Screen** - Password reset flow (optional for MVP)

3. **UI Design Implementation**
   - [ ] Design system setup (colors, typography, spacing)
   - [ ] Reusable component library (Button, Input, Card, etc.)
   - [ ] Authentication form components

   **Color Scheme (Modern & Engaging):**
   ```
   Primary: #6366F1 (Indigo)
   Secondary: #EC4899 (Pink)
   Success: #10B981 (Green)
   Warning: #F59E0B (Amber)
   Danger: #EF4444 (Red)
   Background: #F9FAFB (Light Gray)
   Dark Background: #1F2937 (Dark Gray)
   Text Primary: #111827
   Text Secondary: #6B7280
   ```

4. **Authentication Logic**
   - [ ] Setup Redux auth slice
   - [ ] Implement API client with interceptors
   - [ ] Token persistence (AsyncStorage)
   - [ ] Auto-login on app startup

---

### Sprint 3.2: Camera & Photo Capture (Week 8)

#### Tasks:
1. **Camera Screen**
   - [ ] Setup camera with expo-camera
   - [ ] Implement capture button
   - [ ] Preview captured photo
   - [ ] Add camera permissions handling
   - [ ] Gallery picker integration

2. **Photo Review Screen**
   - [ ] Display captured photo
   - [ ] Show location tagging option
   - [ ] Privacy level selector (public/friends/private)
   - [ ] Upload button with progress indicator
   - [ ] Error handling and retry

3. **UI Components**
   - [ ] Camera controls (capture, gallery, flip)
   - [ ] Loading spinner during upload
   - [ ] Photo preview modal
   - [ ] Location permission prompt

   ```typescript
   // Camera Screen Component Structure
   CameraScreen
   ├── CameraView
   ├── CameraControls
   │   ├── CaptureButton
   │   ├── GalleryButton
   │   └── FlipButton
   ├── LocationIndicator
   └── PermissionPrompt (if needed)
   ```

---

### Sprint 3.3: Map & Location Visualization (Week 9)

#### Tasks:
1. **Map Screen**
   - [ ] Setup react-native-maps
   - [ ] Display heatmap overlay
   - [ ] Show user location
   - [ ] Tap to tag location flow
   - [ ] Zoom controls

2. **Heatmap Visualization**
   - [ ] Color gradient based on photo density
   - [ ] Location markers with info windows
   - [ ] Real-time location updates
   - [ ] Clustering for dense areas

3. **UI Components**
   - [ ] Map header with search
   - [ ] Location info card
   - [ ] Photo count indicator
   - [ ] Latest sighting timestamp

   ```typescript
   // Map Screen Component Structure
   MapScreen
   ├── MapHeader
   │   ├── SearchBar
   │   └── FilterButton
   ├── MapView
   │   ├── HeatmapLayer
   │   ├── MarkerLayer
   │   └── UserLocationIndicator
   ├── LocationInfoCard
   │   ├── LocationName
   │   ├── PhotoCount
   │   └── LastSightingTime
   └── MapControls
       ├── ZoomIn
       ├── ZoomOut
       └── CenterUser
   ```

---

### Sprint 3.4: Leaderboards & Profile (Week 10)

#### Tasks:
1. **Leaderboard Screen**
   - [ ] Global leaderboard with rankings
   - [ ] Monthly leaderboard tab
   - [ ] Location leaderboard tab
   - [ ] Quality leaderboard tab
   - [ ] User rank indicator
   - [ ] Pull-to-refresh

2. **User Profile Screen**
   - [ ] User avatar and basic info
   - [ ] Statistics display (total XP, rank, photos)
   - [ ] Achievement badges
   - [ ] Photo history grid
   - [ ] Settings button
   - [ ] Logout button

3. **UI Components**
   - [ ] Leaderboard row with rank and score
   - [ ] Achievement badge display
   - [ ] Stats card with progress bar
   - [ ] Photo grid gallery

   ```typescript
   // Profile Screen Component Structure
   ProfileScreen
   ├── ProfileHeader
   │   ├── Avatar
   │   ├── Username
   │   ├── RankBadge
   │   └── EditProfileButton
   ├── StatisticsSection
   │   ├── StatCard (XP)
   │   ├── StatCard (Photos)
   │   └── StatCard (Rank Level)
   ├── AchievementsSection
   │   └── AchievementBadgeGrid
   ├── PhotoHistorySection
   │   └── PhotoGrid
   └── ActionButtons
       ├── SettingsButton
       └── LogoutButton
   ```

---

## Phase 4: Integration & Testing (Weeks 11-12)

### Sprint 4.1: E2E Testing (Week 11)

#### Tasks:
1. **User Flow Testing**
   - [ ] Sign up → Login → Home flow
   - [ ] Capture photo → Upload → Validation flow
   - [ ] Tag location → View on map flow
   - [ ] View leaderboard → View profile flow

2. **Performance Testing**
   - [ ] App load time
   - [ ] Photo upload speed
   - [ ] Map rendering performance
   - [ ] Leaderboard load time

3. **Device Testing**
   - [ ] iOS testing
   - [ ] Android testing
   - [ ] Different screen sizes

---

### Sprint 4.2: Bug Fixes & Optimization (Week 12)

#### Tasks:
1. **Optimization**
   - [ ] Image optimization and compression
   - [ ] Bundle size optimization
   - [ ] API response caching
   - [ ] Lazy loading for lists

2. **Bug Fixes**
   - [ ] Camera permission bugs
   - [ ] Location tracking issues
   - [ ] Image upload errors
   - [ ] Leaderboard refresh issues

3. **Polish**
   - [ ] Loading states
   - [ ] Error messages
   - [ ] Empty states
   - [ ] Animations and transitions

---

## UI/UX Design Guidelines

### Typography
```
Display: Poppins Bold 28px (Headers)
Heading: Poppins SemiBold 24px
Subheading: Poppins SemiBold 18px
Body: Inter Regular 16px
Caption: Inter Regular 14px
Small: Inter Regular 12px
```

### Spacing
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

### Component Examples

**Button Component:**
```typescript
<Button
  variant="primary" | "secondary" | "ghost"
  size="small" | "medium" | "large"
  disabled={false}
  onPress={() => {}}
  icon={Icon}
>
  Label
</Button>
```

**Input Component:**
```typescript
<Input
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  icon={EmailIcon}
  secureTextEntry={false}
/>
```

**Card Component:**
```typescript
<Card
  onPress={() => {}}
  variant="elevated" | "outlined"
>
  <Card.Image source={imageSource} />
  <Card.Title>Card Title</Card.Title>
  <Card.Content>Card content here</Card.Content>
</Card>
```

---

## Testing Strategy

### Unit Tests (Target: 80% coverage)
- Auth service
- XP calculation
- Leaderboard queries
- Photo validation

### Integration Tests
- Auth flow
- Photo upload + validation
- Location tagging
- Leaderboard updates

### E2E Tests
- User signup and login
- Photo capture and upload
- Viewing leaderboard
- Map interaction

---

## Deployment Checklist

### Backend
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] S3 bucket setup
- [ ] Redis cluster configured
- [ ] ML service deployed
- [ ] API documented (Swagger)
- [ ] Monitoring setup (Sentry, DataDog)

### Frontend
- [ ] App icon and splash screen configured
- [ ] iOS build tested
- [ ] Android build tested
- [ ] App store submission (iOS)
- [ ] Play store submission (Android)
- [ ] Analytics setup

### Post-Launch
- [ ] Monitor error rates
- [ ] Gather user feedback
- [ ] Prepare hotfix deployment
- [ ] Plan next features
