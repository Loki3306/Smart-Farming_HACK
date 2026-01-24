# 🚀 Quick Start Guide

## Prerequisites
- **Node.js**: v18 or higher
- **Python**: v3.10 or higher
- **PostgreSQL**: Local installation or cloud (e.g., Supabase)
- **Git**: For version control

## 1. Clone the Repository
```bash
git clone https://github.com/Loki3306/Smart-Farming_HACK.git
cd Smart-Farming_HACK
```

## 2. Backend Setup (FastAPI)
The backend requires Python and a few environment variables.

### Environment Setup
Create a `.env` file in the `backend/` directory or root:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
TWILIO_ACCOUNT_SID="your_sid"
TWILIO_AUTH_TOKEN="your_token"
TWILIO_PHONE_NUMBER="number"
GEMINI_API_KEY="your_ai_key"
```

### Install & Run
```bash
# Mobile to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Server
python -m uvicorn app.main:app --reload --port 8000
```
Server will be available at: `http://localhost:8000`
Swagger Docs: `http://localhost:8000/docs`

## 3. Frontend Setup (React + Vite)
```bash
# Move to client folder
cd client

# Install dependencies
npm install

# Run Dev Server
npm run dev
```
Frontend will be available at: `http://localhost:5173` (or similar port shown in terminal)

## 4. Live Demo Access
- **Frontend**: [https://krushiunnati.onrender.com/](https://krushiunnati.onrender.com/)
- **Backend API**: [https://huggingface.co/spaces/Deep08092006/KrushiUnnatiBackend](https://huggingface.co/spaces/Deep08092006/KrushiUnnatiBackend)
