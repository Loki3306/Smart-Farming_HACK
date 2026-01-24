# 🌾 Smart Farming Platform - IoT Integration

## 🎉 NEW: Real-Time IoT Sensor Dashboard

Your Smart Farming platform now includes a **complete IoT-to-Dashboard bridge** that connects ESP32 hardware sensors to your React frontend in real-time!

---

## 🚀 Quick Start

### 1. Start MQTT Broker
```bash
mosquitto -v
```

### 2. Start Backend
```bash
cd backend
uvicorn app.main:app --reload
```

### 3. Start Frontend
```bash
npm run dev
```

### 4. Test the System
```bash
cd backend/iot_irrigation
python test_iot_system.py
```

**Open Dashboard:** `http://localhost:5173`

---

## 📦 What's New

### Backend
- ✅ **New Module**: `backend/iot_irrigation/`
  - MQTT client for ESP32 sensor data
  - WebSocket server for real-time streaming
  - Automatic irrigation logic
  - Data throttling (prevents rate-limiting)

### Frontend
- ✅ **Live Sensor Monitor**: Real-time dashboard at top of Home page
  - 4 sensor cards (Moisture, Temp, Humidity, NPK)
  - Live status indicator
  - Smooth animations
  - Auto-reconnect

### Features
- ✅ **Real-time Updates**: WebSocket streaming every 3 seconds
- ✅ **Auto Irrigation**: Triggers when moisture < 35%
- ✅ **Data Throttling**: Database writes every 30 seconds
- ✅ **Error Handling**: Graceful degradation if MQTT is down
- ✅ **Security**: Environment-based MQTT credentials

---

## 📁 New Files

### Backend (`backend/iot_irrigation/`)
```
├── __init__.py              # Module initialization
├── models.py                # Pydantic models for sensor data
├── mqtt_client.py           # MQTT client implementation
├── router.py                # FastAPI routes + WebSocket
├── README.md                # Complete documentation
├── esp32_example.ino        # ESP32 Arduino code
└── test_iot_system.py       # Testing script
```

### Frontend
```
client/services/IoTService.ts                    # WebSocket client
client/components/dashboard/LiveSensorGrid.tsx   # Real-time display
```

### Documentation
```
IOT_COMPLETE.md              # Complete implementation summary
IOT_QUICK_START.md           # Quick start guide
IOT_ARCHITECTURE.md          # Architecture diagrams
IOT_IMPLEMENTATION_SUMMARY.md # Detailed implementation
```

---

## 🔧 Configuration

### Environment Variables (`.env`)
```bash
# MQTT Broker
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_USERNAME=              # Optional
MQTT_PASSWORD=              # Optional
```

### ESP32 Hardware
Update `backend/iot_irrigation/esp32_example.ino`:
```cpp
const char* mqtt_server = "YOUR_MQTT_BROKER_IP";
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

---

## 🧪 Testing

### Without ESP32 (Simulated Data)
```bash
cd backend/iot_irrigation
python test_iot_system.py

# Choose option 2 to test irrigation trigger
```

### With ESP32 Hardware
1. Upload `esp32_example.ino` to your ESP32
2. Connect sensors:
   - Soil Moisture → GPIO 34
   - DHT11 → GPIO 4
   - NPK/Potentiometer → GPIO 35
   - Water Pump → GPIO 2
3. Watch dashboard update in real-time!

---

## 📊 Architecture

```
ESP32 Sensors → MQTT Broker → FastAPI Backend → WebSocket → React Dashboard
                                     ↓
                                Supabase DB
```

**Data Flow:**
1. ESP32 reads sensors every 5 seconds
2. Publishes to MQTT topic `farm/telemetry`
3. FastAPI receives and validates data
4. Stores to database (throttled 30s)
5. Broadcasts to WebSocket (throttled 3s)
6. React updates UI in real-time
7. Auto-triggers irrigation if moisture < 35%

---

## 🎯 Key Features

### Real-Time Monitoring
- **4 Sensor Cards**: Moisture, Temperature, Humidity, NPK
- **Live Status Badge**: Online/Offline indicator
- **Smooth Animations**: Framer Motion transitions
- **Auto-Reconnect**: Exponential backoff strategy

### Automatic Irrigation
- **Smart Logic**: Triggers when moisture < 35%
- **MQTT Commands**: Publishes to `farm/commands`
- **ESP32 Control**: Activates water pump automatically

### Data Management
- **Throttling**: DB writes every 30s, WebSocket every 3s
- **Validation**: Pydantic models ensure data integrity
- **Error Handling**: Graceful degradation, no crashes

### Security
- **Environment Variables**: MQTT credentials in `.env`
- **CORS**: Proper WebSocket origin validation
- **Optional Auth**: MQTT username/password support

---

## 📚 Documentation

- **Quick Start**: `IOT_QUICK_START.md`
- **Architecture**: `IOT_ARCHITECTURE.md`
- **Implementation**: `IOT_IMPLEMENTATION_SUMMARY.md`
- **Complete Guide**: `IOT_COMPLETE.md`
- **Module README**: `backend/iot_irrigation/README.md`

---

## 🔗 API Endpoints

### WebSocket
- `ws://localhost:8000/iot/ws/telemetry/{farm_id}` - Real-time sensor data

### REST API
- `GET /iot/status` - System status
- `GET /iot/latest/{farm_id}` - Latest sensor data
- `POST /iot/command` - Manual irrigation control

### API Docs
- `http://localhost:8000/docs` - Swagger UI

---

## 🐛 Troubleshooting

### MQTT Connection Failed
```bash
# Start Mosquitto
mosquitto -v

# Or use cloud broker
# Update .env: MQTT_BROKER_HOST=broker.hivemq.com
```

### WebSocket Not Connecting
```bash
# Check backend is running
http://localhost:8000/docs

# Check browser console
# Should see: [IoTService] ✅ WebSocket connected
```

### No Data on Dashboard
```bash
# Publish test data
mosquitto_pub -h localhost -t "farm/telemetry" -m '{"moisture":45.2,"temp":26.5,"humidity":68.0,"npk":512,"farm_id":"farm_001"}'
```

---

## 🎓 Next Steps

### For Development
1. ✅ Test with simulated data (`test_iot_system.py`)
2. ✅ Connect ESP32 hardware (`esp32_example.ino`)
3. ✅ Monitor real-time data on dashboard
4. ✅ Customize irrigation thresholds

### For Production
1. Enable MQTT TLS/SSL (port 8883)
2. Add MQTT authentication
3. Use WSS (WebSocket Secure)
4. Create `sensor_logs` table in Supabase
5. Implement data retention policies

---

## ✅ Success Checklist

- [ ] MQTT broker running
- [ ] Backend started successfully
- [ ] Frontend accessible at `localhost:5173`
- [ ] Live Sensor Monitor visible on dashboard
- [ ] Status badge shows "Live" (green)
- [ ] Test data updates dashboard
- [ ] Irrigation triggers at moisture < 35%
- [ ] ESP32 connected (optional)

---

## 🙏 Credits

**IoT Integration by:** Senior Full-Stack IoT Engineer  
**Platform:** Smart Farming (React/Vite + FastAPI + Node.js + Supabase)  
**Hardware:** ESP32 with Soil Moisture, DHT11, NPK sensors

---

## 📄 License

Part of the Smart Farming Platform - All Rights Reserved

---

**🌾 Happy Farming! 💧🚜**
