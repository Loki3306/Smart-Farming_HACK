# NETWORK TAB ANALYSIS - What You'll See

## How to Debug Using Browser DevTools

### Step 1: Open Network Tab
```
F12 → Network tab → Reload page (Ctrl+Shift+R for hard refresh)
```

### Step 2: Filter to See Issues

**Command:** Check for these patterns:

#### A. Duplicate Requests
```
Look for these requests happening multiple times:

❌ /api/farms/{id}
   - Home.tsx calls it
   - Farm.tsx calls it
   - Recommendations.tsx calls it
   = 3x same request within 2 seconds!

❌ /api/sensors/latest
   - FarmContext calls it
   - Home page calls it
   = 2x same request!

❌ /api/weather/current
   - Multiple pages calling independently
```

#### B. Slow Requests (>2 seconds)

```
❌ /api/learn/articles?page=1 - 3-5 seconds
   → Problem: Fetching too much data
   → Solution: Limit fields returned

❌ /api/learn/videos?page=1 - 3-5 seconds
   → Problem: Same as above

❌ /api/chatbot/chat - 8+ seconds
   → Problem: AI processing time
   → Solution: Show loading spinner earlier

❌ /api/recommendations/analyze - 15-20 seconds
   → Problem: Heavy AI analysis
   → Expected, but show progress
```

#### C. Supabase Realtime Connections

```
Look in Network tab for:
❌ WebSocket connections not closing

Count them:
- One per useUserPresence hook
- One per community posts subscription
- One per message subscription
- One per presence update

Should be: <5 total
Currently probably: 10-20+ (leaking!)
```

#### D. Large Payloads

```
Any response >1 MB is a problem:
❌ /api/posts?limit=20 returning 5 MB
   → Includes full resolution images
   → Includes all comments
   → Includes all metadata

Filter by size in DevTools:
Network → Response size DESC
```

---

## Network Timeline You Should See

### CURRENT STATE (120 seconds)
```
Time 0s ........... App starts, React loads
Time 1s ... AuthContext initializes (getCurrentUser call)
Time 2s ...... FarmContext initializes (parallel requests start)
Time 5s ........... First sensor data arrives (maybe)
Time 10s ... Page still loading (showing spinner)
Time 15s ... Home page finally renders
Time 20s ... Sidebar finishes loading notifications
Time 25s ... Weather data arrives
Time 30s ... Community subscriptions start connecting
Time 40s ... User can click on a route
Time 50s ... Realtime subscriptions finally connected
Time 60s ... Learn page starts loading if clicked
Time 120s ... App fully interactive (REALLY BAD!)
```

### TARGET STATE (20 seconds)
```
Time 0s ........... App starts
Time 1s ... Auth checks in parallel with context init
Time 3s ... First data arrives (sensor + weather in parallel)
Time 5s ... Page renders with data
Time 10s ... Realtime subscriptions connect
Time 15s ... User can click and navigate
Time 20s ... Heavy pages (Learn, Community) load on-demand
```

---

## Network Checklist - Run This Test

### Test Script (paste in Console):

```javascript
// Measure API call counts and timing
const apiCalls = {};
const originalFetch = window.fetch;

window.fetch = function(...args) {
  const url = args[0];
  const method = args[1]?.method || 'GET';
  const key = `${method} ${url}`;
  
  if (!apiCalls[key]) {
    apiCalls[key] = { count: 0, times: [] };
  }
  apiCalls[key].count++;
  
  const startTime = performance.now();
  
  return originalFetch.apply(this, args).then(response => {
    const duration = performance.now() - startTime;
    apiCalls[key].times.push(duration);
    return response;
  });
};

// After page load (wait 30 seconds), run:
// console.table(apiCalls);
```

### Expected Output - CURRENT (BAD):

```
GET /api/farms/abc123
  count: 3              ← Should be 1! (Duplicate)
  times: [800, 850, 820]

GET /api/sensors/latest
  count: 2              ← Should be 1! (Duplicate)
  times: [1200, 1050]

GET /api/weather/current
  count: 2              ← Should be 1! (Duplicate)
  times: [2500, 2450]

GET /api/learn/articles
  count: 1
  times: [5000]         ← Should be <2000ms!

GET /api/chatbot/chat
  count: 1
  times: [12000]        ← Expected, but show spinner

POST /api/notifications
  count: 1
  times: [3000]         ← No pagination = loading all!
```

### Expected Output - FIXED (GOOD):

```
GET /api/farms/abc123
  count: 1              ← ✅ No duplicates!
  times: [800]

GET /api/sensors/latest
  count: 1              ← ✅ Cached!
  times: [1200]

GET /api/weather/current
  count: 1              ← ✅ Cached!
  times: [2500]

GET /api/learn/articles?limit=10
  count: 1              ← ✅ Paginated!
  times: [800]          ← ✅ Much faster!

GET /api/notifications?limit=20&unread=true
  count: 1              ← ✅ Only unread!
  times: [500]
```

---

## Storage Tab Issues

### Check localStorage for leaks:

```javascript
// Run in Console:
Object.entries(localStorage).forEach(([key, value]) => {
  const sizeKB = new Blob([value]).size / 1024;
  if (sizeKB > 100) {
    console.warn(`🔴 ${key}: ${sizeKB.toFixed(2)} KB`);
  } else if (sizeKB > 50) {
    console.warn(`🟡 ${key}: ${sizeKB.toFixed(2)} KB`);
  }
});
```

### What to look for:

```
🔴 ALERTS_STORAGE_KEY (sensor alerts)
   - Should be <50 KB
   - Probably: 100+ KB (all alerts ever)
   - Fix: Keep only last 50 alerts

🔴 farm_sensor_alerts
   - Duplicate? Delete one

🟡 current_user
   - Should be <10 KB
   - Store minimal profile, fetch full data on demand

🟡 Various state arrays
   - If >100 KB, you're caching too much
```

---

## Memory Profiler Issues

### What to check:

1. **Detached DOM nodes**
   ```
   F12 → Memory → Detached DOM nodes
   
   ❌ If >100 nodes, you have memory leaks
   ✅ Target: <20 detached nodes
   ```

2. **React Components**
   ```
   F12 → Components → Check for:
   
   ❌ Multiple instances of same hook
   ❌ Lingering event listeners
   ❌ Subscriptions not cleaned up
   ```

---

## Actual Bottleneck Verification

### Check these files in Network tab during page load:

#### 1. Bundle Size Check
```
dist/spa/vendor-*.js
- React bundle should be <150 KB
- UI libraries should be <200 KB
- Custom code should be <100 KB
- If larger: Something's bloated

Example:
dist/spa/vendor-communityapi-abc123.js - 24.78 KB ← Community features
dist/spa/vendor-learnservice-def456.js - 23.49 KB  ← Learning features
dist/spa/vendor-cropprice-ghi789.js - 20.87 KB     ← Marketplace

Total: ~70 KB just for optional features!
Should be: 30-40 KB total
```

#### 2. Cache Headers Check
```
In Network tab, Response Headers:

❌ cache-control: no-cache
   ✅ Should be: cache-control: max-age=3600 (1 hour)

❌ cache-control: max-age=0
   ✅ Should be: cache-control: max-age=604800 (1 week) for static assets

❌ No etag
   ✅ Should have: etag for comparing if changed
```

---

## Performance Metrics to Track

### Metrics to check (F12 → Performance):

```
Metric              | Current    | Target  | Issue
--------------------|-----------|---------|----------
Load (DOMContentLoaded) | 15-20s | 3-5s    | Context loading
Interactive (TTI)   | 30-40s    | 8-10s   | Subscription setup
First Paint         | 8-10s     | 2-3s    | Initial render
Largest Paint       | 15-20s    | 5-8s    | Heavy components
CLS (Layout Shift)  | High      | <0.1    | Images without sizes
```

### Record these steps:

1. Open Network tab, Performance tab
2. Hard refresh (Ctrl+Shift+R)
3. Record (⚪ button)
4. Wait 30 seconds
5. Stop recording
6. Analyze timeline

---

## Real Example - What You'll See

### Timeline waterfall (approximate):

```
0ms ─┬─ HTML loaded
     │
1s  ─┼─ JS bundles start downloading
     │
     ├─ vendor-react-dom.js
     ├─ vendor-ui.js
     ├─ main.js
     │
5s  ─┼─ JS parsing/execution
     │
     ├─ AuthContext init + getCurrentUser
     │  └─ /auth/me ──────────────┐ 1.2s
     │
     ├─ FarmContext init          │
     │  ├─ /sensors/latest ───────┼────────┐ 2.3s
     │  ├─ /weather/current ──────┼────┐   │
     │  ├─ /farms?farmerId ───────┼──┐ │   │
     │  └─ /blockchain ──────────────┐ │   │
     │                            │ │ │
10s ─┼─ React rendering           │ │ │
     │                            │ │ │
     ├─ Home.tsx renders          │ │ │
     │  └─ /farms/{id} ───────────┼─┼─┼──┐ 1.5s ← DUPLICATE!
     │                            │ │ │
15s ─┼─ Sidebar loads             │ │ │
     │  ├─ /notifications ────────┼─┼─┼──┐ 2.8s
     │  └─ /user-presence ────────┼─┼─┼──┐ 0.8s
     │                            │ │ │
20s ─┼─ Realtime subscriptions    │ │ │
     │  ├─ WebSocket connect ─────┼─┼─┼──┐ 3.2s
     │  └─ Subscribe to posts ────┼─┼─┼──┐ 1.5s
     │                            │ │ │
25s ─┼─ Page interactive!         │ │ │
     │
30s ─┼─ Learn page loads (if clicked)
     │  └─ /learn/articles ───────┼─────┐ 4.8s ← Should be <2s
     │
40s ─┼─ Community page loads
     │  ├─ /posts ────────────────┼─────┐ 8.2s ← Should be <3s
     │  └─ /comments ──────────────┼─────┐ 5.4s ← Should be <2s
     │
120s ─ FINALLY DONE! (TERRIBLE!)
```

---

## Action Items

### Immediate (Today):

1. **Open Network tab during page load**
2. **Screenshot the timeline**
3. **Count:**
   - How many `/api/farms` requests?
   - How many `/api/sensors` requests?
   - How many duplicate requests total?
4. **Check response sizes** (Look for >1 MB responses)
5. **Count WebSocket connections** (Should be <5)

### After Fixes:

1. **Re-run test, compare timelines**
2. **Verify duplicates are gone**
3. **Verify cache is working** (304 Not Modified responses)
4. **Measure improvement** (Should be 50% faster)

---

## Debug URLs

### To test APIs directly:

```
Browser console:

// Test single farm fetch
fetch('/api/farms/abc123').then(r => r.json()).then(console.log)

// Test cached farm fetch (should be instant second time)
fetch('/api/farms/abc123').then(r => r.json()).then(console.log)

// Test notifications
fetch('/api/notifications?user_id=123').then(r => r.json()).then(console.log)

// Test sensor data
fetch('/api/sensors/latest?farmId=abc123').then(r => r.json()).then(console.log)
```

### Expected response time:
- Cached: <100ms
- Fresh: 500-2000ms
- Heavy (with AI): 5-20 seconds

If all requests >3 seconds, your server is slow (Database optimization needed).

