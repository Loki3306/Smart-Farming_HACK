# 🌾 Autonomous Smart Irrigation & Fertilization System

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready, AI-driven autonomous farming system with **ML-powered fertilizer recommendations**, IoT sensors, satellite data, weather forecasts, and blockchain audit trails to optimize irrigation and fertilization decisions in real-time.

---

## ✨ Features

- 🌱 **ML Fertilizer Recommendations** - Random Forest models predict what, how much, and when to fertilize
- 🤖 **Multi-Agent AI System** - 5 specialized agents working collaboratively
- 📡 **Real-time IoT Integration** - MQTT sensor data via HiveMQ Cloud
- 🌍 **External Data Enrichment** - OpenWeatherMap + NASA Earthdata
- ⛓️ **Blockchain Audit Trail** - Immutable logging on Polygon via Alchemy
- 🔄 **Event-Driven Architecture** - Redis Pub/Sub for inter-agent communication
- 📊 **Time-Series Storage** - InfluxDB for sensor data
- 🗄️ **Relational Database** - PostgreSQL for farm configuration
- 🔌 **WebSocket Support** - Real-time updates to React frontend
- 🐳 **Docker Ready** - Complete containerized deployment
- ✅ **Production Ready** - Error handling, logging, testing included

---

## 📁 Project Structure

```
📂 backend/              Python FastAPI + ML models
   ├── app/agents/       Multi-agent AI system
   ├── app/api/          REST API endpoints
   ├── app/ml_models/    🌱 ML recommendation engine
   ├── data/             Training datasets (8000+ records)
   └── models/           Trained ML models (.pkl)

📂 frontend/             React + TypeScript
   ├── client/pages/     Page components
   ├── client/components/ Reusable UI components
   ├── client/services/  API service layers
   └── server/           Express dev server (proxy)
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete directory structure.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ & PNPM
- Docker & Docker Compose (recommended)
- Git (optional)

### 1. Clone & Setup

```bash
# Clone repository (if using git)
git clone <repository-url>
cd Smart-Farming_HACK

# Install backend dependencies
cd backend
pip install -r requirements.txt
python train_fertilizer_model.py  # Train ML models (first time)
cd ..

# Install frontend dependencies
cd frontend
pnpm install
cd ..
```

### 2. Start Services

```bash
# Start all services (FastAPI, Redis, InfluxDB, PostgreSQL)
docker-compose up -d

# Initialize database
python init_db.py

# View logs
docker-compose logs -f fastapi
```

### 3. Verify Installation

```bash
# Run verification script
python verify_installation.py

# Test API
curl http://localhost:8000/api/health

# Open browser
http://localhost:8000/docs
```

### 4. Test the System

```bash
# Run MQTT sensor simulator
python test_mqtt.py

# Select option 2 (Critical scenario)
# Watch the magic happen! 🎉
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[INDEX.md](INDEX.md)** | 📚 Complete documentation index |
| **[GETTING_STARTED.md](GETTING_STARTED.md)** | 🚀 Detailed setup guide (start here!) |
| **[QUICKSTART.md](QUICKSTART.md)** | ⚡ 5-minute quick start |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | 🏗️ System architecture & diagrams |
| **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** | 📝 Implementation details |
| **[README_BACKEND.md](README_BACKEND.md)** | 🔧 Backend documentation |

---

## 🏗️ System Architecture

```
┌─────────────┐
│ IoT Sensors │ (Soil, Temp, Humidity, NPK, pH)
└──────┬──────┘
       │ MQTT/TLS
       ▼
┌──────────────────────────────────────────┐
│         Multi-Agent System               │
│  ┌─────────┐  ┌──────────────┐          │
│  │Ingestor │─▶│ InfluxDB     │          │
│  └────┬────┘  └──────────────┘          │
│       │ Redis Pub/Sub                   │
│       ▼                                  │
│  ┌──────────────┐                       │
│  │Meteorologist │◀─▶ OpenWeather/NASA  │
│  └──────┬───────┘                       │
│         │                                │
│         ▼                                │
│  ┌─────────────┐                        │
│  │ Agronomist  │ (AI Decision Logic)   │
│  └──────┬──────┘                        │
│         │                                │
│         ▼                                │
│  ┌─────────┐      ┌────────────┐       │
│  │ Auditor │─────▶│ Polygon    │       │
│  └────┬────┘      │ Blockchain │       │
│       │           └────────────┘       │
│       ▼                                 │
│  ┌───────────┐                         │
│  │Gatekeeper │─────▶ WebSocket        │
│  └───────────┘       └─────────┘       │
└──────────────────────────────────────────┘
               │
               ▼
       ┌──────────────┐
       │ React        │
       │ Frontend     │
       └──────────────┘
```

---

## 🤖 Agent System

### 1. 🔌 Ingestor Agent
- Subscribes to `farm/sensors/#` MQTT topic
- Writes to InfluxDB (time-series)
- Publishes `SensorUpdate` events

### 2. ☁️ Meteorologist Agent
- Fetches OpenWeatherMap weather data
- Retrieves NASA satellite imagery (NDVI, soil moisture)
- Publishes `EnvironmentalContext` events

### 3. 🧠 Agronomist Agent (AI)
- **Decision Logic**:
  ```
  IF soil_moisture < 30% 
     AND forecast_rain < 2mm
     AND water_need_score > 0.4
  THEN trigger_irrigation()
  ```
- Publishes `ActionInstruction` events

### 4. ⚖️ Auditor Agent
- Logs all actions to Polygon blockchain
- Uses Web3.py + Alchemy
- Publishes `BlockchainAuditLog` events

### 5. 📡 Gatekeeper Agent
- WebSocket server at `/api/ws`
- Broadcasts all events to frontend
- Real-time agent status updates

---

## 📊 Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, Python 3.11+ |
| **Event Bus** | Redis Pub/Sub |
| **Time-Series DB** | InfluxDB 2.7 |
| **Relational DB** | PostgreSQL 16 |
| **IoT Protocol** | MQTT (HiveMQ Cloud) |
| **Blockchain** | Polygon (via Alchemy) |
| **External APIs** | OpenWeatherMap, NASA Earthdata |
| **WebSocket** | FastAPI WebSocket |
| **Deployment** | Docker Compose |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Pre-configured API keys from keys.text
OPENWEATHER_API_KEY=0efccc6ecb3d2ce58709b40d48a81c3e
NASA_EARTHDATA_TOKEN=<your-token>
ALCHEMY_API_KEY=2Vg0O_Utr3Iw09SEjprg6

# MQTT Configuration (HiveMQ Cloud)
MQTT_BROKER=bbcee06087d24534a8bab3a332563368.s1.eu.hivemq.cloud
MQTT_USERNAME=Deep2006
MQTT_PASSWORD=Deep@2006

# Decision Thresholds (customize)
SOIL_MOISTURE_MIN_THRESHOLD=30.0
FORECAST_RAIN_THRESHOLD=2.0
TEMPERATURE_MAX_THRESHOLD=35.0
```

See [.env.example](.env.example) for complete configuration.

---

## 📝 API Endpoints

Once running, access:

- **Swagger UI**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health
- **Agent Status**: http://localhost:8000/api/agents/status
- **WebSocket**: ws://localhost:8000/api/ws

---

## 🧪 Testing

### Run Unit Tests
```bash
pytest tests/ -v --cov=app
```

### Simulate IoT Sensors
```bash
python test_mqtt.py
# Select option 2 for critical scenario
```

### Test WebSocket (Browser Console)
```javascript
const ws = new WebSocket('ws://localhost:8000/api/ws');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

---

## 🐳 Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| FastAPI | 8000 | Main application |
| Redis | 6379 | Event bus |
| InfluxDB | 8086 | Sensor data |
| PostgreSQL | 5432 | Farm config |
| pgAdmin | 5050 | DB admin UI |

---

## 📦 Project Structure

```
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Settings management
│   ├── models.py            # Data schemas
│   └── agents/              # Multi-agent system
│       ├── ingestor.py      # MQTT → InfluxDB
│       ├── meteorologist.py # Weather/NASA APIs
│       ├── agronomist.py    # AI decisions
│       ├── auditor.py       # Blockchain logger
│       └── gatekeeper.py    # WebSocket server
├── tests/                   # Test suite
├── docker-compose.yml       # Docker services
├── requirements.txt         # Python dependencies
├── .env.example            # Environment template
└── Documentation/          # Complete guides
    ├── GETTING_STARTED.md
    ├── ARCHITECTURE.md
    └── ...
```

---

## 🔄 Event Flow

```
1. Sensor → MQTT → Ingestor → InfluxDB + Redis
2. Redis → Meteorologist → External APIs → Redis
3. Redis → Agronomist → AI Decision → Redis
4. Redis → Auditor → Blockchain → Redis
5. Redis → Gatekeeper → WebSocket → Frontend
```

---

## 🎯 Use Cases

### Automated Irrigation
- Monitors soil moisture in real-time
- Considers weather forecast (no irrigation if rain expected)
- Calculates optimal water amount based on ET and temperature
- Logs decision to blockchain for audit

### Smart Fertilization
- Detects NPK deficiencies
- Uses NDVI for vegetation health assessment
- Recommends precise fertilizer amounts
- Tracks application history

### Real-time Monitoring
- Live sensor data visualization
- Agent status dashboard
- Blockchain transaction tracking
- Alert system for critical conditions

---

## 🛠️ Development

### Local Development (Without Docker)

```bash
# Start Redis
redis-server

# Start InfluxDB
influxd

# Activate environment
source venv/bin/activate

# Run application
python -m uvicorn app.main:app --reload
```

### Add New Agent

1. Create `app/agents/your_agent.py`
2. Implement Redis Pub/Sub listener
3. Add to `app/main.py` startup
4. Update documentation

---

## 🔐 Security

- ✅ TLS/SSL for MQTT (port 8883)
- ✅ Environment-based secrets management
- ✅ Blockchain transaction signing
- ✅ API key validation
- ✅ WebSocket connection state tracking

**⚠️ Production Checklist**:
- [ ] Generate new blockchain private key
- [ ] Deploy smart contract
- [ ] Rotate all API keys
- [ ] Enable CORS restrictions
- [ ] Set up authentication

---

## 📈 Scalability

- **Horizontal**: Multiple FastAPI instances behind load balancer
- **Vertical**: Independent agent processes
- **Database**: Read replicas for PostgreSQL
- **Event Bus**: Redis Cluster or Sentinel
- **Time-Series**: InfluxDB clustering

---

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
lsof -i :8000  # Find process
kill -9 <PID>  # Kill process
```

**MQTT connection failed:**
- Check firewall allows port 8883
- Verify credentials in `.env`
- Test: `python test_mqtt.py`

**Database error:**
```bash
docker-compose restart postgres
python init_db.py reset  # ⚠️ Deletes data
```

See [GETTING_STARTED.md](GETTING_STARTED.md#-troubleshooting) for more.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- **OpenWeatherMap** - Weather data API
- **NASA Earthdata** - Satellite imagery
- **Alchemy** - Polygon blockchain infrastructure
- **HiveMQ** - MQTT cloud broker
- **InfluxData** - Time-series database

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📞 Support

- 📚 Read the [documentation](INDEX.md)
- 🔍 Check [troubleshooting guide](GETTING_STARTED.md#-troubleshooting)
- 🐛 Run `python verify_installation.py`
- 📧 Contact support

---

## 🎉 Quick Links

- [📚 Full Documentation Index](INDEX.md)
- [🚀 Getting Started Guide](GETTING_STARTED.md)
- [⚡ 5-Minute Quick Start](QUICKSTART.md)
- [🏗️ Architecture Overview](ARCHITECTURE.md)
- [📝 Implementation Details](IMPLEMENTATION_SUMMARY.md)
- [🔧 Backend Documentation](README_BACKEND.md)

---

**Built with ❤️ for sustainable farming**

🌱 **Start Smart Farming Today!** 🚜

---

*Last Updated: December 22, 2025*  
*Version: 1.0.0*
