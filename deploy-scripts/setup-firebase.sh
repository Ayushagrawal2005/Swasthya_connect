#!/bin/bash

# SwasthyaConnect - Firebase Setup Script
# Initializes Firebase project with Firestore and Hosting

echo "🔥 Starting Firebase Setup..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Login to Firebase
echo "🔐 Logging in to Firebase..."
firebase login

# Navigate to project root
cd "$(dirname "$0")/.."

# Initialize Firebase
echo "🚀 Initializing Firebase..."
firebase init

echo "✅ Firebase setup complete!"
echo "📝 Next steps:"
echo "1. Update firestore.rules with your security rules"
echo "2. Deploy rules: firebase deploy --only firestore:rules"
echo "3. Download service account key from Firebase Console"
echo "4. Save as services/api/serviceAccountKey.json"
