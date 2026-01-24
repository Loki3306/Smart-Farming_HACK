# 🚀 Quick Start Guide - IoT Irrigation System

## Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- MQTT broker (Mosquitto) installed OR use cloud broker

## Step 1: Install MQTT Broker (Optional - Local Development)

### Windows
```powershell
# Using Chocolatey
choco install mosquitto

# Start broker
mosquitto -v
```

### Linux/Mac
```bash
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# Start broker
mosquitto -v
```

### Alternative: Use Cloud Broker (No Installation)
Skip local installation and use a public broker:
- `broker.hivemq.com`
- `mqtt.eclipseprojects.io`
- `test.mosquitto.org`

## Step 2: Configure Environment

1. **Copy `.env.example` to `.env`**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add MQTT configuration**
   ```bash
   # For local Mosquitto
   MQTT_BROKER_HOST=localhost
   MQTT_BROKER_PORT=1883

   # OR for cloud broker
   MQTT_BROKER_HOST=broker.hivemq.com
   MQTT_BROKER_PORT=1883
   ```

## Step 3: Start Backend

```bash
cd backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
🚀 Starting Smart Farming AI Backend...
📦 Loading ML models...
✅ API ready! Models loaded: X/X
✅ IoT Irrigation module loaded
🔌 Initializing MQTT client for IoT...
🔌 Connecting to MQTT broker at localhost:1883...
✅ Connected to MQTT broker at localhost:1883
📡 Subscribed to topic: farm/telemetry
✅ MQTT client started successfully
```

## Step 4: Start Frontend

```bash
# In a new terminal
npm install  # First time only
npm run dev
```

**Open browser:** `http://localhost:5173`

## Step 5: Test with Simulated Data

### Option A: Using mosquitto_pub (Command Line)

```bash
# Publish test sensor data
mosquitto_pub -h localhost -t "farm/telemetry" -m '{"moisture":45.2,"temp":26.5,"humidity":68.0,"npk":512,"farm_id":"farm_001"}'

# Test low moisture (triggers irrigation)
mosquitto_pub -h localhost -t "farm/telemetry" -m '{"moisture":30,"temp":26.5,"humidity":68.0,"npk":512,"farm_id":"farm_001"}'
```

### Option B: Using MQTT Explorer (GUI)

1. Download MQTT Explorer: http://mqtt-explorer.com/
2. Connect to `localhost:1883`
3. Publish to topic `farm/telemetry` with JSON:
   ```json
   {
     "moisture": 45.2,
     "temp": 26.5,
     "humidity": 68.0,
     "npk": 512,
     "farm_id": "farm_001"
   }
   ```

### Option C: Using Python Script

```python
import paho.mqtt.client as mqtt
import json
import time

client = mqtt.Client()
client.connect("localhost", 1883, 60)

# Publish sensor data
data = {
    "moisture": 45.2,
    "temp": 26.5,
    "humidity": 68.0,
    "npk": 512,
    "farm_id": "farm_001"
}

client.publish("farm/telemetry", json.dumps(data))
print("Published:", data)
```

## Step 6: Verify Dashboard

1. **Open Dashboard:** `http://localhost:5173`
2. **Check Live Sensor Monitor** at the top
3. **Verify Status Badge** shows "Live" (green)
4. **Watch Values Update** in real-time

## Step 7: Connect ESP32 (Hardware)

1. **Open `backend/iot_irrigation/esp32_example.ino`**
2. **Update WiFi credentials:**
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. **Update MQTT broker IP:**
   ```cpp
   const char* mqtt_server = "192.168.1.100";  // Your computer's IP
   ```
4. **Upload to ESP32** using Arduino IDE
5. **Open Serial Monitor** (115200 baud)
6. **Watch Dashboard** update with real sensor data

## Troubleshooting

### MQTT Connection Failed
```
❌ Failed to connect to MQTT broker
```
**Solution:**
- Check if Mosquitto is running: `mosquitto -v`
- Verify MQTT_BROKER_HOST in `.env`
- Try cloud broker: `broker.hivemq.com`

### WebSocket Not Connecting
```
[IoTService] ❌ WebSocket error
```
**Solution:**
- Check FastAPI is running: `http://localhost:8000/docs`
- Verify backend console for errors
- Check browser console for CORS errors

### No Data on Dashboard
```
Waiting for sensor data...
```
**Solution:**
- Publish test data (see Step 5)
- Check backend logs for MQTT messages
- Verify topic name: `farm/telemetry`

### ESP32 Not Publishing
```
Failed to publish sensor data
```
**Solution:**
- Check WiFi connection
- Verify MQTT broker IP
- Check Serial Monitor for errors
- Test with mosquitto_pub first

## API Endpoints

### WebSocket
- `ws://localhost:8000/iot/ws/telemetry/farm_001`

### REST API
- `GET http://localhost:8000/iot/status` - System status
- `GET http://localhost:8000/iot/latest/farm_001` - Latest data
- `POST http://localhost:8000/iot/command` - Send command

### API Documentation
- `http://localhost:8000/docs` - Swagger UI

## Next Steps

1. ✅ **Test with simulated data** (Step 5)
2. ✅ **Connect ESP32 hardware** (Step 7)
3. 📊 **Monitor real-time data** on dashboard
4. 💧 **Test irrigation logic** (moisture < 35%)
5. 🔧 **Customize thresholds** in `router.py`

## Support

- **Backend Logs:** Check `uvicorn` console output
- **Frontend Logs:** Open browser DevTools → Console
- **MQTT Logs:** Check Mosquitto console output
- **Documentation:** See `backend/iot_irrigation/README.md`

## Success Checklist

- [ ] MQTT broker running
- [ ] Backend started successfully
- [ ] Frontend accessible at localhost:5173
- [ ] Live Sensor Monitor visible on dashboard
- [ ] Status badge shows "Live" (green)
- [ ] Test data updates dashboard
- [ ] ESP32 connected (optional)

---

**🎉 Congratulations!** Your IoT-to-Dashboard bridge is now live!
