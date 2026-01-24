# 🎛️ Hybrid Actuation Bridge - Implementation Complete

## ✅ Implementation Summary

The **Hybrid Actuation Bridge** system has been successfully implemented, enabling Manual/Auto control of Irrigation and Fertilization via MQTT with full ESP32 integration.

---

## 📋 Components Implemented

### **1. Backend: Actuation Models** ✅
**File**: `backend/iot_irrigation/models.py`

```python
class ActuationCommand(BaseModel):
    farm_id: str
    action: str  # "irrigation" or "fertilization"
    value: bool  # True=ON, False=OFF
    mode: str    # "manual" or "auto"
    reason: Optional[str]
    timestamp: Optional[str]
```

---

### **2. Backend: MQTT Command Publisher** ✅
**File**: `backend/iot_irrigation/mqtt_client.py`

**Function**: `publish_actuation_command(farm_id, action, status)`

**Topic Structure**: `farm/{farm_id}/commands`

**Payload Example**:
```json
{
  "type": "ACTUATE",
  "device": "irrigation",
  "state": 1,
  "timestamp": "2026-01-24T22:30:00Z"
}
```

---

### **3. Backend: Control Endpoints** ✅
**File**: `backend/iot_irrigation/router.py`

#### **Manual Control Endpoint**
```
POST /iot/control
```

**Request Body**:
```json
{
  "farm_id": "80ac1084-67f8-4d05-ba21-68e3201213a8",
  "action": "irrigation",
  "value": true,
  "mode": "manual",
  "reason": "Manual activation"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "irrigation activated",
  "farm_id": "80ac1084-67f8-4d05-ba21-68e3201213a8",
  "mode": "manual"
}
```

**Safety Check**: Returns `403 Forbidden` if:
- Action = `fertilization`
- Value = `true` (ON)
- Wind speed > 20 km/h

**Error Response**:
```json
{
  "detail": "Fertilization blocked: Wind speed (25.3 km/h) exceeds safety threshold (20 km/h)"
}
```

---

#### **AI Auto-Logic** ✅
Integrated into `handle_sensor_data()` function:

**Irrigation Auto-Trigger**:
```python
if sensor_data.moisture < 35 AND mode == "auto":
    # Trigger irrigation
    logger.warning("AUTO-TRIGGER: Low moisture detected")
```

**Fertilization Auto-Trigger**:
```python
if NPK_status == "low" AND mode == "auto":
    # Check wind safety first
    if wind_speed <= 20:
        # Trigger fertilization
        logger.warning("AUTO-TRIGGER: Low NPK detected")
```

---

#### **Supabase Audit Logging** ✅
Every command (Manual or Auto) is logged to `commands_history` table:

```python
audit_entry = {
    "farm_id": "farm_001",
    "action": "irrigation",
    "value": True,
    "mode": "manual",
    "reason": "Manual trigger",
    "timestamp": "2026-01-24T22:30:00Z",
    "created_at": "2026-01-24T22:30:00Z"
}

supabase.table("commands_history").insert(audit_entry).execute()
```

---

### **4. Frontend: Command Center UI** ✅
**File**: `client/components/dashboard/CommandCenter.tsx`

**Features**:
- ✅ **Toggle Switches**: Manual/Auto mode for each system
- ✅ **Action Buttons**: Turn ON/OFF (enabled only in Manual mode)
- ✅ **Real-time LED Status**: 🟢 (ON) / ⚫ (OFF) with pulsing animation
- ✅ **WebSocket Feedback**: Listens for ESP32 acknowledgements
- ✅ **Error Display**: Shows 403 errors for wind safety blocks
- ✅ **Success Messages**: Confirms successful activations

**UI Layout**:
```
┌─────────────────────────────────────┐
│ 🎛️ Command Center                  │
│ Hybrid Manual/Auto Control          │
├─────────────────────────────────────┤
│ 💧 Irrigation System                │
│ [Manual] [Auto]                     │
│ 🟢 ACTIVE                           │
│ [▶️ Turn ON] [⏹️ Turn OFF]          │
├─────────────────────────────────────┤
│ 🌿 Fertilization System             │
│ [Manual] [Auto]                     │
│ ⚫ INACTIVE                          │
│ [▶️ Turn ON] [⏹️ Turn OFF]          │
│ ⚠️ Blocked if wind > 20 km/h        │
└─────────────────────────────────────┘
```

---

### **5. ESP32 Simulator** ✅
**File**: `backend/iot_irrigation/esp32_simulator.py`

**Features**:
- ✅ **Subscription**: `farm/+/commands`
- ✅ **LED Mapping**:
  - GPIO 18 → Irrigation LED
  - GPIO 19 → Fertilization LED
- ✅ **Command Processing**: Receives `ACTUATE` commands
- ✅ **State Management**: Updates GPIO states
- ✅ **Feedback Loop**: Publishes acknowledgement to `farm/telemetry`

**Acknowledgement Payload**:
```json
{
  "type": "STATUS",
  "irrigation": "ON",
  "farm_id": "farm_001",
  "timestamp": "2026-01-24T22:30:00Z"
}
```

**Visual Feedback**:
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

## 🔄 Complete Data Flow

```
┌─────────────────┐
│ Frontend UI     │
│ [Turn ON]       │
└────────┬────────┘
         │ POST /iot/control
         ▼
┌─────────────────┐
│ FastAPI Backend │
│ - Safety Check  │ ← Wind > 20 km/h? → 403 Error
│ - MQTT Publish  │
│ - Supabase Log  │
└────────┬────────┘
         │ MQTT: farm/farm_001/commands
         ▼
┌─────────────────┐
│ Mosquitto Broker│
└────────┬────────┘
         │ Subscribe
         ▼
┌─────────────────┐
│ ESP32 Simulator │
│ - Update GPIO   │
│ - LED Control   │
│ - Send ACK      │
└────────┬────────┘
         │ MQTT: farm/telemetry (STATUS)
         ▼
┌─────────────────┐
│ FastAPI Backend │
│ - Receive ACK   │
│ - Broadcast WS  │
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────┐
│ Frontend UI     │
│ LED: 🟢 GLOWING │
└─────────────────┘
```

---

## 🧪 Testing Instructions

### **1. Start All Services**

**Terminal 1 - Backend**:
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - ESP32 Simulator**:
```bash
cd backend/iot_irrigation
python esp32_simulator.py
```

**Terminal 3 - Frontend**:
```bash
npm run dev
```

---

### **2. Test Manual Control**

**Via Frontend**:
1. Open http://localhost:5173
2. Navigate to Command Center
3. Ensure "Manual" mode is selected
4. Click "Turn ON" for Irrigation
5. Observe:
   - ✅ LED changes to 🟢 GLOWING
   - ✅ ESP32 simulator logs command receipt
   - ✅ Acknowledgement sent back
   - ✅ Success message appears

**Via API (curl)**:
```bash
curl -X POST http://localhost:8000/iot/control \
  -H "Content-Type: application/json" \
  -d '{
    "farm_id": "80ac1084-67f8-4d05-ba21-68e3201213a8",
    "action": "irrigation",
    "value": true,
    "mode": "manual",
    "reason": "Test activation"
  }'
```

---

### **3. Test Safety Block**

**Scenario**: High wind blocks fertilization

**Steps**:
1. Wait for sensor data with wind > 20 km/h
2. Try to activate fertilization
3. Observe:
   - ❌ 403 Error returned
   - ❌ Error message displayed in UI
   - ❌ Command NOT sent to ESP32

**Expected Error**:
```
🚫 Fertilization blocked: Wind speed (25.3 km/h) exceeds safety threshold (20 km/h)
```

---

### **4. Test Auto Mode**

**Irrigation Auto-Trigger**:
1. Switch to "Auto" mode
2. Wait for moisture < 35%
3. Observe backend logs:
   ```
   ⚠️ AUTO-TRIGGER: Low moisture (32.5%) detected
   ```

**Fertilization Auto-Trigger**:
1. Switch to "Auto" mode
2. Wait for low NPK status
3. Observe backend logs:
   ```
   ⚠️ AUTO-TRIGGER: Low NPK detected (N:True, P:True, K:False)
   ```

---

## 📊 Database Schema

**Supabase Table**: `commands_history`

```sql
CREATE TABLE commands_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    value BOOLEAN NOT NULL,
    mode VARCHAR(10) NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_commands_farm_timestamp 
ON commands_history(farm_id, timestamp DESC);
```

---

## 🎯 Key Features

### ✅ **Manual Control**
- Direct user control via UI buttons
- Immediate MQTT command publishing
- Real-time LED feedback

### ✅ **Auto Mode**
- AI-driven triggers based on sensor data
- Moisture < 35% → Auto irrigation
- NPK low → Auto fertilization

### ✅ **Safety Interlocks**
- Wind > 20 km/h → Block fertilization
- Returns 403 error to UI
- Prevents dangerous operations

### ✅ **Audit Trail**
- All commands logged to Supabase
- Includes: farm_id, action, value, mode, reason, timestamp
- Enables compliance and debugging

### ✅ **Real-time Feedback**
- ESP32 sends acknowledgements
- WebSocket broadcasts status updates
- UI LED indicators update instantly

---

## 🔒 Safety Specifications

### **Wind Safety Lock**
```python
if action == "fertilization" and value == True:
    if wind_speed > 20:
        raise HTTPException(status_code=403)
```

**Blocked Operations**:
- Fertilization activation (manual or auto)
- Spray operations

**Allowed Operations**:
- Irrigation (not affected by wind)
- Fertilization deactivation (always allowed)

---

## 📱 Frontend Integration

**Add to Dashboard**:
```tsx
import { CommandCenter } from './components/dashboard/CommandCenter';

// In your dashboard component:
<CommandCenter farmId="80ac1084-67f8-4d05-ba21-68e3201213a8" />
```

**WebSocket Event Handling**:
```typescript
// Listen for STATUS acknowledgements
window.addEventListener('iot-data', (event: any) => {
    const data = event.detail;
    
    if (data.type === 'STATUS') {
        // Update LED indicators
        if (data.irrigation === 'ON') {
            setIrrigationLED('🟢');
        }
    }
});
```

---

## 🚀 Production Deployment

### **Environment Variables**
```bash
# .env
MQTT_BROKER_HOST=your-broker-host
MQTT_BROKER_PORT=1883
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

### **ESP32 Configuration**
```cpp
// ESP32 Arduino Code
#define IRRIGATION_LED 18
#define FERTILIZATION_LED 19

void setup() {
    pinMode(IRRIGATION_LED, OUTPUT);
    pinMode(FERTILIZATION_LED, OUTPUT);
    
    // Subscribe to commands
    mqtt.subscribe("farm/farm_001/commands");
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
    // Parse JSON
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload, length);
    
    if (doc["type"] == "ACTUATE") {
        String device = doc["device"];
        int state = doc["state"];
        
        if (device == "irrigation") {
            digitalWrite(IRRIGATION_LED, state);
        } else if (device == "fertilization") {
            digitalWrite(FERTILIZATION_LED, state);
        }
        
        // Send acknowledgement
        sendAcknowledgement(device, state);
    }
}
```

---

## 📈 Success Metrics

| Feature | Status | Test Result |
|---------|--------|-------------|
| Manual Control | ✅ | Commands sent successfully |
| Auto Mode | ✅ | Triggers detected in logs |
| Safety Lock | ✅ | 403 errors on high wind |
| MQTT Publishing | ✅ | Messages delivered |
| ESP32 Simulation | ✅ | GPIO states updated |
| Acknowledgements | ✅ | STATUS messages received |
| Supabase Logging | ✅ | Audit trail created |
| Frontend UI | ✅ | LEDs update in real-time |

---

## 🎉 Implementation Complete!

The **Hybrid Actuation Bridge** is now fully operational with:

- ✅ Manual/Auto control modes
- ✅ MQTT command publishing
- ✅ ESP32 GPIO simulation
- ✅ Safety interlocks (wind blocks)
- ✅ Supabase audit logging
- ✅ Real-time WebSocket feedback
- ✅ Production-ready frontend UI

**System Status**: 🟢 **READY FOR DEPLOYMENT**
