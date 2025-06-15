#!/bin/bash

echo "🚀 Setting up Wildlife Narration Web App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

echo "📦 Installing Node.js dependencies..."
npm install

echo "🐍 Installing Python dependencies..."
cd backend

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "🔧 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python packages..."
pip install -r requirements.txt

echo "✅ Setup complete!"
echo ""
echo "🎯 To start the development servers:"
echo "   npm run dev          # Runs both frontend and backend"
echo "   npm run dev:frontend # Frontend only (port 3001)"
echo "   npm run dev:backend  # Backend only (port 8000)"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3001"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs" 