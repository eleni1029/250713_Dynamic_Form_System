#!/bin/bash

echo "🚀 Starting Dynamic Form System Development Environment"
echo ""

# Check if PostgreSQL is running
if ! command -v pg_isready &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL first"
    exit 1
fi

# Start PostgreSQL if not running
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL is not running. Please start PostgreSQL first:"
    echo "   macOS: brew services start postgresql"
    echo "   Linux: sudo service postgresql start"
    echo "   Windows: net start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Run database seeding
echo "🗄️  Setting up database..."
npm run db:seed

# Start backend in background
echo "🔧 Starting backend server..."
npm run dev &
BACKEND_PID=$!

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Wait a moment for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Start frontend
echo "🎨 Starting frontend development server..."
npm run dev

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM