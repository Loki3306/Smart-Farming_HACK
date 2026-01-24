# IoT Irrigation Module - Smart Farming Platform

## Overview

This module provides a **seamless IoT-to-Dashboard bridge** for the Smart Farming platform, connecting ESP32 hardware sensors to the React frontend via FastAPI and WebSockets.

## Architecture

```
ESP32 Hardware → MQTT Broker → FastAPI Backend → WebSocket → React Frontend
                                      ↓
                                  Supabase DB
```

### Components

1. **ESP32 Hardware** (Your existing prototype)
   - Soil Moisture Sensor (GPIO 34)
   - DHT11 Temperature & Humidity (GPIO 4)
   - NPK/Potentiometer (GPIO 35)
   - Publishes to MQTT topic: `farm/telemetry`

2. **MQTT Broker** (Mosquitto or cloud broker)
   - Receives sensor data from ESP32
   - Distributes commands to devices

3. **FastAPI Backend** (`backend/iot_irrigation/`)
   - Subscribes to MQTT telemetry
   - Validates and stores sensor data
   - Broadcasts to WebSocket clients
   - Triggers irrigation logic

4. **React Frontend** (`client/components/dashboard/LiveSensorGrid.tsx`)
   - Real-time sensor display
   - WebSocket connection with auto-reconnect
   - Smooth animations with Framer Motion

## Features

### ✅ Backend Features
- **MQTT Integration**: Subscribes to `farm/telemetry` topic
- **Data Validation**: Pydantic models ensure data integrity
- **WebSocket Broadcasting**: Real-time updates to all connected clients
- **Data Throttling**: 
  - Database writes: Every 30 seconds (prevents rate-limiting)
  - WebSocket broadcasts: Every 3 seconds (live feel)
- **Irrigation Logic**: Auto-triggers watering when moisture < 35%
- **Error Handling**: Graceful degradation if MQTT broker is down
- **Security**: Environment-based MQTT credentials

### ✅ Frontend Features
- **Real-time Display**: 4 sensor cards (Moisture, Temp, Humidity, NPK)
- **Live Status Badge**: Online/Offline indicator
- **Auto-reconnect**: Exponential backoff reconnection strategy
- **Smooth Animations**: Framer Motion for value transitions
- **Responsive Design**: Works on mobile, tablet, and desktop

## Installation & Setup

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment Variables
Edit `.env` file:
```bash
# MQTT Broker Configuration
MQTT_BROKER_HOST=localhost        # Or cloud broker: broker.hivemq.com
MQTT_BROKER_PORT=1883
MQTT_USERNAME=                    # Optional
MQTT_PASSWORD=                    # Optional
```

#### Run FastAPI Server
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The IoT module will automatically:
- ✅ Initialize MQTT client on startup
- ✅ Subscribe to `farm/telemetry` topic
- ✅ Start WebSocket server at `/iot/ws/telemetry/{farm_id}`

### 2. Frontend Setup

The frontend is already integrated into the main dashboard (`client/pages/Home.tsx`).

#### Run Development Server
```bash
npm run dev
```

Navigate to `http://localhost:5173` and you'll see the **Live Sensor Monitor** at the top of the dashboard.

### 3. MQTT Broker Setup

#### Option A: Local Mosquitto (Recommended for Development)
```bash
# Windows (using Chocolatey)
choco install mosquitto

# Start broker
mosquitto -v
```

#### Option B: Cloud MQTT Broker (No installation required)
Use a public broker for testing:
- `broker.hivemq.com:1883`
- `mqtt.eclipseprojects.io:1883`
- `test.mosquitto.org:1883`

Update `.env`:
```bash
MQTT_BROKER_HOST=broker.hivemq.com
MQTT_BROKER_PORT=1883
```

### 4. ESP32 Configuration

Update your ESP32 code to publish to the correct MQTT topic:

```cpp
// MQTT Configuration
const char* mqtt_server = "YOUR_MQTT_BROKER_IP";
const int mqtt_port = 1883;
const char* mqtt_topic = "farm/telemetry";

// Sensor data JSON format
{
  "moisture": 45.2,
  "temp": 26.5,
  "humidity": 68.0,
  "npk": 512,
  "timestamp": "2026-01-24T00:41:31Z",
  "farm_id": "farm_001"
}
```

## API Endpoints

### WebSocket
- **`ws://localhost:8000/iot/ws/telemetry/{farm_id}`**
  - Real-time sensor data stream
  - Auto-reconnect on disconnect
  - Heartbeat ping/pong

### REST API
- **GET** `/iot/status` - Get IoT system status
- **GET** `/iot/latest/{farm_id}` - Get latest sensor data
- **POST** `/iot/command` - Send irrigation command

## Data Flow

### 1. Sensor Data Ingestion
```
ESP32 → MQTT (farm/telemetry) → FastAPI → Validation → Memory Storage
                                              ↓
                                         Database (throttled)
                                              ↓
                                         WebSocket Broadcast
```

### 2. Irrigation Logic
```
Sensor Data → Check moisture < 35% → Publish MQTT command (WATER_ON)
                                              ↓
                                         ESP32 receives command
                                              ↓
                                         Activate water pump
```

### 3. Frontend Updates
```
WebSocket Message → IoTService → React State → LiveSensorGrid → UI Update
```

## Throttling Strategy

### Why Throttling?
- **Database**: Supabase has rate limits
- **WebSocket**: Too frequent updates cause UI lag
- **MQTT**: Prevent message flooding

### Implementation
- **Database Writes**: Every 30 seconds
- **WebSocket Broadcasts**: Every 3 seconds
- **In-Memory Storage**: Immediate (no throttling)

This gives a "live" feel (3s updates) while preventing database overload.

## Security Considerations

### ✅ Implemented
- Environment-based MQTT credentials
- WebSocket origin validation (CORS)
- Pydantic data validation
- Error handling prevents crashes

### 🔒 Production Recommendations
1. **Use TLS/SSL** for MQTT (port 8883)
2. **Enable MQTT authentication** (username/password)
3. **Use WSS** (WebSocket Secure) in production
4. **Implement rate limiting** on WebSocket connections
5. **Add farm_id authentication** to prevent unauthorized access

## Troubleshooting

### MQTT Connection Issues
```bash
# Check if MQTT broker is running
mosquitto -v

# Test with mosquitto_sub
mosquitto_sub -h localhost -t "farm/telemetry" -v
```

### WebSocket Not Connecting
1. Check FastAPI is running: `http://localhost:8000/docs`
2. Verify WebSocket URL in browser console
3. Check CORS settings in `backend/app/main.py`

### No Sensor Data
1. Verify ESP32 is publishing to correct topic
2. Check MQTT broker logs
3. Verify JSON format matches Pydantic model

### Database Not Updating
- Check Supabase credentials in `.env`
- Verify `sensor_logs` table exists
- Check backend logs for errors

## Testing

### Manual Testing

#### 1. Test MQTT Publishing
```bash
# Publish test data
mosquitto_pub -h localhost -t "farm/telemetry" -m '{"moisture":45.2,"temp":26.5,"humidity":68.0,"npk":512,"farm_id":"farm_001"}'
```

#### 2. Test WebSocket
Open browser console and run:
```javascript
const ws = new WebSocket('ws://localhost:8000/iot/ws/telemetry/farm_001');
ws.onmessage = (e) => console.log('Received:', JSON.parse(e.data));
```

#### 3. Test Irrigation Logic
Publish low moisture data:
```bash
mosquitto_pub -h localhost -t "farm/telemetry" -m '{"moisture":30,"temp":26.5,"humidity":68.0,"npk":512,"farm_id":"farm_001"}'
```

Check backend logs for irrigation trigger.

## File Structure

```
backend/
├── iot_irrigation/
│   ├── __init__.py           # Module initialization
│   ├── models.py             # Pydantic models
│   ├── mqtt_client.py        # MQTT client implementation
│   └── router.py             # FastAPI routes + WebSocket

client/
├── services/
│   └── IoTService.ts         # WebSocket client
└── components/
    └── dashboard/
        └── LiveSensorGrid.tsx # Real-time sensor display
```

## Future Enhancements

- [ ] Historical data charts (time-series)
- [ ] Alerts and notifications
- [ ] Multiple farm support
- [ ] Sensor calibration interface
- [ ] Advanced irrigation scheduling
- [ ] Weather integration for smart watering
- [ ] Mobile app support

## Support

For issues or questions:
1. Check backend logs: `uvicorn` console output
2. Check frontend console: Browser DevTools
3. Verify MQTT broker is running
4. Review this README

## License

Part of the Smart Farming Platform - All Rights Reserved
