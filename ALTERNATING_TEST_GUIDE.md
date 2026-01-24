# 🔄 Alternating IoT Test - Quick Guide

## 🎯 Purpose

Tests frontend color changes by alternating between:
- **🟢 NORMAL** values (4-5 cycles) - Green indicators
- **🔴 CRITICAL** values (1-2 cycles) - Red indicators/alerts

---

## 🚀 How to Run

```bash
cd backend/iot_irrigation
python alternating_test.py
```

---

## 📊 Test Pattern

```
Cycle 1-4:  🟢 NORMAL  (moisture 50-70%, temp 22-28°C, etc.)
Cycle 5-6:  🔴 CRITICAL (moisture 15-30%, temp 33-38°C, etc.)
Cycle 7-10: 🟢 NORMAL
Cycle 11-12: 🔴 CRITICAL
... (repeats)
```

---

## 🎨 Expected Frontend Behavior

### **During NORMAL Cycles** (🟢)
- Water circle: **GREEN** (50-70%)
- Temperature: **GREEN** (22-28°C)
- NPK bars: **GREEN** (400-600)
- Wind: **GREEN** (5-15 km/h)
- pH: **GREEN** (6.5-7.2)
- No alerts or warnings

### **During CRITICAL Cycles** (🔴)
- Water circle: **RED** (15-30%) ← **THIS SHOULD TURN RED!**
- Temperature: **RED** (33-38°C) + warning
- NPK bars: **RED/LOW** (30-80)
- Wind: **RED** (22-35 km/h) + "SPRAY BLOCKED"
- pH: **RED** (4.8-5.3) + "LOCKOUT ZONE"
- Multiple alerts triggered

---

## 🔍 What to Watch For

### **Water Circle (Gauge)**
✅ Should change color based on moisture:
- 🟢 **Green**: 50-70% (normal)
- 🔴 **Red**: 15-30% (critical)

### **Alert Banners**
✅ Should appear during critical cycles:
- "🚨 LOW MOISTURE ALERT"
- "🔥 HIGH TEMPERATURE WARNING"
- "🚫 FERTILIZATION BLOCKED (High Wind)"
- "🔒 NUTRIENT LOCKOUT (pH)"

### **NPK Bars**
✅ Should change height and color:
- 🟢 **Tall/Green**: 400-600 (normal)
- 🔴 **Short/Red**: 30-80 (critical)

---

## 📝 Sample Output

```
======================================================================
🟢 CYCLE #1 - NORMAL MODE
======================================================================
💧 Moisture:    60.8% 🟢
🌡️  Temp:        24.5°C 🟢
💨 Humidity:    63.4% 🟢
🟢 NPK:         469 🟢
🧂 EC:          1.25 dS/m 🟢
🌬️  Wind:        12.0 km/h 🟢
🧪 pH:          7.1 🟢
======================================================================

... (3 more normal cycles)

⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️
⚠️  SWITCHING TO CRITICAL MODE (RED VALUES)
⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️

======================================================================
🔴 CYCLE #5 - CRITICAL MODE
======================================================================
💧 Moisture:    22.3% 🔴 LOW!
🌡️  Temp:        35.2°C 🔴 HOT!
💨 Humidity:    32.1% 🔴 DRY!
🟢 NPK:         45 🔴 LOW!
🧂 EC:          3.4 dS/m 🔴 HIGH!
🌬️  Wind:        28.5 km/h 🔴 BLOCKED!
🧪 pH:          5.1 🔴 LOCKOUT!

🎨 Expected Frontend:
   🔴 Water circle: RED (moisture 22.3%)
   🔴 Temperature: RED warning
   🔴 NPK bars: RED/low
   🚫 Fertilization: BLOCKED
   🔒 Nutrient lockout: ACTIVE
======================================================================
```

---

## ⚙️ Configuration

Edit `alternating_test.py` to customize:

```python
# Normal values (GREEN)
NORMAL_VALUES = {
    "moisture": lambda: random.uniform(50, 70),  # Healthy range
    "temp": lambda: random.uniform(22, 28),
    ...
}

# Critical values (RED)
CRITICAL_VALUES = {
    "moisture": lambda: random.uniform(15, 30),  # Low - triggers alerts
    "temp": lambda: random.uniform(33, 38),      # Hot - triggers warnings
    ...
}
```

---

## 🐛 Troubleshooting

### **Water Circle Not Turning Red**
**Possible Causes**:
1. Gauge component not updating colors based on value
2. Thresholds not configured correctly
3. Component not re-rendering

**Check**:
- Open browser console (F12)
- Look for moisture value updates
- Verify Gauge component receives new values

### **No Alerts Appearing**
**Possible Causes**:
1. Alert thresholds too low/high
2. Alert component not listening to sensor data
3. WebSocket not connected

**Check**:
- Verify WebSocket connection in console
- Check backend logs for alert triggers
- Ensure alert components are mounted

---

## ✅ Success Criteria

The test is working correctly if you see:

- ✅ Water circle changes from **GREEN** to **RED** every 4-5 cycles
- ✅ Alert banners appear during critical cycles
- ✅ NPK bars shrink and turn red
- ✅ Wind safety lock activates (fertilization blocked)
- ✅ pH lockout warning appears
- ✅ All values return to normal after 1-2 critical cycles

---

## 🎉 Summary

**Alternating Test Features**:
- ✅ Automatic normal/critical switching
- ✅ 4-5 normal cycles → 1-2 critical cycles
- ✅ 3-second interval
- ✅ Visual indicators in console
- ✅ Expected frontend behavior logged
- ✅ Tests all color change scenarios

**Use this test to verify**:
- Frontend color changes work correctly
- Alerts trigger at proper thresholds
- Water circle updates and changes color
- Safety locks activate properly

Run it and watch your dashboard transform from green to red and back! 🔄
