# Dash-Snatch Development Setup Guide

## Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **PostgreSQL:** v14.0 or higher
- **Redis:** v7.0 or higher
- **Git:** v2.30.0 or higher
- **Docker & Docker Compose:** (optional, for containerized setup)

### System Requirements

- **OS:** macOS, Linux, or Windows (WSL2 recommended)
- **RAM:** 8GB minimum
- **Disk Space:** 5GB minimum
- **Internet:** Required for API calls and package installation

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/lukei-lakeside/Dash-Snatch.git
cd Dash-Snatch
```

### 2. Create Environment Files

#### Backend Environment (`.env`)

```bash
# Create backend/.env
cat > backend/.env << 'EOF'
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://dash_snatch_user:password@localhost:5432/dash_snatch
TEST_DATABASE_URL=postgresql://dash_snatch_user:password@localhost:5432/dash_snatch_test

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=$(openssl rand -hex 32)
REFRESH_SECRET=$(openssl rand -hex 32)
JWT_EXPIRY=3600
REFRESH_EXPIRY=604800

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=dash-snatch-photos
AWS_CLOUDFRONT_URL=https://d123456.cloudfront.net

# ML Service
ML_SERVICE_URL=http://localhost:5000
ML_MODEL_CONFIDENCE_THRESHOLD=0.75

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:8081

# Session
SESSION_SECRET=$(openssl rand -hex 32)
EOF
```

#### Frontend Environment (`.env.local`)

```bash
# Create frontend/.env.local
cat > frontend/.env.local << 'EOF'
REACT_NATIVE_API_URL=http://localhost:3000/api/v1
REACT_NATIVE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_NATIVE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
REACT_NATIVE_ENVIRONMENT=development
EOF
```

#### ML Service Environment (`.env`)

```bash
# Create ml-service/.env
cat > ml-service/.env << 'EOF'
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
MODEL_PATH=./models/dash_detector_v1.h5
CONFIDENCE_THRESHOLD=0.75
MAX_IMAGE_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=jpg,jpeg,png
EOF
```

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Create user and database
createuser dash_snatch_user -P
# Enter password: password (for development only)

createdb -O dash_snatch_user dash_snatch
createdb -O dash_snatch_user dash_snatch_test

# Verify connection
psql -U dash_snatch_user -d dash_snatch -c "SELECT version();"
```

### 2. Enable PostGIS Extension

```bash
# Connect to the database
psql -U dash_snatch_user -d dash_snatch

# Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;
\q
```

### 3. Run Database Migrations

```bash
cd backend
npm install
npm run migrate:latest
npm run seed:dev  # (Optional) Seed with test data
```

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Redis

```bash
# Using homebrew (macOS)
brew services start redis

# Or using Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 3. Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Or with debugging
npm run dev:debug
```

**Expected output:**
```
✓ Database connected
✓ Redis connected
✓ Server running on http://localhost:3000
✓ API Documentation: http://localhost:3000/api-docs
```

### 4. Verify Backend

```bash
# Test the API
curl http://localhost:3000/api/v1/auth/me
# Should return: {"success":false,"error":{"code":"UNAUTHORIZED"}}

# Check health endpoint
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

---

## ML Service Setup

### 1. Create Python Virtual Environment

```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Requirements file** (`requirements.txt`):
```
Flask==2.3.2
TensorFlow==2.13.0
Pillow==10.0.0
numpy==1.24.3
python-dotenv==1.0.0
requests==2.31.0
gunicorn==21.2.0
```

### 3. Download Pre-trained Model

```bash
# Download the Dash detector model (or train your own)
python scripts/download_model.py

# Verify model loads
python -c "from models import DashDetector; print(DashDetector.load())"
```

### 4. Start ML Service

```bash
# Development
python app.py

# Production
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

**Expected output:**
```
 * Running on http://0.0.0.0:5000
 * Model loaded successfully
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
# or
yarn install
```

### 2. Install Expo CLI (for React Native)

```bash
npm install -g expo-cli
```

### 3. Start Development Server

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on physical device
# Scan QR code with Expo app
```

### 4. Web Development (Optional)

```bash
# Start web version
npm run web
```

---

## Docker Setup (Optional)

### 1. Build and Run with Docker Compose

```bash
# From root directory
docker-compose up -d
```

### 2. Check Services

```bash
docker-compose ps
# Should show: postgres, redis, backend, ml-service, frontend
```

### 3. View Logs

```bash
docker-compose logs -f backend
docker-compose logs -f ml-service
```

### 4. Stop Services

```bash
docker-compose down
```

---

## Verify Full Stack

### 1. Database Test

```bash
curl -X GET http://localhost:3000/health
```

Expected:
```json
{"status": "ok", "database": "connected", "redis": "connected"}
```

### 2. Auth Test

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

Expected:
```json
{
  "success": true,
  "status": 201,
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "username": "testuser"
    }
  }
}
```

### 3. ML Service Test

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/dash.jpg"}'
```

Expected:
```json
{
  "valid": true,
  "confidence": 0.92,
  "rank": "rare",
  "xp_reward": 50
}
```

### 4. Frontend Test

```bash
# Open http://localhost:8081 in browser
# Should see login/register screens
```

---

## IDE Configuration

### VS Code Extensions

Required extensions:
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Thunder Client** / **REST Client** - API testing
- **GitLens** - Git integration
- **Docker** - Container management
- **Python** - Python support

### Settings (`.vscode/settings.json`)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "search.exclude": {
    "**/node_modules": true,
    "**/venv": true
  }
}
```

### Launch Debugger (`.vscode/launch.json`)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/node_modules/.bin/ts-node",
      "args": ["src/index.ts"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}/backend"
    },
    {
      "name": "ML Service",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/ml-service/app.py",
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}/ml-service"
    }
  ]
}
```

---

## Common Issues & Solutions

### Issue: PostgreSQL Connection Failed

**Solution:**
```bash
# Check if PostgreSQL is running
psql --version

# Start PostgreSQL service
brew services start postgresql  # macOS
sudo service postgresql start   # Linux
```

### Issue: Port Already in Use

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Issue: Node Version Mismatch

**Solution:**
```bash
# Use nvm to switch versions
nvm use 18
node --version
```

### Issue: npm install Fails

**Solution:**
```bash
# Clear cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Python Virtual Environment Issues

**Solution:**
```bash
# Recreate virtual environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow code style (ESLint/Prettier)
- Write tests for new features
- Update documentation

### 3. Run Tests Locally

```bash
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run test

# With coverage
npm run test:coverage
```

### 4. Commit and Push

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/your-feature-name
```

### 5. Create Pull Request

- Go to GitHub
- Create PR from your branch to `main`
- Add description and link to any related issues
- Request review

---

## Code Standards

### Naming Conventions

- **Files:** camelCase for components, kebab-case for utilities
- **Variables:** camelCase
- **Constants:** UPPER_SNAKE_CASE
- **Classes:** PascalCase
- **Functions:** camelCase

### Code Style

- Use TypeScript strictly
- No `any` type without explicit `// @ts-ignore` comment
- Max line length: 100 characters
- Use Prettier for formatting

### Git Commit Messages

```
type(scope): brief description

Longer explanation of the change if needed.
Closes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## Useful Commands

### Backend

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run tests
npm run test:coverage    # Run tests with coverage
npm run lint             # Run linter
npm run format           # Format code
npm run migrate:latest   # Run latest migrations
npm run seed:dev         # Seed with test data
```

### Frontend

```bash
npm start                # Start Expo server
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web              # Run web version
npm run test             # Run tests
npm run build:ios        # Build iOS app
npm run build:android    # Build Android app
```

### Database

```bash
# Access database
psql -U dash_snatch_user -d dash_snatch

# Reset database
npm run migrate:rollback
npm run migrate:latest

# Backup database
pg_dump -U dash_snatch_user dash_snatch > backup.sql

# Restore database
psql -U dash_snatch_user dash_snatch < backup.sql
```

---

## Performance Tips

1. **Use Redis Cache:** Cache frequently accessed data
2. **Database Indexing:** Index common query fields
3. **Image Optimization:** Compress photos before storage
4. **Lazy Loading:** Load screens/components on demand
5. **Bundle Analysis:** Check frontend bundle size regularly
6. **Profiling:** Use Chrome DevTools for performance analysis

---

## Next Steps

1. ✅ Complete setup following this guide
2. ✅ Run `npm run test` to verify everything works
3. ✅ Review the architecture in `ARCHITECTURE.md`
4. ✅ Start with Sprint 1.1 from `IMPLEMENTATION_PLAN.md`
5. ✅ Reference `API_DOCUMENTATION.md` for endpoint details
6. ✅ Follow `UI_DESIGN_SYSTEM.md` for component building

---

## Getting Help

- **Documentation:** Check relevant `.md` files in repo root
- **Issues:** Search GitHub issues for similar problems
- **Discussion:** Open GitHub discussion for questions
- **Slack/Discord:** [Link to community chat if available]

---

## Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Native Documentation](https://reactnative.dev/)
- [Express.js Guide](https://expressjs.com/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [PostGIS Documentation](https://postgis.net/docs/)
