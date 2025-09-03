#!/bin/bash

echo "🚀 Setting up Application Hosting Portal Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed. Please install MongoDB v5 or higher."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   mongod"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    mkdir uploads
    echo "📁 Created uploads directory"
fi

# Seed the database
echo "🌱 Seeding database with mock users..."
npm run seed

echo ""
echo "✅ Backend setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Start the backend server: npm run dev"
echo "2. Test the API: npm test"
echo "3. Frontend should connect to: http://localhost:5000"
echo ""
echo "🔐 Mock user credentials:"
echo "   Developer: dev@bhel.com / dev123"
echo "   Reviewer: rev@bhel.com / rev123"
echo "   HOD: hod@bhel.com / hod123"
echo "   DTG: dtg@bhel.com / dtg123"
echo "   CDT: cdt@bhel.com / cdt123"
echo "   Hosting: host@bhel.com / host123"
echo "   Admin: admin@bhel.com / admin123" 