# Smart Farming System - Problem Statement Analysis

## Executive Summary
You're building a **data-driven agricultural management system** where:
1. Farmer creates profile & validates identity
2. Connects soil sensor to farm
3. Gets real-time soil profile data
4. Combines with GPS location + weather data
5. Automates irrigation/fertilization decisions

**Current Issue:** The onboarding form collects data that doesn't align with this flow.

---

## Current Farmer Data Collection (PROBLEMATIC)

### Signup (Auth step)
- Full Name
- Email
- Password
- Phone Number
- Country (always "India")
- State
- Experience Level (beginner/intermediate/experienced)

### Farm Onboarding (Post-signup, 4 steps)
- **Step 1 - Farm Basics:**
  - Farm name
  - Farm location (village/city)
  - State
  - Latitude/Longitude (optional GPS)
  - Total area + unit (acres/hectares)
  - Soil type (dropdown from SOIL_TYPES_INDIA)

- **Step 2 - Crop & Irrigation:**
  - Primary crop
  - Crop season (kharif/rabi/zaid)
  - Sowing date
  - Irrigation type (drip/sprinkler/flood)
  - Water source (borewell/well/canal/etc)

- **Step 3 - System Preferences:**
  - Default mode (autonomous/manual)
  - Alert preference (only dashboard-only for now)
  - Measurement units (metric/imperial)

- **Step 4:** Complete & redirect to dashboard

---

## Problems Identified

### 1. **Premature Soil Type Collection**
- ❌ Asking farmer to GUESS soil type before sensor connection
- ❌ Self-reported soil type ≠ actual soil profile from sensor
- ✅ Should be: Let sensor provide soil composition (clay%, sand%, silt%, pH, organic matter, etc.)

### 2. **Missing Sensor Integration**
- ❌ No step to **connect/register soil sensor**
- ❌ No sensor ID/MAC address capture
- ❌ No sensor type/brand selection
- ✅ Should be: Step specifically for sensor pairing/validation

### 3. **Location Ambiguity**
- ❌ "Farm Location (Village/City)" is TEXT field → GPS coords are optional
- ❌ If farmer enters wrong village name, GPS pairing with weather fails
- ✅ Should be: Require GPS coordinates (with address reverse-lookup validation)

### 4. **Crop & Irrigation Assumptions**
- ❌ Asking about irrigation TYPE before understanding actual water availability
- ❌ What if sensor shows soil is already wet from rain?
- ❌ Sowing date doesn't help if farmer can't recall exact date
- ✅ Should be: Secondary info, based on initial profile & sensor readings

### 5. **Validation Gaps**
- ❌ No farmer verification (are you actually the farm owner?)
- ❌ No farm size validation (sensor coverage vs total area)
- ❌ No water source verification (can GPS + weather data confirm?)
- ✅ Should be: Cross-validate with official farm records or phone verification

### 6. **Missing Critical Info**
- ❌ Number of farms (one farmer = multiple farms)
- ❌ Sensor location on farm (affects readings)
- ❌ Historic yield/crop data (for predictions)
- ❌ Budget constraints (for recommendations)
- ❌ Preferred language for alerts
- ✅ Should be: Phased data collection

---

## Proposed Better Data Collection Flow

### **Phase 1: Identity & Validation** (Signup)
Establish WHO the farmer is:
```
- Full Name (required)
- Phone Number (required - for OTP verification)
- Email (required - backup communication)
- State/District (required - for regional weather APIs)
- Age/Gender (optional - for user research)
- Preferred Language (Hindi/English/Regional)
- Farm Type (subsistence/commercial/mixed)
```

### **Phase 2: Farm Identification** (New Onboarding)
Establish WHICH farm(s):
```
- Number of farms (1, 2, 3, or more)
- Farm Legal ID (land record number) - for verification
- Farm Name (local name given by farmer)
- GPS Coordinates (required - multiple waypoints for large farms)
  - Use map-based selection (not text input)
  - Show satellite view to confirm
  - Validate against weather API coverage
- Total Area (acres/hectares) - validate against legal records
- Altitude (auto-fetch from GPS)
- Annual Rainfall Zone (auto-fetch from weather API based on coordinates)
```

### **Phase 3: Sensor Connection** (CRITICAL NEW STEP)
Establish WHAT sensors they have:
```
- Sensor Type (Soil Moisture, Soil Temp, EC, pH, Weather Station, etc)
- Sensor Model/Brand
- Sensor Serial Number / MAC Address
- Sensor Location on Farm
  - Map pinpoint on farm GPS area
  - Distance from farm center
- Expected Delivery Date (if not yet received)
- Sensor Mounting Method (buried at X cm depth, surface, etc)
```

### **Phase 4: Baseline Farm Profile** (Post-sensor data)
Establish WHAT grows there:
```
- Historical Primary Crop (past 2-3 years)
- Current Crop (if any)
- Planned Crop for next season
- Crop Rotation Pattern
- Soil Type (PRE-FILLED from sensor → ignore manual selection)
  - Texture (% clay, sand, silt from sensor)
  - pH (from sensor)
  - Organic Matter % (from sensor)
- Water Source
  - Primary: borewell/well/canal/rainwater/tanker
  - Secondary backup
  - Average depth (for borewell)
```

### **Phase 5: Irrigation Strategy** (Dynamic)
Establish HOW they irrigate:
```
- Irrigation System Type (drip/sprinkler/flood/micro/none)
- Coverage Area (% of farm)
- Water Availability Window (peak hours when water available)
- Monthly Water Budget (cost/availability constraint)
- Equipment Age & Condition
```

### **Phase 6: System Preferences** (User Control)
Establish WHAT they want:
```
- Operation Mode: Autonomous vs Manual-with-suggestions vs Manual-only
- Alert Channels: SMS/WhatsApp/In-App/None
- Alert Frequency: High/Medium/Low
- Notification Language
- Auto-Irrigation Thresholds (soil moisture %, frequency, duration)
- Allow Fertilizer Recommendations: Yes/No
```

---

## Validation Rules (Critical)

### GPS Validation
```
✓ Coordinates must be within India bounds
✓ Must be in selected state/district
✓ Must resolve to valid address
✓ Weather API must have data for coordinates
```

### Farm Size Validation
```
✓ Area must be > 0.1 acres (minimal micro-farming)
✓ Area must be < 10,000 acres (reasonable for 1 farmer)
✓ Sensor coverage: 1 sensor typically monitors 2-5 acres
✓ Warn if farm too large for sensor count
```

### Sensor Validation
```
✓ Serial number must be unique to that farmer
✓ Sensor must be reachable (ping MAC address)
✓ Initial readings must be valid (within sensor specs)
```

### Experience-Based Defaults
```
Beginner:
- Default to Manual + Suggestions mode
- Frequent alerts (daily)
- Conservative thresholds

Intermediate:
- Default to Autonomous mode
- Moderate alerts (every 3 days)
- Standard thresholds

Experienced:
- Autonomous mode
- Minimal alerts (issues only)
- Custom thresholds
```

---

## Data Model Structure

### User (Signup)
```typescript
interface Farmer {
  id: string;
  fullName: string;
  phoneNumber: string; // verified via OTP
  email: string;
  state: string;
  district: string;
  preferredLanguage: 'hi' | 'en' | 'other';
  experienceLevel: 'beginner' | 'intermediate' | 'experienced';
  farmType: 'subsistence' | 'commercial' | 'mixed';
  createdAt: Date;
  profileCompletionStep: 1 | 2 | 3 | 4 | 5 | 6; // track progress
}
```

### Farm (Phase 2)
```typescript
interface Farm {
  id: string;
  farmerId: string;
  legalId?: string; // land record number
  name: string;
  gpsCoordinates: [number, number][]; // array of waypoints
  area: { value: number; unit: 'acres' | 'hectares' };
  altitude: number; // meters, auto-detected
  annualRainfallZone: string;
  timezone: string;
  createdAt: Date;
}
```

### Sensor (Phase 3)
```typescript
interface Sensor {
  id: string;
  farmId: string;
  type: 'soil_moisture' | 'soil_temp' | 'ec' | 'ph' | 'weather_station';
  brand: string;
  serialNumber: string;
  macAddress?: string;
  farmLocation: {
    coordinates: [number, number];
    depthCm?: number;
    description: string;
  };
  installationDate: Date;
  status: 'pending' | 'connected' | 'offline' | 'error';
  lastReading: {
    timestamp: Date;
    values: Record<string, number>;
  };
}
```

### FarmProfile (Phase 4 - post sensor)
```typescript
interface FarmProfile {
  id: string;
  farmId: string;
  soilProfile: {
    texture: { clay: number; sand: number; silt: number };
    pH: number;
    organicMatter: number;
    ec: number;
    calibratedAt: Date;
  };
  crops: {
    historical: string[];
    current?: string;
    planned?: string;
    rotationPattern?: string;
  };
  waterSource: {
    primary: string;
    secondary?: string;
    depth?: number; // for borewell
  };
}
```

### IrrigationStrategy (Phase 5)
```typescript
interface IrrigationStrategy {
  id: string;
  farmId: string;
  systemType: 'drip' | 'sprinkler' | 'flood' | 'micro' | 'none';
  coveragePercent: number;
  waterAvailabilityWindow: { start: string; end: string }; // HH:MM
  monthlyBudget?: { amount: number; currency: string };
  equipmentCondition: 'new' | 'good' | 'fair' | 'old';
}
```

### SystemPreferences (Phase 6)
```typescript
interface SystemPreferences {
  id: string;
  farmId: string;
  operationMode: 'autonomous' | 'manual_suggestions' | 'manual_only';
  alertChannels: ('sms' | 'whatsapp' | 'in_app')[];
  alertFrequency: 'high' | 'medium' | 'low';
  autoIrrigationThresholds: {
    soilMoistureMin: number; // percentage
    frequency: number; // hours
    duration: number; // minutes
  };
  allowFertilizerRecommendations: boolean;
}
```

---

## Implementation Priority

### Must Have (MVP)
1. ✅ Signup with phone verification
2. ✅ GPS-based farm identification
3. ✅ Sensor connection & validation
4. ✅ Get initial soil readings from sensor
5. ✅ Display soil profile (not manually entered)

### Should Have
1. Legal farm ID verification
2. Experience-based defaults
3. Sensor health monitoring
4. Weather API integration

### Nice to Have
1. Multiple farm management
2. Crop recommendation engine
3. Historic yield predictions
4. Community benchmarking

---

## Key Changes Summary

| Aspect | Current | Proposed |
|--------|---------|----------|
| Soil Type | Manual dropdown | Auto from sensor |
| GPS | Optional text + optional map | Required map selection with validation |
| Sensor Setup | Missing | Dedicated Phase 3 |
| Validation | Minimal | GPS coords + address + sensor reach |
| Data Order | Random | Logical (who → which → what sensors → what grows) |
| Phasing | Single flow | 6 progressive phases |
| Default Values | Arbitrary | Experience-based |
| Sensor Data | Not stored | Central to entire system |

---

## Next Steps

1. **Update AuthService & User model** - add verification state
2. **Create Phase 2-6 components** - refactor FarmOnboarding
3. **Add Sensor entity** - database schema + service
4. **Implement GPS validation** - map component + weather API check
5. **Add data persistence** - backend endpoints for each phase
6. **Phone OTP verification** - SMS integration
