#!/bin/bash

# SwasthyaConnect - Backend API Deployment Script
# Deploys Node.js + Express API

echo "🚀 Starting Backend API Deployment..."

# Navigate to API directory
cd "$(dirname "$0")/../services/api"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Compiling TypeScript..."
npm run build

# Check for service account key
if [ ! -f "serviceAccountKey.json" ]; then
    echo "⚠️  WARNING: serviceAccountKey.json not found!"
    echo "Please add your Firebase service account key before deploying."
    exit 1
fi

echo "✅ Backend build completed!"
echo "📝 Next steps:"
echo "1. Push code to GitHub"
echo "2. Connect repository to Render.com or Railway"
echo "3. Add environment variables in dashboard"
echo "4. Deploy!"
