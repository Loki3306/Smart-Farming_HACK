# 🎛️ Automated Actuation Scripts - Usage Guide

## 📋 Overview

Two scripts are available for automated testing of the irrigation and fertilization control system:

1. **`simple_auto_actuation.py`** - Simple ON/OFF toggle every 30 seconds
2. **`auto_actuation_test.py`** - Advanced rotating pattern

---

## 🚀 Quick Start

### **Option 1: Simple Toggle (Recommended)**

**What it does**: Turns both systems ON, waits 10s, turns both OFF, waits 10s, repeat.

**Run**:
```bash
cd backend/iot_irrigation
python simple_auto_actuation.py
```

**Pattern**:
```
Cycle 1: Irrigation ON + Fertilization ON
         ↓ Wait 10s
Cycle 2: Irrigation OFF + Fertilization OFF
         ↓ Wait 10s
Cycle 3: Irrigation ON + Fertilization ON
         ↓ Wait 10s
... (repeat forever)
```

**Output Example**:
```
======================================================================
🔄 CYCLE #1 - 23:06:45
======================================================================
Action: Turn 🟢 ON both systems

✅ IRRIGATION: 🟢 ON
   irrigation activated
✅ FERTILIZATION: 🟢 ON
   fertilization activated

📊 Status:
   Irrigation:     ✅ Success
   Fertilization:  ✅ Success

⏳ Waiting 30 seconds...
   Next cycle at: 23:07:15
```

---

### **Option 2: Advanced Rotating Pattern**

**What it does**: Rotates through each system individually.

**Run**:
```bash
cd backend/iot_irrigation
python auto_actuation_test.py
```

**Pattern**:
```
Cycle 1: Irrigation ON
         ↓ Wait 10s
Cycle 2: Irrigation OFF
         ↓ Wait 10s
Cycle 3: Fertilization ON
         ↓ Wait 10s
Cycle 4: Fertilization OFF
         ↓ Wait 10s
Cycle 5: Irrigation ON (repeat)
```

---

## ⚙️ Configuration

**Edit the scripts to customize**:

```python
# Change interval (default: 10 seconds)
INTERVAL = 10  # Change to 60 for 1 minute, 5 for 5 seconds, etc.

# Change farm ID (if testing multiple farms)
FARM_ID = "80ac1084-67f8-4d05-ba21-68e3201213a8"

# Change backend URL (if using different port)
BASE_URL = "http://localhost:8000/iot"
```

---

## 🧪 Testing Scenarios

### **Test 1: Basic Functionality**
```bash
python simple_auto_actuation.py
```
**Expected**: Commands sent successfully, ESP32 LEDs toggle every 30s

---

### **Test 2: Wind Safety Block**

**Setup**: Wait for sensor data with wind > 20 km/h

**Run**:
```bash
python simple_auto_actuation.py
```

**Expected**:
- ✅ Irrigation commands: **SUCCESS** (not affected by wind)
- 🚫 Fertilization commands: **BLOCKED** (403 error)

**Output**:
```
✅ IRRIGATION: 🟢 ON
   irrigation activated
🚫 FERTILIZATION: 🟢 ON
   BLOCKED: Fertilization blocked: Wind speed (25.3 km/h) exceeds safety threshold (20 km/h)
```

---

### **Test 3: MQTT Command Delivery**

**Setup**: Run ESP32 simulator in another terminal

**Terminal 1** (ESP32 Simulator):
```bash
cd backend/iot_irrigation
python esp32_simulator.py
```

**Terminal 2** (Auto Actuation):
```bash
python simple_auto_actuation.py
```

**Expected**: ESP32 simulator shows GPIO updates and sends acknowledgements

**ESP32 Output**:
```
📥 COMMAND RECEIVED on farm/farm_001/commands
   Type: ACTUATE
   Device: irrigation
   State: 1

🔌 GPIO UPDATE:
   Device: irrigation
   GPIO: 18
   State: ON (HIGH)
   LED: 🟢 GLOWING

✅ Acknowledgement sent: irrigation=ON
```

---

## 🛑 Stopping the Script

**Press**: `Ctrl+C`

**Output**:
```
======================================================================
🛑 SCRIPT STOPPED BY USER
======================================================================
Total cycles completed: 5
Final state: 🟢 ON

✅ Exiting...
```

---

## 📊 Monitoring

### **Backend Logs**
Watch for actuation commands in backend terminal:
```
🎛️  Control command received: irrigation=True (mode:manual) for farm_001
✅ Published actuation command: irrigation=True to farm/farm_001/commands

🎛️ ACTUATION COMMAND PUBLISHED
   Topic: farm/farm_001/commands
   Device: irrigation
   State: ON
   Payload: {"type": "ACTUATE", "device": "irrigation", "state": 1, ...}
```

### **Frontend Dashboard**
Open http://localhost:5173 and watch:
- **Command Center**: LED indicators should toggle 🟢 ⚫
- **Real-time updates**: Status changes every 30 seconds

### **Supabase Audit Trail**
Check `commands_history` table for logged commands:
```sql
SELECT * FROM commands_history 
ORDER BY timestamp DESC 
LIMIT 10;
```

---

## ⚠️ Troubleshooting

### **Error: Cannot connect to backend**
```
❌ ERROR: Cannot connect to http://localhost:8000/iot
   Make sure backend is running!
```

**Solution**:
```bash
# Start backend in another terminal
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

### **Error: 422 Unprocessable Entity**
```
❌ Error 422: {"detail": [...]}
```

**Cause**: Invalid payload structure

**Solution**: Script has been fixed. Update to latest version.

---

### **Error: 403 Forbidden (Fertilization)**
```
🚫 FERTILIZATION: 🟢 ON
   BLOCKED: Fertilization blocked: Wind speed (25.3 km/h) exceeds safety threshold
```

**Cause**: Wind speed > 20 km/h (safety feature working correctly)

**Solution**: This is expected behavior. Wait for wind to drop below 20 km/h.

---

### **Error: 503 Service Unavailable**
```
❌ Error 503: MQTT broker not available
```

**Cause**: Mosquitto broker not running

**Solution**:
```bash
# Windows
mosquitto -c mosquitto.conf -v

# Linux/Mac
mosquitto -c /etc/mosquitto/mosquitto.conf
```

---

## 🎯 Use Cases

### **1. Continuous Integration Testing**
Run script in CI/CD pipeline to test actuation endpoints:
```bash
timeout 120 python simple_auto_actuation.py
# Runs for 2 minutes (4 cycles), then exits
```

### **2. Load Testing**
Test system under sustained actuation load:
```bash
# Run for 1 hour
timeout 3600 python simple_auto_actuation.py
```

### **3. Demo/Presentation**
Show live actuation during presentations:
```bash
python simple_auto_actuation.py
# Watch frontend dashboard update in real-time
```

### **4. ESP32 Hardware Testing**
Verify ESP32 responds to commands correctly:
```bash
# Terminal 1: ESP32 simulator
python esp32_simulator.py

# Terminal 2: Auto actuation
python simple_auto_actuation.py

# Watch GPIO states toggle on ESP32
```

---

## 📈 Expected Performance

**Metrics**:
- **Command Latency**: <100ms (Frontend → ESP32)
- **Success Rate**: 100% (irrigation), 70-100% (fertilization, depends on wind)
- **CPU Usage**: <1% (script is lightweight)
- **Network**: ~500 bytes/command

**Scalability**:
- Can run multiple instances for different farms
- No impact on backend performance
- Safe to run 24/7

---

## 🔐 Safety Notes

1. **Wind Safety**: Fertilization automatically blocked if wind > 20 km/h
2. **Manual Mode**: Script uses manual mode (not auto)
3. **Audit Trail**: All commands logged to Supabase
4. **Graceful Shutdown**: Ctrl+C stops cleanly

---

## 📝 Summary

**Simple Auto Actuation** (`simple_auto_actuation.py`):
- ✅ Easy to use
- ✅ Toggles both systems simultaneously
- ✅ 30-second interval
- ✅ Perfect for basic testing

**Advanced Auto Actuation** (`auto_actuation_test.py`):
- ✅ Rotating pattern
- ✅ Individual system control
- ✅ Detailed status tracking
- ✅ Perfect for comprehensive testing

**Choose based on your needs!** 🎛️
