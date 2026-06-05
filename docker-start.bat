@echo off
REM Docker startup script for Medical Assistant (Windows)

echo 🚀 Starting Medical Assistant with Docker...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

REM Check for environment variables
if "%SECRET_KEY%"=="" (
    if not exist "backend\.env" (
        echo ⚠️  Warning: SECRET_KEY not set and backend\.env not found
        echo    Using default values. This is NOT secure for production!
        echo.
    )
)

REM Build and start services
echo 📦 Building Docker images...
docker-compose build

echo 🚀 Starting services...
docker-compose up -d

echo ⏳ Waiting for services to be healthy...
timeout /t 5 /nobreak >nul

REM Check service status
echo.
echo 📊 Service Status:
docker-compose ps

echo.
echo ✅ Medical Assistant is starting up!
echo.
echo 📍 Access the application:
echo    Frontend: http://localhost
echo    Backend API: http://localhost:8009
echo    API Docs: http://localhost:8009/docs
echo.
echo 📝 View logs: docker-compose logs -f
echo 🛑 Stop services: docker-compose down
echo.

pause
