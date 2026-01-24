# 🔍 Smart Farming - Complete System Restart & Diagnosis

## Current Issues Identified

### 1. **MQTT Error Code 7** - Connection Refused/Not Authorized
**Cause**: Mosquitto broker may not be configured to allow anonymous connections

**Fix**: Use the provided `mosquitto.conf` file

### 2. **Backend Import Error** - FIXED ✅
**Issue**: `AttributeError: 'module' object has no attribute 'router'`

**Fix Applied**: Changed import from:
```python
from iot_irrigation import router as iot_router
app.include_router(iot_router.router)  # ❌ Wrong
```

To:
```python
from iot_irrigation.router import router as iot_router
app.include_router(iot_router, prefix="/iot")  # ✅ Correct
```

---

## 🚀 Complete Restart Procedure

### Step 1: Stop All Services

```powershell
# Kill all Python processes
taskkill /F /IM python.exe /T

# Kill all Node processes
taskkill /F /IM node.exe /T

# Note: Mosquitto may need admin rights to kill
# If it's running, that's OK - we'll restart it with config
```

---

### Step 2: Start Mosquitto with Configuration

**Option A: With Config File (Recommended)**
```powershell
cd c:\code\Smart-Farming_HACK
mosquitto -c mosquitto.conf -v
```

**Option B: Without Config (if mosquitto.conf doesn't work)**
```powershell
mosquitto -v
```

**Expected Output**:
```
1737724800: mosquitto version 2.x starting
1737724800: Opening ipv4 listen socket on port 1883.
1737724800: mosquitto version 2.x running
```

**If you see "Error: Address already in use"**:
- Mosquitto is already running
- That's fine! Continue to next step

---

### Step 3: Start Backend

```powershell
cd c:\code\Smart-Farming_HACK\backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Watch for these critical logs**:
```
🚀 Starting Smart Farming AI Backend...
🔧 Attempting to load IoT Irrigation module...
✅ IoT Irrigation module loaded successfully
🔌 Initializing MQTT client for IoT...
🔧 Initializing MQTT client for broker: 127.0.0.1:1883
✅ MQTT client initialized successfully
✅ Connected to MQTT broker
📡 Subscribed to farm/telemetry
INFO:     Application startup complete.
```

**Common Errors & Fixes**:

| Error | Cause | Fix |
|-------|-------|-----|
| `AttributeError: 'module' object has no attribute 'router'` | Import issue | Already fixed in code |
| `⚠️ Unexpected MQTT disconnection. Code: 7` | Mosquitto not allowing connections | Use `mosquitto.conf` |
| `Connection refused [Errno 111]` | Mosquitto not running | Start Mosquitto first |
| `ImportError: No module named 'iot_irrigation'` | Python path issue | Check you're in `backend/` directory |

---

### Step 4: Test WebSocket Connection

```powershell
# Open NEW terminal
cd c:\code\Smart-Farming_HACK\backend\iot_irrigation
python debug_bridge.py quick
```

**Expected Success**:
```
🔍 Quick Connection Test
✅ Connection successful!
  State: True
  Remote: ('127.0.0.1', 8000)
```

**If 403 Error**:
1. Check backend logs for "✅ Connected to MQTT broker"
2. If not connected, restart Mosquitto with config
3. Restart backend

---

### Step 5: Publish Test Data

```powershell
# In same terminal as Step 4
python test_iot_system.py
```

**Choose**: Option 2 (Continuous stream)

**Backend should show**:
```
📨 RAW MQTT Message on topic 'farm/telemetry':
   Payload: {"farm_id":"farm_001",...}

======================================================================
🔔 MQTT MESSAGE RECEIVED - 18:25:30
======================================================================
📍 MQTT Farm ID:   farm_001
📍 Frontend ID:    80ac1084-67f8-4d05-ba21-68e3201213a8
💧 Moisture:       42.5%
🌡️  Temperature:    28.3°C
💨 Humidity:       65.2%
🟢 Nitrogen (N):   45 ppm
🟡 Phosphorus (P): 38 ppm
🔵 Potassium (K):  52 ppm
⏰ Timestamp:      2026-01-24T18:25:30Z
======================================================================

📡 Broadcasted sensor data to 80ac1084-67f8-4d05-ba21-68e3201213a8 (1 clients)
```

---

### Step 6: Start Frontend

```powershell
cd c:\code\Smart-Farming_HACK
npm run dev
```

**Expected**:
```
VITE v7.3.0  ready in 1021 ms

➜  Local:   http://localhost:5000/
➜  Network: http://192.168.x.x:5000/
```

---

### Step 7: Verify Frontend Connection

1. Open browser: `http://localhost:5000`
2. Press **F12** → **Console** tab
3. Look for:

```
[IoTService] Connecting to WebSocket: ws://localhost:8000/iot/ws/telemetry/80ac1084-67f8-4d05-ba21-68e3201213a8
[IoTService] ✅ WebSocket connected

======================================================================
🎯 FRONTEND RECEIVED SENSOR DATA
======================================================================
📍 Farm ID:        80ac1084-67f8-4d05-ba21-68e3201213a8
💧 Moisture:       42.5%
🌡️  Temperature:    28.3°C
💨 Humidity:       65.2%
🟢 NPK:            45
⏰ Timestamp:      2026-01-24T18:25:30Z
======================================================================
```

4. Check dashboard UI - should show:
   - 🟢 **Online** status badge
   - Real-time sensor values updating
   - Smooth animations

---

## 🔍 Diagnostic Commands

### Check if Mosquitto is Running
```powershell
Get-Process mosquitto -ErrorAction SilentlyContinue
```

### Check if Port 1883 is Listening
```powershell
netstat -ano | findstr :1883
```
Should show: `TCP    0.0.0.0:1883    0.0.0.0:0    LISTENING`

### Check if Backend is Running
```powershell
Get-Process python | Where-Object {$_.CommandLine -like "*uvicorn*"}
```

### Test MQTT Directly
```powershell
# Subscribe to all topics
mosquitto_sub -h 127.0.0.1 -t "farm/#" -v

# In another terminal, publish test message
mosquitto_pub -h 127.0.0.1 -t "farm/telemetry" -m '{"farm_id":"farm_001","moisture":50}'
```

### Test Backend API
```powershell
# Check if IoT routes are loaded
curl http://localhost:8000/docs

# Should show /iot/status, /iot/ws/telemetry/{farm_id}, etc.
```

---

## ✅ Success Checklist

- [ ] Mosquitto running on port 1883
- [ ] Backend shows "✅ Connected to MQTT broker"
- [ ] `debug_bridge.py quick` shows "✅ Connection successful!"
- [ ] Test script publishes data successfully
- [ ] Backend logs show "📡 Broadcasted sensor data to ... (1 clients)"
- [ ] Frontend loads without errors
- [ ] Browser console shows "✅ WebSocket connected"
- [ ] Dashboard shows "🟢 Online" status
- [ ] Sensor values update in real-time

---

## 🐛 Still Having Issues?

### MQTT Won't Connect (Error Code 7)

**Try this**:
1. Stop Mosquitto completely
2. Start with explicit config:
   ```powershell
   mosquitto -c mosquitto.conf -v
   ```
3. If still fails, try without config:
   ```powershell
   mosquitto -v
   ```
4. Check Mosquitto logs for "Client ... connected" messages

### WebSocket Still Shows 403

**Checklist**:
1. Backend MUST show "✅ Connected to MQTT broker"
2. If not connected, fix MQTT first
3. Restart backend after fixing MQTT
4. Verify routes loaded: `curl http://localhost:8000/docs`

### Frontend Shows "Offline"

**Checklist**:
1. Backend running? Check port 8000
2. WebSocket connected? Check browser console
3. Farm ID correct? Should be `80ac1084-67f8-4d05-ba21-68e3201213a8`
4. CORS issue? Check backend CORS config includes `http://localhost:5000`

---

## 📊 Expected Data Flow

```
Test Script (farm_001)
    ↓ MQTT Publish
Mosquitto Broker (127.0.0.1:1883)
    ↓ MQTT Subscribe
Backend MQTT Client
    ↓ Map farm_001 → UUID
Backend Router (handle_sensor_data)
    ↓ Broadcast
WebSocket Manager
    ↓ Send JSON
Frontend (UUID: 80ac1084-67f8-4d05-ba21-68e3201213a8)
    ↓ Update State
LiveSensorGrid Component
    ↓ Render
Dashboard UI ✨
```

---

**Last Updated**: 2026-01-24 18:25  
**Status**: All fixes applied, ready for testing  
**Estimated Time**: 10-15 minutes for complete restart and verification
