# 📁 Project Structure

```
Smart-Farming_HACK/
│
├── 📂 backend/                  ← Python FastAPI Backend
│   ├── app/
│   │   ├── agents/              # Multi-agent AI system
│   │   │   ├── agronomist.py   # Irrigation & fertilization decisions
│   │   │   ├── ingestor.py     # MQTT sensor data ingestion
│   │   │   ├── meteorologist.py # Weather & satellite data
│   │   │   ├── auditor.py      # Blockchain audit trail
│   │   │   └── gatekeeper.py   # WebSocket API gateway
│   │   ├── api/                 # REST API endpoints
│   │   │   └── fertilizer.py   # Fertilizer recommendation API
│   │   ├── ml_models/           # Machine learning models
│   │   │   └── fertilizer_recommender.py  # ML recommendation engine
│   │   ├── utils/               # Utility functions
│   │   ├── config.py            # Configuration
│   │   ├── models.py            # Data models
│   │   └── main.py              # FastAPI entry point
│   ├── tests/                   # Backend tests
│   ├── models/                  # Trained ML models (*.pkl files)
│   ├── data/                    # Training datasets
│   │   ├── data_core.csv
│   │   ├── Fertilizer.csv
│   │   ├── Crop_recommendation.csv
│   │   └── cropdata_updated.csv
│   ├── requirements.txt         # Python dependencies
│   ├── train_fertilizer_model.py # Model training script
│   └── test_recommender.py      # Model testing script
│
├── 📂 frontend/                 ← React + TypeScript Frontend
│   ├── client/
│   │   ├── pages/               # Page components
│   │   │   ├── Index.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── FarmOnboarding.tsx
│   │   │   ├── FertilizerRecommendation.tsx  # 🌱 NEW!
│   │   │   ├── AuditTrail.tsx
│   │   │   └── NotFound.tsx
│   │   ├── components/          # Reusable components
│   │   │   ├── dashboard/
│   │   │   ├── auth/
│   │   │   └── ui/             # Shadcn UI components
│   │   ├── context/             # React context providers
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API service layers
│   │   ├── lib/                 # Utility libraries
│   │   ├── App.tsx              # App entry & routing
│   │   ├── main.tsx             # React entry point
│   │   └── global.css           # Global styles
│   ├── server/                  # Express dev server (proxy)
│   │   ├── index.ts             # Express setup with proxy
│   │   └── routes/
│   ├── shared/                  # Shared TypeScript types
│   ├── public/                  # Static assets
│   ├── package.json             # Node dependencies
│   ├── vite.config.ts           # Vite configuration
│   ├── tailwind.config.ts       # Tailwind CSS config
│   ├── tsconfig.json            # TypeScript config
│   ├── postcss.config.js        # PostCSS config
│   ├── components.json          # Shadcn UI config
│   ├── index.html               # HTML entry point
│   └── node_modules/            # Dependencies (gitignored)
│
├── 📂 assets/                   # Static assets
├── 📂 attached_assets/          # Uploaded files
├── 📂 netlify/                  # Netlify serverless functions
│
├── 📄 docker-compose.yml        # Multi-container setup
├── 📄 Dockerfile                # Container image definition
├── 📄 .dockerignore             # Docker ignore rules
├── 📄 .env                      # Environment variables (gitignored)
├── 📄 .env.example              # Environment template
├── 📄 .gitignore                # Git ignore rules
├── 📄 .npmrc                    # NPM configuration
├── 📄 .prettierrc               # Code formatting rules
├── 📄 netlify.toml              # Netlify deployment config
│
└── 📚 DOCUMENTATION
    ├── README.md                            # Main documentation
    ├── PROJECT_STRUCTURE.md                 # This file
    ├── PATH_VERIFICATION.md                 # Path verification report
    ├── AGENTS.md                            # Agent system overview
    ├── ARCHITECTURE.md                      # System architecture
    ├── FERTILIZER_RECOMMENDATION.md         # 🌱 ML model docs
    ├── QUICKSTART_FERTILIZER.md             # 🌱 Quick start guide
    └── IMPLEMENTATION_COMPLETE.md           # 🌱 Implementation summary
```

## 🔑 Key Files

### Backend Entry Points (in `backend/`)
- `backend/app/main.py` - FastAPI application
- `backend/app/api/fertilizer.py` - Fertilizer API endpoints
- `backend/app/ml_models/fertilizer_recommender.py` - ML recommendation engine
- `backend/train_fertilizer_model.py` - Train ML models
- `backend/test_recommender.py` - Test ML models

### Frontend Entry Points (in `frontend/`)
- `frontend/client/main.tsx` - React application
- `frontend/client/App.tsx` - Routing configuration
- `frontend/client/pages/FertilizerRecommendation.tsx` - Fertilizer UI
- `frontend/server/index.ts` - Dev server with API proxy
- `frontend/vite.config.ts` - Build configuration

### Data & Models (in `backend/`)
- `backend/data/` - Training datasets (8000+ records)
- `backend/models/` - Trained ML models (.pkl files)

## 🚀 Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python train_fertilizer_model.py  # Train models (first time)
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Full Stack (Docker)
```bash
docker-compose up --build
```

## 📦 Dependencies

### Backend (Python)
- FastAPI, Uvicorn - Web framework
- Pandas, NumPy, Scikit-learn - ML & data processing
- Redis, InfluxDB, PostgreSQL - Data storage
- Web3, Eth-account - Blockchain
- Paho-MQTT - IoT sensors

### Frontend (TypeScript)
- React, React Router - UI framework
- TailwindCSS, Shadcn/ui - Styling
- Vite - Build tool
- Express - Dev server proxy

## 🌐 Ports

- Frontend: `http://localhost:5000`
- Backend: `http://localhost:8000`
- API Proxy: Frontend → Backend via Express

## 🔒 Security

- `.env` file for secrets (gitignored)
- Environment variables for API keys
- CORS configured for local development
