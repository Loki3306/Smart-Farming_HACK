# Smart Farming - Implementation Checklist & Tracking

Use this document to track your progress through the refactoring.

---

## WEEK 1: GPS & Basic Validation

### Frontend Tasks
- [ ] **1.1** Read IMPLEMENTATION_GUIDE.md section "Week 1"
- [ ] **1.2** Install map library (Google Maps or Leaflet)
  - [ ] Choose library (Google Maps recommended for India)
  - [ ] Add API key to .env
  - [ ] Test map loads
- [ ] **1.3** Create MapPicker component
  - [ ] Component accepts lat/lng as input
  - [ ] Component returns lat/lng on click
  - [ ] Shows marker on selected location
  - [ ] Supports search (town name)
  - [ ] Supports GPS button (geolocation API)
  - [ ] Test: Can click to select
  - [ ] Test: Can search for "Pune"
  - [ ] Test: GPS button works on mobile
- [ ] **1.4** Refactor FarmOnboarding.tsx Step 1
  - [ ] Remove text field for location
  - [ ] Add MapPicker component
  - [ ] Make latitude/longitude REQUIRED
  - [ ] Add address reverse-lookup
  - [ ] Show coordinates
  - [ ] Test form submission
- [ ] **1.5** Update validation rules
  - [ ] Latitude must be between 8-35 (India)
  - [ ] Longitude must be between 68-97 (India)
  - [ ] Must match selected state/district
  - [ ] Test validation with invalid coords
- [ ] **1.6** Test on mobile devices
  - [ ] Map loads on mobile
  - [ ] Can tap to select location
  - [ ] GPS button works
  - [ ] Keyboard doesn't block map
  - [ ] Test on 2 different phones (iOS + Android)

### Backend Tasks
- [ ] **1.7** Update database schema
  ```sql
  ALTER TABLE farms 
  MODIFY COLUMN latitude DECIMAL(10,8) NOT NULL,
  MODIFY COLUMN longitude DECIMAL(11,8) NOT NULL;
  ```
- [ ] **1.8** Add address column (for reverse-lookup)
  ```sql
  ALTER TABLE farms ADD COLUMN address VARCHAR(500);
  ```
- [ ] **1.9** Implement reverse-geocoding API call
  - [ ] Create utility function to call Google Maps Reverse Geocoding
  - [ ] Return formatted address
  - [ ] Test with sample coordinates
- [ ] **1.10** Update farm creation endpoint
  - [ ] Accept latitude/longitude as required
  - [ ] Call reverse-geocoding
  - [ ] Save address to database
  - [ ] Validate coordinates in India
  - [ ] Validate matches state/district
  - [ ] Test endpoint with valid/invalid coords

### Testing
- [ ] **1.11** Unit tests
  - [ ] Test MapPicker component renders
  - [ ] Test click sets coordinates
  - [ ] Test search works
  - [ ] Test GPS button triggers geolocation
- [ ] **1.12** Integration tests
  - [ ] Test form submission with GPS coords
  - [ ] Test form rejects invalid coords
  - [ ] Test API saves coordinates
  - [ ] Test address reverse-lookup saved
- [ ] **1.13** Manual testing
  - [ ] Test on desktop (Chrome, Firefox)
  - [ ] Test on mobile (Safari, Chrome Android)
  - [ ] Test with and without GPS permission
  - [ ] Test with slow internet (throttle network)
  - [ ] Test 5 different locations in India

### Deploy
- [ ] **1.14** Code review
  - [ ] Ask teammate to review MapPicker
  - [ ] Ask teammate to review validation
  - [ ] Fix feedback
- [ ] **1.15** Merge to main branch
- [ ] **1.16** Deploy to staging
  - [ ] Test full flow on staging
  - [ ] Test maps API is working
- [ ] **1.17** Deploy to production
  - [ ] Monitor error logs
  - [ ] Check that farms have coordinates

### QA Sign-Off
- [ ] **1.18** GPS coordinates working
  - [ ] All new farms have valid GPS
  - [ ] All forms show coordinates
  - [ ] Address reverse-lookup appears
- [ ] **1.19** Mobile working
  - [ ] Forms complete successfully on mobile
  - [ ] No map loading errors
- [ ] **1.20** No regressions
  - [ ] Existing functionality still works
  - [ ] No new error logs

---

## WEEK 2: Sensor Setup

### Database Tasks
- [ ] **2.1** Create sensors table
  ```sql
  CREATE TABLE sensors (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id),
    sensor_type VARCHAR(50),
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    mac_address VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    depth_cm INT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    last_reading_at TIMESTAMP,
    last_reading_values JSONB
  );
  ```
- [ ] **2.2** Create indexes
  ```sql
  CREATE INDEX idx_sensors_farm ON sensors(farm_id);
  CREATE INDEX idx_sensors_serial ON sensors(serial_number);
  CREATE INDEX idx_sensors_status ON sensors(status);
  ```
- [ ] **2.3** Update farms table
  - [ ] Remove: soil_type column (get from sensor instead)
  - [ ] Verify no foreign keys depend on soil_type

### Frontend: Component Creation
- [ ] **2.4** Create Step3_Sensor.tsx component
  - [ ] Show "Do you have a sensor?" yes/no options
  - [ ] If YES: show sensor form
  - [ ] If NO/LATER: allow skip but mark as pending
  - [ ] Track selection state
- [ ] **2.5** Create SensorTypeSelector sub-component
  - [ ] Show sensor types with descriptions
  - [ ] Options: Moisture+Temp, Moisture+EC, Full Profile
  - [ ] Allow custom text entry for unknown types
  - [ ] Test selection persists
- [ ] **2.6** Create SensorLocationPicker sub-component
  - [ ] Show mini-map of farm (from Step 1)
  - [ ] Allow click on map to mark sensor location
  - [ ] Show lat/lng of sensor location
  - [ ] Show depth input (cm)
  - [ ] Test map interaction
- [ ] **2.7** Create sensor form fields
  - [ ] Model: text search/dropdown
  - [ ] Serial number: text input with validation
  - [ ] Depth: number input (min 0, max 100 cm)
  - [ ] Test field interactions

### Frontend: Integration
- [ ] **2.8** Integrate Step 3 into FarmOnboarding flow
  - [ ] Add as step between Step 2 and current Step 3
  - [ ] Update progress bar (now 6 steps, not 4)
  - [ ] Add navigation (prev/next)
  - [ ] Test: can go back to Step 2
  - [ ] Test: can go forward to Step 4
- [ ] **2.9** Update form data structure
  ```typescript
  interface FarmData {
    // ... existing ...
    sensor?: {
      type: string;
      brand?: string;
      model?: string;
      serialNumber: string;
      latitude: number;
      longitude: number;
      depth: number;
      status: 'pending' | 'to_connect' | 'connected';
    }
  }
  ```

### Backend: API Endpoints
- [ ] **2.10** Create sensor creation endpoint
  - [ ] POST /api/sensors
  - [ ] Accept: farm_id, type, serial_number, location, depth
  - [ ] Validate serial_number is unique
  - [ ] Save to database
  - [ ] Return sensor ID
- [ ] **2.11** Create sensor validation endpoint
  - [ ] GET /api/sensors/validate?serial=SM-2024-123
  - [ ] Check if serial exists in database
  - [ ] Check if serial is unique
  - [ ] Return validation result
- [ ] **2.12** Update farm creation endpoint
  - [ ] Accept optional sensor data
  - [ ] Create sensor record if provided
  - [ ] Link sensor to farm
  - [ ] Test with and without sensor data
- [ ] **2.13** Create sensor status endpoint (optional for Week 2)
  - [ ] GET /api/sensors/{sensorId}/status
  - [ ] Return: online/offline/error
  - [ ] Return last reading timestamp
  - [ ] Can be stubbed for now

### Testing
- [ ] **2.14** Unit tests
  - [ ] Test SensorTypeSelector renders
  - [ ] Test SensorLocationPicker captures location
  - [ ] Test serial number validation
  - [ ] Test depth validation
- [ ] **2.15** Integration tests
  - [ ] Test Step 3 form submission
  - [ ] Test sensor created in database
  - [ ] Test farm linked to sensor
  - [ ] Test validation endpoint
  - [ ] Test without sensor (pending state)
- [ ] **2.16** Manual testing
  - [ ] Test complete flow with sensor
  - [ ] Test complete flow without sensor
  - [ ] Test can modify sensor details on Step 6 Review
  - [ ] Test validation prevents duplicate serial
  - [ ] Test map picker on Step 3

### Deploy
- [ ] **2.17** Code review
- [ ] **2.18** Merge to main
- [ ] **2.19** Database migration (if needed)
- [ ] **2.20** Deploy to staging & test

---

## WEEK 3: Water & Review Steps

### Step 4: Water Reality (Refactor)
- [ ] **3.1** Update Step 4 form
  - [ ] Remove: "monthly water budget" question
  - [ ] Keep: water source (dropdown)
  - [ ] Change: add picture options for irrigation type
  - [ ] Add: "when is water available?" (radio buttons)
  - [ ] Add: constraints checkboxes (drought/electricity/access)
- [ ] **3.2** Create picture options for irrigation
  - [ ] Collect/create 4 images:
    - [ ] Drip irrigation (thin tubes)
    - [ ] Sprinkler (spray heads)
    - [ ] Flood irrigation (water channels)
    - [ ] None (rain only)
  - [ ] Create ImageButtonGroup component
  - [ ] Test selection works
- [ ] **3.3** Update form validation
  - [ ] Water source: required
  - [ ] Irrigation type: required
  - [ ] Water availability: required
  - [ ] Constraints: optional but tracked
- [ ] **3.4** Test Step 4
  - [ ] All fields render
  - [ ] Selection persists
  - [ ] Validation works

### Step 5: Preferences (Refactor)
- [ ] **3.5** Refactor Step 5 (was Step 3)
  - [ ] Remove: "measurement units" question
  - [ ] Add: alert channels checkboxes (SMS, WhatsApp, In-app)
  - [ ] Keep: operation mode (rename to clearer labels)
  - [ ] Add: alert frequency (critical/important/detailed)
- [ ] **3.6** Create operation mode explanation
  - [ ] Auto: System waters when soil dry
  - [ ] Suggest: System suggests, you approve
  - [ ] Manual: You control everything
  - [ ] Test: explanations visible
- [ ] **3.7** Add WhatsApp/SMS as options
  - [ ] Show both as checkboxes
  - [ ] Can select both
  - [ ] Default: SMS checked, WhatsApp unchecked
  - [ ] Save to form data

### Step 6: Review (NEW)
- [ ] **3.8** Create Step6_Review.tsx component
  - [ ] Display all collected data
  - [ ] Organized sections:
    - [ ] Farmer info (name, phone, state)
    - [ ] Farm location (address, coordinates)
    - [ ] Farm details (name, size, crop)
    - [ ] Sensor (type, serial, location, depth)
    - [ ] Water (source, irrigation, schedule)
    - [ ] Alerts (channels, frequency, control mode)
  - [ ] Each section shows collected values
- [ ] **3.9** Add edit functionality
  - [ ] "Edit" button for each section
  - [ ] Clicking takes user back to that step
  - [ ] Can change values
  - [ ] Returns to review when done
  - [ ] Test back/forth navigation
- [ ] **3.10** Add final confirm button
  - [ ] Button text: "✓ Confirm & Start Monitoring"
  - [ ] Submits entire form
  - [ ] Validation: all required fields present
  - [ ] Redirect on success to dashboard
- [ ] **3.11** Add confirmation UI
  - [ ] Show spinner while submitting
  - [ ] Show success message
  - [ ] Handle errors gracefully

### Update Form Structure
- [ ] **3.12** Update FarmOnboarding.tsx
  - [ ] Update progress indicator (6 of 6)
  - [ ] Update step numbering
  - [ ] Update navigation
  - [ ] Test all navigation paths
- [ ] **3.13** Update data model
  ```typescript
  interface FarmData {
    // Step 1
    latitude: number;
    longitude: number;
    address: string;
    
    // Step 2
    farmName: string;
    totalArea: string;
    areaUnit: 'acres' | 'hectares';
    primaryCrop: string;
    
    // Step 3
    sensor?: {
      type: string;
      serialNumber: string;
      latitude: number;
      longitude: number;
      depth: number;
    };
    
    // Step 4
    water: {
      source: string;
      irrigation: string;
      availability: string;
      constraints: string[];
    };
    
    // Step 5
    communication: {
      channels: ('sms' | 'whatsapp' | 'inapp')[];
      frequency: 'critical' | 'important' | 'detailed';
      operationMode: 'autonomous' | 'suggest' | 'manual';
    };
  }
  ```

### Testing
- [ ] **3.14** Test Step 4
  - [ ] All new fields render
  - [ ] Picture options work
  - [ ] Selection persists
  - [ ] Validation works
- [ ] **3.15** Test Step 5
  - [ ] Checkboxes work
  - [ ] Can select multiple channels
  - [ ] Mode explanations visible
  - [ ] Selection persists
- [ ] **3.16** Test Step 6
  - [ ] All data displays
  - [ ] Edit buttons work
  - [ ] Can go back to any step
  - [ ] Final submit works
  - [ ] Redirect to dashboard
- [ ] **3.17** Full flow test
  - [ ] Start from signup
  - [ ] Go through all 6 steps
  - [ ] Review all data
  - [ ] Confirm submission
  - [ ] Check database saved correctly

### Mobile Testing
- [ ] **3.18** Test on mobile
  - [ ] All 6 steps visible on mobile
  - [ ] Picture options work on touch
  - [ ] Map works
  - [ ] Scrolling works
  - [ ] Buttons are tap-friendly (48px min)
  - [ ] Test on 2 phones

### Deploy
- [ ] **3.19** Code review
- [ ] **3.20** Merge to main
- [ ] **3.21** Deploy to staging
- [ ] **3.22** User acceptance testing
  - [ ] Have 5 test farmers try the form
  - [ ] Collect feedback
  - [ ] Fix critical issues

---

## WEEK 4: Polish & Launch

### Error Handling
- [ ] **4.1** Improve error messages
  - [ ] Location errors (off map, no weather data)
  - [ ] Sensor errors (duplicate serial, not found)
  - [ ] Form errors (missing required fields)
  - [ ] API errors (timeout, server error)
  - [ ] Test each error scenario
- [ ] **4.2** Add helpful hints
  - [ ] Explain WHY GPS required
  - [ ] Explain WHAT sensor does
  - [ ] Explain WHEN water is available
  - [ ] Test hint visibility
- [ ] **4.3** Handle edge cases
  - [ ] Very large farm (> 100 acres) → warn about sensor count
  - [ ] No sensor → ask to add later
  - [ ] GPS in wrong state → suggest correct state
  - [ ] Duplicate serial → show existing farm

### Save Progress
- [ ] **4.4** Implement session storage
  - [ ] Save form data to localStorage
  - [ ] Load on page return
  - [ ] Allow "save and return later"
  - [ ] Test: can close and reopen form
- [ ] **4.5** Add progress indicator
  - [ ] Show which steps completed
  - [ ] Show which steps pending
  - [ ] Test navigation with saved progress

### Analytics
- [ ] **4.6** Add tracking (optional)
  - [ ] Track form start
  - [ ] Track per-step completion
  - [ ] Track per-step abandonment
  - [ ] Track errors encountered
  - [ ] Track mobile vs desktop
- [ ] **4.7** Create dashboard
  - [ ] See which steps lose farmers
  - [ ] See mobile completion rate
  - [ ] See error frequency
  - [ ] Use to identify problem areas

### Documentation
- [ ] **4.8** Update README
  - [ ] Document new 6-step flow
  - [ ] Add MapPicker component docs
  - [ ] Add sensor setup docs
- [ ] **4.9** Add code comments
  - [ ] Explain why GPS required
  - [ ] Explain sensor critical
  - [ ] Explain water logic
- [ ] **4.10** Create user guide
  - [ ] Screenshots of all 6 steps
  - [ ] Explain each field
  - [ ] FAQ section

### Testing & QA
- [ ] **4.11** Final full flow test (desktop)
  - [ ] Signup → complete all 6 steps → dashboard
  - [ ] Test with valid data
  - [ ] Test with edge cases
  - [ ] Verify database
- [ ] **4.12** Final full flow test (mobile)
  - [ ] Same as above
  - [ ] Test on 3+ devices
  - [ ] Test with slow internet
- [ ] **4.13** Regression testing
  - [ ] Test existing features still work
  - [ ] Test dashboard loads farm data
  - [ ] Test sensor data if connected
  - [ ] Test no errors in console
- [ ] **4.14** Performance testing
  - [ ] Map loads in < 2s
  - [ ] Form submission in < 1s
  - [ ] No UI freezes
  - [ ] Memory usage reasonable

### Security
- [ ] **4.15** Validate all inputs
  - [ ] GPS coordinates (range, type)
  - [ ] Sensor serial (alphanumeric, length)
  - [ ] Farm name (no script tags, length)
  - [ ] Test invalid inputs rejected
- [ ] **4.16** Check permissions
  - [ ] Only authenticated users can create farms
  - [ ] Users can only see own farms
  - [ ] Sensor data is private
  - [ ] Test unauthorized access denied

### Deployment
- [ ] **4.17** Production database backup
  - [ ] Back up all current data
  - [ ] Test restore
- [ ] **4.18** Run migrations
  - [ ] Test on staging first
  - [ ] Create sensors table
  - [ ] Update farms table
  - [ ] Verify data integrity
- [ ] **4.19** Deploy code
  - [ ] Deploy to production
  - [ ] Run smoke tests
  - [ ] Monitor error logs
- [ ] **4.20** Monitor in production
  - [ ] Check maps API is working
  - [ ] Check form submissions
  - [ ] Check database saves
  - [ ] Check for new error patterns
- [ ] **4.21** Post-deployment checks
  - [ ] Test signup flow works
  - [ ] Test all 6 steps work
  - [ ] Test on 5 different phones
  - [ ] Test with real farmers if possible

### Communication
- [ ] **4.22** Update team
  - [ ] Show final implementation
  - [ ] Explain new flow
  - [ ] Share metrics
- [ ] **4.23** Plan Phase 2
  - [ ] Advanced soil profile breakdown
  - [ ] Crop calendar
  - [ ] Yield tracking
  - [ ] Custom thresholds

---

## Tracking Progress

### Week 1: GPS & Basic Validation
**Target:** ✅ All GPS data required & validated
- [ ] Frontend: Map picker working
- [ ] Backend: Coordinates saved
- [ ] Testing: Works on mobile
- **Estimated Hours:** 8-12 hours
- **Completion Date:** ________________

### Week 2: Sensor Setup
**Target:** ✅ Sensor as critical step
- [ ] Sensor table created
- [ ] Step 3 component built
- [ ] Can save sensor data
- **Estimated Hours:** 10-14 hours
- **Completion Date:** ________________

### Week 3: Water & Review
**Target:** ✅ Better questions + confirmation
- [ ] Water questions improved
- [ ] Step 6 review created
- [ ] Full flow tested
- **Estimated Hours:** 12-16 hours
- **Completion Date:** ________________

### Week 4: Polish & Launch
**Target:** ✅ Production ready
- [ ] All errors handled
- [ ] Mobile tested
- [ ] Deployed to production
- **Estimated Hours:** 10-12 hours
- **Completion Date:** ________________

---

## Total Effort Estimate
```
Week 1:  8-12 hours    GPS & Validation
Week 2: 10-14 hours    Sensor Setup
Week 3: 12-16 hours    Water & Review
Week 4: 10-12 hours    Polish & Launch
────────────────────
Total: 40-54 hours     4-6 days for one developer
       or 2-3 weeks   if part-time
```

---

## Sign-Off Criteria

- [ ] GPS coordinates required & validated (95% accuracy)
- [ ] Sensor setup as dedicated step (visible & prominent)
- [ ] Water questions match farmer reality
- [ ] Mobile completion rate > 85%
- [ ] Form takes < 15 minutes
- [ ] No critical bugs in production
- [ ] Farmer feedback positive
- [ ] Data quality improved (43% → 83%)

---

## Blockers / Issues Encountered

### Issue 1
- **Date Found:** ________________
- **Description:** ________________
- **Impact:** ________________
- **Resolution:** ________________

### Issue 2
- **Date Found:** ________________
- **Description:** ________________
- **Impact:** ________________
- **Resolution:** ________________

---

## Lessons Learned

1. ________________
2. ________________
3. ________________

---

## Next Priorities (After Week 4)

- [ ] Soil profile from sensor data
- [ ] Crop calendar recommendations
- [ ] Yield prediction
- [ ] Cost tracking
- [ ] Community benchmarking

---

**Print this page and check off items as you go!**
