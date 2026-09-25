# SwasthyaConnect - Quick Deploy Commands 🚀

## One-Command Deployments

Copy and paste these commands for quick deployment.

---

## 🔥 Deploy Everything (One Script)

### Linux/Mac:
```bash
# Make scripts executable
chmod +x deploy-scripts/*.sh

# Run full deployment
./deploy-scripts/deploy-all.sh
```

### Windows (PowerShell):
```powershell
# Frontend
cd healthcare-platform
npm install
npm run build
firebase deploy --only hosting

# Backend (push to GitHub, then deploy on Render)
cd services/api
npm install
npm run build
git add .
git commit -m "Deploy backend"
git push origin main
```

---

## Individual Service Deployments

### 1️⃣ Frontend Only

```bash
cd healthcare-platform
npm install
npm run build
firebase deploy --only hosting
```

**Time**: ~5 minutes  
**URL**: `https://YOUR-PROJECT.web.app`

---

### 2️⃣ Backend API Only

```bash
cd services/api
npm install
npm run build

# Push to trigger auto-deploy on Render
git add .
git commit -m "Update backend"
git push origin main
```

**Time**: ~10 minutes (including build)  
**URL**: `https://swasthyaconnect-api.onrender.com`

---

### 3️⃣ ML Service Only

```bash
cd services/ml

# Ensure model file exists
ls -la triage_model_xgb.joblib

# Upload to Hugging Face Space via web UI
# Or use API:
huggingface-cli upload YOUR_USERNAME/swasthya-ml-service . --repo-type=space
```

**Time**: ~5 minutes  
**URL**: `https://huggingface.co/spaces/YOU/swasthya-ml-service`

---

### 4️⃣ OCR Service Only

```bash
cd services/ocr

# Upload to Hugging Face Space
huggingface-cli upload YOUR_USERNAME/swasthya-ocr-service . --repo-type=space
```

**Time**: ~5 minutes  
**URL**: `https://huggingface.co/spaces/YOU/swasthya-ocr-service`

---

## 🔧 Environment Variables Quick Reference

### Frontend (.env.production)
```bash
VITE_API_URL=https://swasthyaconnect-api.onrender.com
VITE_ML_SERVICE_URL=https://huggingface.co/spaces/.../ml
VITE_OCR_SERVICE_URL=https://huggingface.co/spaces/.../ocr
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

### Backend (Render Dashboard)
```bash
NODE_ENV=production
PORT=4000
JWT_SECRET=random_secret_min_32_chars
FIREBASE_PROJECT_ID=your-project-id
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
ML_SERVICE_URL=https://huggingface.co/.../ml
OCR_SERVICE_URL=https://huggingface.co/.../ocr
```

### ML Service (Hugging Face Secrets)
```bash
GROQ_API_KEY=gsk_...
```

### OCR Service (Hugging Face Secrets)
```bash
GEMINI_API_KEY=AIza...
```

---

## 📦 Docker Deployment (Advanced)

### Build All Containers

```bash
# Frontend
docker build -t swasthya-frontend .

# Backend
docker build -t swasthya-backend -f services/api/Dockerfile services/api

# ML Service
docker build -t swasthya-ml -f services/ml/Dockerfile services/ml

# OCR Service
docker build -t swasthya-ocr -f services/ocr/Dockerfile services/ocr
```

### Run with Docker Compose

```bash
docker-compose up -d
```

**Access**:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- ML: http://localhost:5000
- OCR: http://localhost:8000

---

## 🌍 Alternative Platforms

### Vercel (Frontend Alternative)

```bash
npm install -g vercel
cd healthcare-platform
vercel --prod
```

### Railway (Backend Alternative)

```bash
npm install -g @railway/cli
cd services/api
railway login
railway init
railway up
```

### Google Cloud Run (Production)

```bash
# Backend
gcloud run deploy swasthya-api \
  --source services/api \
  --region asia-south1 \
  --allow-unauthenticated

# ML Service
gcloud run deploy swasthya-ml \
  --source services/ml \
  --region asia-south1 \
  --allow-unauthenticated

# OCR Service
gcloud run deploy swasthya-ocr \
  --source services/ocr \
  --region asia-south1 \
  --allow-unauthenticated
```

---

## 🔄 CI/CD Auto-Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy All Services

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_TOKEN }}
          projectId: your-project-id

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

---

## ✅ Post-Deployment Verification

### Health Checks

```bash
# Frontend
curl https://your-project.web.app

# Backend
curl https://swasthyaconnect-api.onrender.com/health

# ML Service
curl https://huggingface.co/.../swasthya-ml-service/health

# OCR Service
curl https://huggingface.co/.../swasthya-ocr-service/health
```

### Test End-to-End

```bash
# Run automated tests
npm run test:e2e

# Or manual testing:
# 1. Open https://your-project.web.app
# 2. Login with test credentials
# 3. Try all features
```

---

## 🆘 Rollback Commands

### Frontend Rollback

```bash
firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION TARGET_SITE_ID
```

### Backend Rollback

On Render Dashboard:
1. Go to your service
2. Click "Deploys" tab
3. Find previous version
4. Click "Rollback to this version"

---

## 📊 Monitoring Commands

### View Logs

```bash
# Frontend (Firebase)
firebase hosting:logs

# Backend (Render)
# View in dashboard or use CLI
render logs -s swasthyaconnect-api

# ML/OCR (Hugging Face)
# View in Space → Logs tab
```

### Resource Usage

```bash
# Check Firestore usage
firebase firestore:stats

# Check Render usage
render resources
```

---

## 💰 Cost Monitoring

```bash
# Firebase billing
firebase projects:list

# Check actual usage
gcloud billing accounts list
```

---

## 🎯 Quick Links

- **Firebase Console**: https://console.firebase.google.com
- **Render Dashboard**: https://dashboard.render.com
- **Hugging Face Spaces**: https://huggingface.co/spaces
- **GitHub Repository**: https://github.com/YOUR_USERNAME/swasthyaconnect

---

## 📞 Support

- **Full Guide**: See `DEPLOYMENT_GUIDE.md`
- **Troubleshooting**: See `DEPLOYMENT_GUIDE.md` → Troubleshooting section
- **Issues**: Open issue on GitHub

---

**Last Updated**: January 2025  
**Platform**: SwasthyaConnect v1.0  
**Status**: ✅ Production Ready
