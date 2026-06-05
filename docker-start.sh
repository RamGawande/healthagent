#!/bin/bash

# Docker startup script for Medical Assistant

set -e

echo "🚀 Starting Medical Assistant with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

# Check for environment variables
if [ -z "$SECRET_KEY" ] && [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: SECRET_KEY not set and backend/.env not found"
    echo "   Using default values. This is NOT secure for production!"
    echo ""
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Medical Assistant is starting up!"
echo ""
echo "📍 Access the application:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:8009"
echo "   API Docs: http://localhost:8009/docs"
echo ""
echo "📝 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
echo ""
