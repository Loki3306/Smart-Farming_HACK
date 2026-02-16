# Smart Farming System - Setup Guide

## Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **Git**

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Loki3306/Smart-Farming_HACK.git
cd Smart-Farming_HACK
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file (create your own .env)
# Make sure to configure your environment variables
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Copy environment file to frontend directory
# The .env file should be in the frontend directory
```

### 4. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Add other environment variables as needed
```

Also create a `.env` file in the `frontend` directory (copy from root or create new).

### 5. Run the Application

#### Start Backend Server

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

The backend will be available at: `http://localhost:8000`

#### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at: `http://localhost:5000`

## Features

✅ **Authentication** - OTP-based phone authentication with Supabase
✅ **AI Recommendations** - ML-powered fertilizer recommendations
✅ **Dashboard** - Real-time farm monitoring
✅ **Weather Integration** - Live weather data
✅ **Blockchain Audit Trail** - Transparent action logging

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Scikit-learn** - Machine Learning models
- **Redis** - Caching and pub/sub
- **InfluxDB** - Time-series data
- **PostgreSQL** - Relational database
- **Web3.py** - Blockchain integration

### Frontend
- **React + TypeScript** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Supabase** - Backend as a Service
- **React Router** - Navigation
- **Framer Motion** - Animations

## API Endpoints

### Fertilizer Recommendation
```
POST /api/fertilizer/recommend
Content-Type: application/json

{
  "temperature": 25,
  "humidity": 60,
  "moisture": 45,
  "soil_type": "Loamy",
  "crop_type": "Wheat",
  "current_nitrogen": 15,
  "current_phosphorous": 10,
  "current_potassium": 120
}
```

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## Troubleshooting

### Backend Issues

1. **Port 8000 already in use**
   ```bash
   # Change port in the command
   python -m uvicorn app.main:app --reload --port 8001
   ```

2. **Module not found errors**
   ```bash
   # Reinstall dependencies
   pip install -r requirements.txt --force-reinstall
   ```

### Frontend Issues

1. **Port 5000 already in use**
   - Vite will automatically use the next available port

2. **Module not found errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

Project Link: [https://github.com/Loki3306/Smart-Farming_HACK](https://github.com/Loki3306/Smart-Farming_HACK)
