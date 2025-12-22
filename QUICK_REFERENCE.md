# 🎯 Quick Reference - New Project Structure

## ✅ Reorganization Complete!

The project has been restructured into dedicated `backend/` and `frontend/` folders for better organization.

---

## 📂 New Directory Structure

```
Smart-Farming_HACK/
├── backend/          ← All Python/FastAPI code
├── frontend/         ← All React/TypeScript code
├── assets/           ← Static assets
├── netlify/          ← Netlify functions
└── docs/             ← Documentation files
```

---

## 🚀 Running the Application

### Option 1: Development Mode (Separate Processes)

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:5000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

### Option 2: Docker (Full Stack)

```bash
docker-compose up --build
```

---

## 🧪 Testing the ML Model

```bash
cd backend
python test_recommender.py
```

---

## 🔄 Training ML Models

```bash
cd backend
python train_fertilizer_model.py
```

---

## 📊 Project Organization

### Backend Directory (`backend/`)
```
backend/
├── app/
│   ├── agents/           # AI agents (agronomist, ingestor, etc.)
│   ├── api/              # REST API endpoints
│   ├── ml_models/        # ML recommendation engine
│   ├── utils/            # Helper functions
│   ├── config.py         # Configuration
│   ├── models.py         # Data models
│   └── main.py           # FastAPI entry point
├── data/                 # Training datasets
├── models/               # Trained ML models (.pkl)
├── tests/                # Unit tests
├── requirements.txt      # Python dependencies
├── train_fertilizer_model.py
└── test_recommender.py
```

### Frontend Directory (`frontend/`)
```
frontend/
├── client/
│   ├── pages/            # React pages/routes
│   ├── components/       # Reusable components
│   ├── services/         # API service layers
│   ├── context/          # React context
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities
├── server/               # Express dev server (proxy)
├── shared/               # Shared TypeScript types
├── public/               # Static assets
├── package.json          # Node dependencies
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript config
```

---

## 🔧 Important Path Updates

### Python Backend
- **Working Directory:** Run all Python commands from `backend/` folder
- **Imports:** No changes needed - all imports work as before
- **Models Path:** `models/` (relative to backend/)
- **Data Path:** `data/` (relative to backend/)

### TypeScript Frontend
- **Working Directory:** Run all npm commands from `frontend/` folder
- **Import Aliases:** 
  - `@/*` → `frontend/client/*`
  - `@shared/*` → `frontend/shared/*`

### Docker
- **Dockerfile:** Updated to use `backend/` paths
- **docker-compose.yml:** Volume mounts updated for new structure

---

## 📝 Updated Commands

| Task | Old Command | New Command |
|------|-------------|-------------|
| Start Backend | `python -m uvicorn app.main:app` | `cd backend && python -m uvicorn app.main:app` |
| Start Frontend | `npm run dev` | `cd frontend && npm run dev` |
| Train Models | `python train_fertilizer_model.py` | `cd backend && python train_fertilizer_model.py` |
| Install Backend | `pip install -r requirements.txt` | `cd backend && pip install -r requirements.txt` |
| Install Frontend | `npm install` | `cd frontend && npm install` |

---

## 🎯 Key Benefits

✅ **Clear Separation:** Backend and frontend are now in separate folders  
✅ **Easier Navigation:** Find files faster with logical grouping  
✅ **Better for Teams:** Clear ownership boundaries  
✅ **Deployment Ready:** Each part can be deployed independently  
✅ **Industry Standard:** Follows monorepo best practices  

---

## 📚 Documentation

- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Complete structure reference
- [PATH_VERIFICATION.md](PATH_VERIFICATION.md) - Path configuration verification
- [README.md](README.md) - Main project documentation

---

## ⚠️ Migration Checklist

If you have any local development in progress:

- [ ] Stop all running servers (backend & frontend)
- [ ] Reinstall dependencies:
  - `cd backend && pip install -r requirements.txt`
  - `cd frontend && npm install`
- [ ] Update your IDE/editor workspace to point to new locations
- [ ] Update any custom scripts to use new paths
- [ ] Clear any cached builds: `rm -rf frontend/node_modules/.vite`

---

## 🆘 Troubleshooting

**Backend not starting?**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

**Frontend not starting?**
```bash
cd frontend
rm -rf node_modules .vite
npm install
npm run dev
```

**ML models not loading?**
```bash
cd backend
python train_fertilizer_model.py
```

---

**Structure reorganization completed on:** December 22, 2025
