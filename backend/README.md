# Wildlife Narration API Backend

## 🎯 Overview

FastAPI backend for the Wildlife Narration Web App - providing real-time AI-powered narration of animal behavior from live YouTube streams.

## ✅ Completed Features

### Task #7: Backend API Foundation ✅

- **FastAPI Application**: Modern async web framework
- **YouTube Integration**: yt-dlp service for stream metadata
- **Configuration Management**: Environment-based settings
- **CORS Support**: Configured for frontend integration
- **API Documentation**: Auto-generated OpenAPI docs
- **Error Handling**: Global exception handling
- **Health Checks**: System status monitoring

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
python3 -m pip install fastapi uvicorn yt-dlp python-dotenv pydantic-settings loguru
```

### 2. Configure Environment
Your `.env` file is already configured with:
- ✅ OpenAI API Key: `sk-proj-NW9p...`
- ✅ YouTube API Key: `AIzaSyB6...`

### 3. Start the Server
```bash
python3 run.py
```

The server will start at: http://localhost:8000

## 📚 API Documentation

Once running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🛠 Available Endpoints

### Core Endpoints
- `GET /` - API information
- `GET /health` - Health check
- `GET /api/v1/streams/` - List streams
- `POST /api/v1/streams/` - Add new stream
- `GET /api/v1/streams/{id}` - Get specific stream
- `PUT /api/v1/streams/{id}` - Update stream
- `DELETE /api/v1/streams/{id}` - Delete stream
- `POST /api/v1/streams/{id}/refresh` - Refresh stream metadata

### Stream Management
- `GET /api/v1/streams/categories/` - Get available categories
- `POST /api/v1/streams/bulk-add` - Add multiple streams

## 🔑 API Keys Required

### Essential (for full functionality):
1. **OpenAI API Key** ✅ Configured
   - Purpose: Generate wildlife narrations
   - Get it: https://platform.openai.com/api-keys

2. **YouTube API Key** ✅ Configured  
   - Purpose: Enhanced metadata (optional, yt-dlp works without it)
   - Get it: https://console.developers.google.com/

### Optional (for advanced features):
3. **Anthropic Claude API Key**
   - Purpose: Alternative LLM for narration
   - Get it: https://console.anthropic.com/

4. **HuggingFace API Key**
   - Purpose: Open-source models and embeddings
   - Get it: https://huggingface.co/settings/tokens

## 🧪 Testing

Test the YouTube service:
```bash
python3 test_youtube.py
```

Test the API:
```bash
curl http://localhost:8000/health
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/v1/          # API routes
│   ├── core/            # Configuration
│   ├── models/          # Pydantic models
│   ├── services/        # Business logic
│   └── main.py          # FastAPI app
├── requirements.txt     # Dependencies
├── run.py              # Development server
├── .env                # Environment variables
└── README.md           # This file
```

## 🚀 Next Steps

1. **Start the backend server**
2. **Connect frontend to backend** (replace mock data)
3. **Implement Task #5**: YouTube Stream Metadata Integration
4. **Implement Task #8**: Video Frame Extraction Service
5. **Implement Task #9**: YOLOv8 Object Detection Integration

## 🔗 Frontend Integration

The backend is configured to accept requests from:
- http://localhost:3000
- http://localhost:3001
- http://127.0.0.1:3000
- http://127.0.0.1:3001

Update your frontend to use: `http://localhost:8000/api/v1/` 