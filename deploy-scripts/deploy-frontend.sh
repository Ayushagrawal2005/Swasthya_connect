#!/bin/bash

# SwasthyaConnect - Frontend Deployment Script
# Deploys React + Vite app to Firebase Hosting

echo "🚀 Starting Frontend Deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build production bundle
echo "🔨 Building production bundle..."
npm run build

# Deploy to Firebase Hosting
echo "☁️ Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Frontend deployed successfully!"
echo "🌐 Your app is live at: https://YOUR-PROJECT.web.app"
