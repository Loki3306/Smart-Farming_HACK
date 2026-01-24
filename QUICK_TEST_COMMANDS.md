# 🎯 Quick Test Commands - Copy & Paste

## Current Location Issue
You're in `backend/` but the test scripts are in `backend/iot_irrigation/`

---

## ✅ Correct Commands

### Test WebSocket Connection
```powershell
cd c:\code\Smart-Farming_HACK\backend\iot_irrigation
python debug_bridge.py quick
```

### Publish Test Data
```powershell
cd c:\code\Smart-Farming_HACK\backend\iot_irrigation
python test_iot_system.py
```

### Check Backend Status
```powershell
# Check if backend is running
Get-Process python | Where-Object {$_.CommandLine -like "*uvicorn*"}

# Check if port 8000 is listening
netstat -ano | findstr :8000
```

### Check MQTT Broker
```powershell
# Check if Mosquitto is running
Get-Process mosquitto -ErrorAction SilentlyContinue

# Check if port 1883 is listening
netstat -ano | findstr :1883
```

---

## 🔍 Diagnose WebSocket 403 Error

The 403 error means **MQTT is not connected**. Check backend logs for:

### ✅ Success Logs (What You Want to See)
```
🆔 MQTT Client ID: smart-farming-backend-a1b2c3d4
🔌 Connecting to MQTT broker at 127.0.0.1:1883...
✅ MQTT client started successfully
✅ Connected to MQTT broker at 127.0.0.1:1883
📡 Subscribed to topic: farm/telemetry
```

### ❌ Failure Logs (What Indicates Problem)
```
⚠️ Unexpected MQTT disconnection. Code: 7
❌ Failed to connect to MQTT broker
Connection refused (client ID conflict or broker issue)
```

---

## 🚀 If MQTT Not Connected

### Step 1: Restart Mosquitto
```powershell
# Kill existing Mosquitto (if running)
taskkill /F /IM mosquitto.exe

# Start with config
cd c:\code\Smart-Farming_HACK
mosquitto -c mosquitto.conf -v
```

### Step 2: Restart Backend
```powershell
# The backend should auto-reload
# Or manually restart:
cd c:\code\Smart-Farming_HACK\backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Test Again
```powershell
cd c:\code\Smart-Farming_HACK\backend\iot_irrigation
python debug_bridge.py quick
```

---

## 📊 Expected Flow

```
1. Mosquitto running on port 1883
   ↓
2. Backend connects to Mosquitto
   ↓
3. Backend shows "✅ Connected to MQTT broker"
   ↓
4. WebSocket endpoint becomes available
   ↓
5. debug_bridge.py shows "✅ Connection successful!"
   ↓
6. test_iot_system.py can publish data
   ↓
7. Frontend receives real-time updates
```

---

## 🎯 One-Line Test (After MQTT is Connected)

```powershell
cd c:\code\Smart-Farming_HACK\backend\iot_irrigation && python debug_bridge.py quick && python test_iot_system.py
```

---

## 📝 Notes

- **All fixes are in place** - The code is correct
- **The only issue** - MQTT broker connection
- **Once MQTT connects** - Everything will work

---

**Quick Check**: Look at your backend terminal. Do you see "✅ Connected to MQTT broker"?
- **YES** → WebSocket should work, try `debug_bridge.py` again
- **NO** → Mosquitto isn't running or refusing connections
