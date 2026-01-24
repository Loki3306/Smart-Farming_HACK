# 🧪 IoT System End-to-End Testing Guide

## Current Status
✅ **Backend**: Running with enhanced MQTT logging  
✅ **Frontend**: Running with enhanced WebSocket logging  
✅ **Test Scripts**: Ready to simulate sensor data  

---

## 🎯 Testing the Complete Data Flow

### Step 1: Verify All Services Are Running

**Check these terminals:**

1. **MQTT Broker** (Terminal 1)
   ```powershell
   mosquitto -v
   ```
   ✅ Should show: `mosquitto version 2.x running`

2. **Backend** (Terminal 2)
   ```powershell
   cd c:\code\Smart-Farming_HACK\backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   ✅ Should show: `✅ Connected to MQTT broker`

3. **Frontend** (Terminal 3)
   ```powershell
   cd c:\code\Smart-Farming_HACK
   npm run dev
   ```
   ✅ Should show: `Local: http://localhost:5000/`

---

## 🧪 Test Method 1: Python WebSocket Client (Recommended)

This verifies the backend → WebSocket flow without needing a browser.

**Terminal 4:**
```powershell
cd c:\code\Smart-Farming_HACK\backend\iot_irrigation
python test_websocket_client.py
```

**Expected Output:**
```
🧪 WebSocket Test Client
======================================================================
📡 Connecting to: ws://localhost:8000/iot/ws/telemetry/farm_001
======================================================================

✅ WebSocket connected successfully!

Waiting for sensor data... (Press Ctrl+C to stop)
```

Then the script will display sensor data as it arrives.

---

## 🧪 Test Method 2: Publish Test Data

**Terminal 5:**
```powershell
cd c:\code\Smart-Farming_HACK\backend\iot_irrigation
python test_iot_system.py
```

**Choose an option:**
- **Option 1**: Publish single message
- **Option 2**: Publish continuous stream (every 5 seconds)
- **Option 3**: Publish with low moisture (triggers irrigation)

---

## 📊 What You Should See

### 1. Backend Terminal (When MQTT Message Arrives)

```
📨 RAW MQTT Message on topic 'farm/telemetry':
   Payload: {"farm_id":"farm_001","moisture":42.5,...}

======================================================================
🔔 MQTT MESSAGE RECEIVED - 16:35:45
======================================================================
📍 Farm ID:        farm_001
💧 Moisture:       42.5%
🌡️  Temperature:    28.3°C
💨 Humidity:       65.2%
🟢 Nitrogen (N):   45 ppm
🟡 Phosphorus (P): 38 ppm
🔵 Potassium (K):  52 ppm
⏰ Timestamp:      2026-01-24T16:35:45Z
======================================================================
```

### 2. WebSocket Client Terminal (When Data is Broadcast)

```
======================================================================
📨 MESSAGE #1 - 16:35:45
======================================================================
📍 Farm ID:        farm_001
💧 Moisture:       42.5%
🌡️  Temperature:    28.3°C
💨 Humidity:       65.2%
🟢 Nitrogen:       45 ppm
🟡 Phosphorus:     38 ppm
🔵 Potassium:      52 ppm
⏰ Timestamp:      2026-01-24T16:35:45Z
======================================================================
```

### 3. Browser Console (F12 → Console Tab)

```
[IoTService] Connecting to WebSocket: ws://localhost:8000/iot/ws/telemetry/farm_001
[IoTService] ✅ WebSocket connected

======================================================================
🎯 FRONTEND RECEIVED SENSOR DATA
======================================================================
📍 Farm ID:        farm_001
💧 Moisture:       42.5%
🌡️  Temperature:    28.3°C
💨 Humidity:       65.2%
🟢 NPK:            45
⏰ Timestamp:      2026-01-24T16:35:45Z
======================================================================
```

### 4. Frontend Dashboard UI

The **LiveSensorGrid** component should update in real-time showing:
- 💧 Moisture value
- 🌡️ Temperature value
- 💨 Humidity value
- 🌿 NPK value
- 🟢 "Online" status badge

---

## 🔍 Troubleshooting

### Issue: WebSocket shows "Offline"

**Check:**
1. Backend logs for `✅ Connected to MQTT broker`
2. Backend logs for `✅ WebSocket connected for farm farm_001`
3. Browser console for WebSocket errors

**Fix:**
```powershell
# Restart backend
# Terminal 2
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Issue: No data appearing

**Check:**
1. Is MQTT broker running? (`mosquitto -v`)
2. Is test script publishing? (Terminal 5)
3. Are farm_ids matching? (should be `farm_001`)

**Fix:**
```powershell
# Terminal 1
mosquitto -v

# Terminal 5
python test_iot_system.py
# Choose option 2 (continuous stream)
```

### Issue: Backend receives data but WebSocket doesn't

**Check backend logs for:**
```
📊 Processing sensor data for farm farm_001
💾 Saved sensor data to database
📡 Broadcasting to WebSocket clients
```

**If missing broadcast logs:**
- Data is being throttled (broadcasts every 3 seconds)
- Wait a few seconds and check again

---

## ✅ Success Criteria

You've successfully verified the complete data flow when:

1. ✅ Backend shows "📨 RAW MQTT Message"
2. ✅ Backend shows "🔔 MQTT MESSAGE RECEIVED"
3. ✅ WebSocket client shows "📨 MESSAGE #X"
4. ✅ Browser console shows "🎯 FRONTEND RECEIVED SENSOR DATA"
5. ✅ Dashboard UI updates with new values
6. ✅ Status badge shows "🟢 Online"

---

## 🎬 Quick Test Sequence

**Run these commands in order:**

```powershell
# Terminal 1: Start MQTT Broker
mosquitto -v

# Terminal 2: Start Backend
cd c:\code\Smart-Farming_HACK\backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Start Frontend
cd c:\code\Smart-Farming_HACK
npm run dev

# Terminal 4: Monitor WebSocket
cd c:\code\Smart-Farming_HACK\backend\iot_irrigation
python test_websocket_client.py

# Terminal 5: Publish Test Data
cd c:\code\Smart-Farming_HACK\backend\iot_irrigation
python test_iot_system.py
# Choose option 2 (continuous stream)
```

**Then open browser:**
1. Navigate to `http://localhost:5000`
2. Press `F12` to open console
3. Watch for sensor data updates!

---

## 📝 Data Flow Summary

```
ESP32/Test Script
    ↓ (MQTT Publish)
MQTT Broker (farm/telemetry)
    ↓ (MQTT Subscribe)
Backend MQTT Client
    ↓ (Async callback)
Backend Router (handle_sensor_data)
    ├─→ Database (every 30s)
    └─→ WebSocket Manager (every 3s)
            ↓ (WebSocket send)
        Frontend IoTService
            ↓ (React state update)
        LiveSensorGrid Component
            ↓ (UI render)
        Dashboard Display ✨
```

---

## 🎯 Next Steps After Successful Test

1. **Deploy to Production**: Configure production MQTT broker
2. **Connect Real ESP32**: Flash the `esp32_example.ino` code
3. **Add More Farms**: Update farm_id in ESP32 and frontend
4. **Monitor Performance**: Check database write frequency
5. **Add Alerts**: Implement notifications for critical values
