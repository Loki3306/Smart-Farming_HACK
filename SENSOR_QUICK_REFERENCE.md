# 📋 IoT Sensor Quick Reference Card

## 🔬 Sensor Specifications

### 1. **Soil Moisture Sensor**
- **Type**: Capacitive
- **Range**: 20-80%
- **Accuracy**: ±2%
- **Sampling**: 3 seconds
- **Critical Thresholds**:
  - 🔴 CRITICAL: <30%
  - 🟡 LOW: 30-40%
  - 🟢 OPTIMAL: 40-60%
  - 🔵 HIGH: 60-70%
  - ⚠️ SATURATED: >70%

---

### 2. **Temperature Sensor (DHT22/BME280)**
- **Type**: Digital
- **Range**: 15-35°C
- **Accuracy**: ±0.5°C
- **Sampling**: 3 seconds
- **Critical Thresholds**:
  - 🔵 COLD: <15°C
  - 🟢 OPTIMAL: 20-28°C
  - 🟡 WARM: 28-32°C
  - 🔴 HOT: >32°C

---

### 3. **Humidity Sensor**
- **Type**: Capacitive
- **Range**: 40-90%
- **Accuracy**: ±3%
- **Sampling**: 3 seconds
- **Critical Thresholds**:
  - 🔴 DRY: <40%
  - 🟢 OPTIMAL: 50-70%
  - 🟡 HUMID: 70-85%
  - ⚠️ SATURATED: >85%
- **Disease Risk**: >90% for 6+ hours → HIGH RISK

---

### 4. **NPK Sensor**
- **Type**: Analog (0-1023)
- **Range**: 0-1023 RAW
- **Conversion**: RAW → ppm (calibration curve)
- **Sampling**: 3 seconds
- **Typical Values**:
  - LOW: 0-300
  - MEDIUM: 300-600
  - HIGH: 600-1023

---

### 5. **EC (Salinity) Sensor**
- **Type**: Conductivity Probe
- **Range**: 0.5-3.5 dS/m
- **Accuracy**: ±0.1 dS/m
- **Sampling**: 3 seconds
- **Critical Thresholds**:
  - 🟢 NORMAL: <1.5 dS/m
  - 🟡 MODERATE: 1.5-2.5 dS/m
  - 🔴 HIGH: 2.5-3.5 dS/m
  - ⚠️ CRITICAL: >3.5 dS/m (Root burn risk)

---

### 6. **Wind Speed Sensor (Anemometer)**
- **Type**: Cup Anemometer
- **Range**: 0-35 km/h
- **Accuracy**: ±1 km/h
- **Sampling**: 3 seconds
- **Critical Thresholds**:
  - 🟢 CALM: 0-10 km/h
  - 🟡 MODERATE: 10-20 km/h
  - 🔴 HIGH: 20-30 km/h (SPRAY BLOCKED)
  - ⚠️ CRITICAL: >30 km/h (ALL OPERATIONS BLOCKED)

---

### 7. **Soil pH Sensor**
- **Type**: Glass Electrode
- **Range**: 5.5-8.5 pH
- **Accuracy**: ±0.1 pH
- **Sampling**: 3 seconds
- **Critical Thresholds**:
  - 🔴 ACIDIC: <5.5 (P & K locked)
  - 🟡 SLIGHTLY ACIDIC: 5.5-6.0
  - 🟢 OPTIMAL: 6.0-7.0
  - 🟡 SLIGHTLY ALKALINE: 7.0-7.5
  - 🔴 ALKALINE: >7.5 (P & K locked)

---

## 📊 Derived Metrics

### **ET₀ (Reference Evapotranspiration)**
- **Formula**: FAO-56 Penman-Monteith
- **Inputs**: Temperature, Humidity, Wind Speed
- **Unit**: mm/day
- **Typical Range**: 2-8 mm/day
- **Purpose**: Water demand forecasting

### **VPD (Vapor Pressure Deficit)**
- **Formula**: VPD = es × (1 - RH/100)
- **Inputs**: Temperature, Humidity
- **Unit**: kPa
- **Optimal Range**: 0.8-1.5 kPa
- **Purpose**: Plant stress indicator

### **LWD (Leaf Wetness Duration)**
- **Formula**: Continuous hours with RH > 90%
- **Inputs**: Humidity history (24h)
- **Unit**: hours
- **Disease Risk**: >6 hours → HIGH RISK

### **SSI (Soil Stress Index)**
- **Formula**: Weighted composite
  - Moisture stress: 40%
  - Salinity stress: 30%
  - pH stress: 20%
  - Temperature stress: 10%
- **Range**: 0-100
- **Levels**:
  - LOW: 0-30
  - MODERATE: 30-50
  - HIGH: 50-70
  - CRITICAL: 70-100

---

## 🚨 Alert Conditions

### **Immediate Action Required**
| Condition | Threshold | Action |
|-----------|-----------|--------|
| Critical Moisture | <30% | IRRIGATE NOW |
| Root Burn Risk | EC >2.5 + Moisture <40% | LEACH SOIL |
| High Wind | >20 km/h | BLOCK SPRAY |
| Nutrient Lockout | pH <5.5 or >7.5 | ADJUST pH |
| Disease Risk | LWD >6h | PREVENTIVE SPRAY |

### **Monitor Closely**
| Condition | Threshold | Action |
|-----------|-----------|--------|
| Low Moisture | 30-40% | PLAN IRRIGATION |
| High Salinity | 1.5-2.5 dS/m | MONITOR EC |
| Suboptimal pH | 5.5-6.0 or 7.0-7.5 | PLAN pH ADJUSTMENT |
| Moderate Wind | 10-20 km/h | DELAY SPRAY |

---

## 🔄 Data Update Frequency

| Component | Frequency | Latency |
|-----------|-----------|---------|
| Sensor Reading | 3 seconds | <10ms |
| MQTT Publish | 3 seconds | <10ms |
| Backend Processing | Real-time | <50ms |
| ML Inference | Per packet | <30ms |
| WebSocket Broadcast | Real-time | <100ms |
| Frontend Update | Real-time | <16ms |
| **Total End-to-End** | **~200ms** | **Sensor → Display** |

---

## 📈 Historical Trends

### **24-Hour Buffer**
- **Purpose**: LWD calculation, disease risk
- **Storage**: In-memory (agronomy_expert.py)
- **Size**: ~28,800 readings (24h × 3600s / 3s)

### **Learning Dataset**
- **Purpose**: ML model training
- **Storage**: agriculture_dataset.csv
- **Size**: Last 10,000 samples
- **Update**: Every 100 validated packets

---

## 🎯 Current System Status

**Last Reading** (Example from logs):
```
Farm ID:     farm_001
Timestamp:   2026-01-24T16:29:45.942593Z

Sensors:
  Moisture:   53.1% ✅ OPTIMAL
  Temp:       26.1°C ✅ GOOD
  Humidity:   41.9% ⚠️ LOW
  NPK:        389 RAW
  EC:         1.06 dS/m ✅ NORMAL
  Wind:       20.6 km/h 🚫 HIGH (SPRAY BLOCKED)
  pH:         8.1 ⚠️ ALKALINE (LOCKOUT)

Derived:
  ET₀:        4.23 mm/day
  VPD:        1.45 kPa ✅ GOOD
  LWD:        0 hours ✅ LOW RISK
  SSI:        23.3 ✅ LOW STRESS

Alerts:
  🚫 Wind Safety Lock ACTIVE
  🔒 Nutrient Lockout ACTIVE (P & K)
```

---

## 🛠️ Troubleshooting

### **Sensor Not Responding**
1. Check MQTT connection
2. Verify sensor wiring
3. Check power supply
4. Review backend logs

### **Erratic Readings**
1. Check sensor calibration
2. Verify environmental conditions
3. Look for electrical interference
4. Check data validation logs

### **ML Predictions Off**
1. Check drift warnings in logs
2. Verify sensor accuracy
3. Wait for incremental learning (100 packets)
4. Review bootstrap status

---

**Quick Reference Version**: v2.0  
**Last Updated**: 2026-01-24 22:11:23 IST  
**System Status**: 🟢 OPERATIONAL
