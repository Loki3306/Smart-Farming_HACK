# 📚 Backend API Endpoints

Base URL: `http://localhost:8000` (Local) or Live URL.

## 🔐 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/auth/register` | Register new user |

## 🌾 Crops & Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict/disease` | Upload image for prediction |
| POST | `/api/predict/crop` | Get crop recommendation (Soil data) |
| GET | `/api/crops` | List all available crops |

## 📡 IoT & Sensors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sensors/data` | Get real-time sensor readings |
| POST | `/api/sensors/config` | Configure sensor thresholds |

*Note: For full interactive documentation, visit `/docs` on the running backend server.*
