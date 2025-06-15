# 🛠️ Development Guide

## Quick Start

### One Command to Rule Them All

```bash
npm run dev
```

This single command starts both the frontend and backend servers concurrently with colored output:

- **🔵 FRONTEND** (cyan): Vite dev server on http://localhost:3001
- **🟡 BACKEND** (yellow): FastAPI server on http://localhost:8000

### First Time Setup

```bash
# Clone the repository
git clone <repo-url>
cd wildlife-narration-web-app

# Install all dependencies (Node.js + Python)
npm run setup

# Start development
npm run dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | 🚀 Start both frontend and backend |
| `npm run dev:frontend` | 🎨 Frontend only (Vite) |
| `npm run dev:backend` | 🐍 Backend only (FastAPI) |
| `npm run setup` | 📦 Install all dependencies |
| `npm run build` | 🏗️ Build for production |

## Development URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/health

## Project Structure

```
wildlife-narration-web-app/
├── src/                    # Frontend (Lit Web Components)
│   ├── components/         # UI Components
│   ├── services/          # API Services
│   └── styles/            # CSS/Tailwind
├── backend/               # Python FastAPI Backend
│   ├── app/               # FastAPI application
│   ├── venv/              # Python virtual environment
│   └── requirements.txt   # Python dependencies
├── package.json           # Node.js dependencies & scripts
└── setup.sh              # Automated setup script
```

## Technology Stack

### Frontend
- **Lit**: Web Components framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast development server

### Backend
- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation
- **yt-dlp**: YouTube stream processing

## Development Workflow

1. **Start Development**: `npm run dev`
2. **Make Changes**: Edit files in `src/` (frontend) or `backend/app/` (backend)
3. **Hot Reload**: Both servers automatically reload on changes
4. **Test API**: Visit http://localhost:8000/docs for interactive API testing
5. **Test Frontend**: Visit http://localhost:3001 for the web app

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# API Keys
OPENAI_API_KEY=your_openai_key_here
YOUTUBE_API_KEY=your_youtube_key_here

# Optional Configuration
DEBUG=true
LOG_LEVEL=info
```

## Troubleshooting

### Backend Won't Start
- Ensure Python 3.8+ is installed
- Check if virtual environment is activated
- Install dependencies: `cd backend && pip install -r requirements.txt`

### Frontend Won't Start
- Ensure Node.js 16+ is installed
- Install dependencies: `npm install`
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

### Port Conflicts
- Frontend (3001): Change in `vite.config.ts`
- Backend (8000): Change in `backend/app/core/config.py`

## API Integration

The frontend is configured to connect to the backend API. Key integration points:

- **Stream Discovery**: `GET /api/v1/streams/`
- **Stream Management**: `POST /api/v1/streams/`
- **Health Check**: `GET /health`

See the API documentation at http://localhost:8000/docs for complete endpoint details.

## Next Steps

1. Connect frontend to real API endpoints (replace mock data)
2. Implement video frame extraction
3. Add AI-powered narration features
4. Integrate YouTube stream processing

Happy coding! 🦁 