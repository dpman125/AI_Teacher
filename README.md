# AI Teacher Helper 🎓

An AI-powered web application that assists professors with grading papers, answering questions, and managing student information using OpenAI's API.

## Features

- **Home Tab**: General Q&A assistant for teaching questions, lesson planning, and academic inquiries
- **Paper Review Tab**: AI-powered paper grading with detailed feedback and automatic grade assignment
- **Students Tab**: Complete student management system with CRUD operations
- **Real-time Grade Updates**: Automatically updates student grades after paper reviews
- **Modern UI**: Clean, responsive interface with gradient themes

## Tech Stack

- **Frontend**: React 18 with functional components and hooks
- **Backend**: Node.js with Express
- **Database**: SQLite (lightweight, serverless)
- **AI**: OpenAI API (GPT-4o-mini by default)
- **Deployment**: Docker & Docker Compose

## Prerequisites

- Node.js 18+ (for local development)
- Docker & Docker Compose (for containerized deployment)
- OpenAI API Key ([Get one here](https://platform.openai.com/api-keys))

## Quick Start (Local Development)

### 1. Get Your OpenAI API Key

1. Visit https://platform.openai.com/signup
2. Sign up for an account (takes ~5 minutes)
3. Add a payment method (new accounts get $5 free credit)
4. Go to https://platform.openai.com/api-keys
5. Click "Create new secret key"
6. Copy the key (starts with `sk-`)

### 2. Set Up Environment Variables

```bash
# Copy the example env file
copy .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-key-here
# OPENAI_MODEL=gpt-4o-mini
```

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

### 4. Start the Application

**Option A - Run Both Together:**
```bash
npm run dev
```

**Option B - Run Separately:**
```bash
# Terminal 1 - Start backend (from project root)
cd server
node index.js

# Terminal 2 - Start frontend (from project root)
cd client
npm start
```

The app will open at http://localhost:3000
Backend API runs on http://localhost:3001

## Docker Deployment 🐳

### Prerequisites for Docker

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (usually comes with Docker Desktop)

### Deploy with Docker

1. **Create your .env file** (see step 2 above)

2. **Build and start containers:**
   ```bash
   docker-compose up -d --build
   ```

3. **Check if containers are running:**
   ```bash
   docker-compose ps
   ```

4. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3001

5. **View logs:**
   ```bash
   # All services
   docker-compose logs -f

   # Just backend
   docker-compose logs -f backend

   # Just frontend
   docker-compose logs -f frontend
   ```

6. **Stop the application:**
   ```bash
   docker-compose down
   ```

7. **Stop and remove all data:**
   ```bash
   docker-compose down -v
   ```

### Docker Commands Cheat Sheet

```bash
# Build without starting
docker-compose build

# Start existing containers
docker-compose start

# Stop containers (don't remove)
docker-compose stop

# Restart containers
docker-compose restart

# View running containers
docker ps

# Execute command in running container
docker-compose exec backend sh
docker-compose exec frontend sh

# Remove stopped containers
docker-compose rm
```

## Deploying to Your School Server

### Option 1: Docker (Recommended)

1. **Install Docker on server:**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. **Upload files via FileZilla:**
   - Connect to your server
   - Upload entire project folder
   - Make sure `.env` file is uploaded with your API key

3. **SSH into server and deploy:**
   ```bash
   cd /path/to/AI_teacherHelper
   docker-compose up -d --build
   ```

4. **Configure reverse proxy (optional):**
   If you want to use a domain name, set up nginx or Apache as a reverse proxy to port 80.

### Option 2: Direct Deployment (Without Docker)

1. **Upload via FileZilla:**
   - Upload all files to `/var/www/AI_teacherHelper` (or your preferred directory)
   - Upload `.env` with your API key

2. **SSH into server and install dependencies:**
   ```bash
   cd /var/www/AI_teacherHelper
   
   # Install server dependencies
   cd server
   npm install --production
   
   # Build frontend
   cd ../client
   npm install
   npm run build
   ```

3. **Set up PM2 (process manager):**
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start backend
   cd /var/www/AI_teacherHelper/server
   pm2 start index.js --name teacher-helper-api
   pm2 save
   pm2 startup
   ```

4. **Configure web server:**
   - Serve `client/build` folder with nginx/Apache
   - Proxy `/api/*` requests to `http://localhost:3001`

## API Endpoints

### General Chat
- `POST /api/chat/general`
  - Body: `{ "message": "your question" }`
  - Returns AI response

### Paper Grading
- `POST /api/grade/paper`
  - Body: `{ "studentId": 1, "paperText": "paper content" }`
  - Returns grade and feedback, updates student record

### Student Management
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get single student
- `POST /api/students` - Add new student
  - Body: `{ "name": "John", "age": 20, "class": "CS101", "overallGrade": "A" }`
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

## Project Structure

```
AI_teacherHelper/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js         # Main component with 3 tabs
│   │   ├── App.css        # Styling
│   │   └── index.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js           # Express server + OpenAI integration
│   ├── database.sqlite    # SQLite database (auto-created)
│   └── package.json
├── docker-compose.yml      # Docker orchestration
├── Dockerfile.server       # Backend container
├── Dockerfile.client       # Frontend container
├── nginx.conf             # Nginx config for frontend
├── .env                   # Environment variables (create this!)
├── .env.example           # Template for .env
└── README.md
```

## Configuration

### Environment Variables (.env)

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini        # Or gpt-4, gpt-3.5-turbo

# Server Configuration
PORT=3001
NODE_ENV=production
```

### Frontend Configuration

Edit `client/src/App.js` to change API URL:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
```

For production, create `client/.env.production`:
```
REACT_APP_API_URL=http://your-domain.com/api
```

## Database

The SQLite database (`server/database.sqlite`) is automatically created on first run.

**Schema:**
```sql
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  class TEXT NOT NULL,
  overallGrade TEXT DEFAULT 'N/A',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Backup database:**
```bash
# Local
cp server/database.sqlite server/database.backup.sqlite

# Docker
docker cp teacher-helper-backend:/app/database.sqlite ./backup.sqlite
```

## Troubleshooting

### "OpenAI API Error: 401"
- Check that your API key is correct in `.env`
- Ensure you have credits on your OpenAI account

### "Cannot connect to backend"
- Verify backend is running: `curl http://localhost:3001/api/health`
- Check CORS settings in `server/index.js`

### "No students showing up"
- Check browser console for errors
- Verify API calls: DevTools → Network tab

### Docker issues
- Restart containers: `docker-compose restart`
- Rebuild: `docker-compose up -d --build --force-recreate`
- Check logs: `docker-compose logs -f`

## Development

### Adding New Features

1. **New API endpoint**: Edit `server/index.js`
2. **New frontend component**: Edit `client/src/App.js`
3. **Styling**: Edit `client/src/App.css`
4. **Database changes**: Modify schema in `server/index.js`

### Testing

```bash
# Test backend
curl -X POST http://localhost:3001/api/chat/general \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'

# Test student creation
curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","age":20,"class":"CS101"}'
```
