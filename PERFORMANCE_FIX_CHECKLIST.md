# ✅ PERFORMANCE FIX CHECKLIST

## Pre-Implementation Testing

- [ ] Record current load time (F12 → Performance tab, hard refresh)
- [ ] Take screenshot of Network waterfall
- [ ] Note number of API calls in Network tab
- [ ] Check localStorage size (should be <1 MB total)
- [ ] Run test script to count duplicate API calls

---

## CRITICAL FIXES (Do These Today)

### ✅ Fix #1: Clean Up Realtime Subscriptions

**File: `client/hooks/useUserPresence.ts`**
- [ ] Add `return () => { clearInterval(...) }` to heartbeat interval
- [ ] Add `return () => { updatePresence('offline') }` cleanup (or use page visibility)
- [ ] Fix: Stop resetting interval on every re-render
- [ ] Test: Heartbeat should stop when component unmounts

**File: `client/hooks/useCommunity.ts`**
- [ ] Add cleanup for `channelRef.current` subscription
- [ ] Add cleanup for `updateChannelRef.current` subscription
- [ ] Verify unsubscribe is called in return function
- [ ] Test: Subscriptions should disappear in DevTools when navigating away

**File: `client/hooks/useMessages.ts`**
- [ ] Fix return statement with unsubscribe function
- [ ] Test: Messages subscription should cleanup on unmount

**Verification:**
- [ ] Open DevTools → Application tab → WebSockets
- [ ] Navigate between pages
- [ ] WebSocket connections should close (not accumulate)
- [ ] Should see <5 active connections instead of 10+

---

### ✅ Fix #2: Consolidate Duplicate Farm Fetches

**File: `client/context/FarmContext.tsx`**
- [ ] Add `farmCache: Map<string, { data: any; timestamp: number }>` to state
- [ ] Add `getFarmData(farmId: string)` method with 5-minute TTL
- [ ] Add `getCurrentFarmData()` convenience method
- [ ] Export both in context value
- [ ] Test: Cache should return same data on second call without network request

**File: `client/pages/Home.tsx`**
- [ ] Remove direct `/api/farms/${farmId}` fetch
- [ ] Replace with `const { getCurrentFarmData } = useFarmContext()`
- [ ] Call `await getCurrentFarmData()` instead
- [ ] Test: Farm name should still load, but from cache second time

**File: `client/pages/Farm.tsx`**
- [ ] Remove `/api/farms/${farmId}` fetch
- [ ] Use `getFarmData()` from context
- [ ] Test: Farm data should load faster (from cache)

**File: `client/pages/Recommendations.tsx`**
- [ ] Remove `/api/farms/${farmId}` fetch (third occurrence)
- [ ] Use `getCurrentFarmData()` from context
- [ ] Test: Verify cache is being used

**Verification:**
- [ ] Hard refresh page
- [ ] Open Network tab, filter by XHR
- [ ] Check: `/api/farms/{id}` should appear ONCE in Network tab
- [ ] Previously: Should have appeared 3 times
- [ ] Time saved: 8-12 seconds

---

### ✅ Fix #3: Add Request Caching Service

**File: Create `client/services/RequestCacheService.ts`** (NEW FILE)
- [ ] Copy entire RequestCacheService class from QUICK_FIXES_IMPLEMENTATION.md
- [ ] Export as singleton: `export const requestCacheService = new RequestCacheService()`
- [ ] Verify: Class has `get()`, `invalidate()`, `invalidatePattern()`, `clear()` methods

**File: `client/services/SensorService.ts`**
- [ ] Import: `import { requestCacheService } from './RequestCacheService'`
- [ ] Wrap `getSensorData()` with `requestCacheService.get()`
- [ ] Wrap `getSystemStatus()` with cache (2 minute TTL)
- [ ] Test: Second call should be instant (<100ms)

**File: `client/services/WeatherService.ts`**
- [ ] Import: `import { requestCacheService } from './RequestCacheService'`
- [ ] Wrap `getCurrentWeather()` with cache (30 minute TTL)
- [ ] Wrap `getWeatherForecast()` with cache
- [ ] Test: Weather data should cache properly

**Verification:**
- [ ] Open Network tab
- [ ] Reload page
- [ ] First call to /api/sensors/latest: ~1-2 seconds
- [ ] Second call to /api/sensors/latest: Should be instant (from cache)
- [ ] Check Console: No errors from cache service
- [ ] Time saved: 15-25 seconds

---

### ✅ Fix #4: Parallelize Context Loading (Optional but recommended)

**File: `client/App.tsx`**
- [ ] Check if contexts load sequentially
- [ ] If possible, use `Promise.all()` for independent contexts
- [ ] Test: Contexts should initialize in parallel, not serial

---

## VERIFICATION AFTER CRITICAL FIXES

### Performance Metrics Check
- [ ] Reload page with hard refresh (Ctrl+Shift+R)
- [ ] Open F12 → Performance tab
- [ ] Click Record, wait 15-20 seconds, Stop
- [ ] Check DOMContentLoaded time: Should be <10 seconds (was 15-20s)
- [ ] Check Interactive time: Should be <15 seconds (was 30-40s)

### Network Tab Check
- [ ] Reload page, open Network tab
- [ ] Count API calls: Should be 50% fewer
- [ ] Look for duplicate requests: Should be 0 (was 3+)
- [ ] WebSocket connections: Should be <5 (was 10+)
- [ ] Total network time: Should be <10 seconds (was 30+ seconds)

### Device Test
- [ ] Test on slow 3G network (DevTools → Network tab → Throttling)
- [ ] Should be faster even on slow connection

---

## IMPORTANT NOTES

### When Making Changes:
- [ ] Always add comments like `// ✅ FIXED: ...`
- [ ] Test each fix independently
- [ ] Don't implement multiple fixes at once
- [ ] Clear browser cache between tests (`Ctrl+Shift+Delete`)

### Common Issues:

**Issue: "requestCacheService is not defined"**
- [ ] Check import statement at top of file
- [ ] Verify RequestCacheService.ts exists and exports correctly

**Issue: "Data seems stale"**
- [ ] Increase cache TTL if needed
- [ ] Check if invalidation is being called at right time
- [ ] Use `invalidatePattern()` to clear related cache entries

**Issue: "Still seeing duplicate requests"**
- [ ] Make sure ALL pages are using shared cache
- [ ] Check if cache key is consistent
- [ ] Verify cleanup is working (check in DevTools)

---

## TESTING SCRIPT (Run in Browser Console)

```javascript
// Copy/paste this after fixes to verify improvements

const metrics = {
  apiCalls: {},
  startTime: performance.now(),
  totalSize: 0,
  duplicates: 0
};

const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  const key = url.split('?')[0]; // Remove query params for duplicate check
  
  if (!metrics.apiCalls[key]) {
    metrics.apiCalls[key] = { count: 0, times: [] };
  } else {
    metrics.duplicates++;
  }
  
  metrics.apiCalls[key].count++;
  const start = performance.now();
  
  return originalFetch.apply(this, args).then(response => {
    const duration = performance.now() - start;
    metrics.apiCalls[key].times.push(duration);
    return response;
  });
};

// After page loads (wait 30 seconds), run:
// console.log('=== METRICS ===');
// console.log('Total time:', (performance.now() - metrics.startTime) / 1000, 'seconds');
// console.log('Duplicate API calls:', metrics.duplicates);
// console.table(metrics.apiCalls);

window.checkMetrics = () => {
  console.log('=== METRICS ===');
  console.log('Total time:', (performance.now() - metrics.startTime) / 1000, 'seconds');
  console.log('Duplicate API calls:', metrics.duplicates);
  console.table(metrics.apiCalls);
};
```

**Usage:**
1. Paste script before page load
2. Reload page
3. Wait 30 seconds
4. Run: `checkMetrics()`

**Expected Output (AFTER fixes):**
```
Total time: 15-20 seconds (was 120+)
Duplicate API calls: 0 (was 3+)
Most API calls: <2 seconds each (was 5-10 seconds)
```

---

## HIGH PRIORITY FIXES (Do This Week)

### ✅ Fix #5: Optimize Database Queries

**File: `server/db/supabase.ts`**
- [ ] Check if indexes exist for common queries:
  - [ ] `sensor_readings(farm_id, timestamp DESC)`
  - [ ] `system_status(farm_id, updated_at DESC)`
  - [ ] `posts(farm_id, created_at DESC)`
  - [ ] `comments(post_id, created_at DESC)`
- [ ] Add missing indexes
- [ ] Test: Queries should be faster (<1 second)

**File: `server/routes/sensors.ts`**
- [ ] Combine sensor_readings + system_status in single query (use JOIN)
- [ ] Test: Both should load in single request

---

### ✅ Fix #6: Add Pagination to Community Comments

**File: `client/services/communityApi.ts`**
- [ ] Change `getComments(postId)` to `getComments(postId, page=1, limit=5)`
- [ ] Only return first 5 comments initially
- [ ] Add "Load more comments" button

**File: `client/pages/Community.tsx`**
- [ ] Update to handle paginated comments
- [ ] Show "Load more" when there are hidden comments

---

### ✅ Fix #7: Optimize Marketplace Images

**File: `client/pages/Marketplace.tsx`**
- [ ] Add image lazy loading (Intersection Observer)
- [ ] Serve thumbnail images initially (100x100)
- [ ] Load full-res only on hover
- [ ] Use WebP format with fallback to JPG

---

## MEDIUM PRIORITY FIXES (Next Week)

### ✅ Fix #8: Defer Non-Critical Data Loads

**File: `client/pages/Learn.tsx`**
- [ ] Load Articles + Videos only on initial mount
- [ ] Load Courses when user scrolls to courses section
- [ ] Load Stats when user opens profile

---

## FINAL CHECKLIST

### Before Deploying:
- [ ] All critical fixes implemented
- [ ] Performance improved by 50%+ (measure with Performance tab)
- [ ] No console errors
- [ ] No memory leaks (check DevTools → Memory)
- [ ] Tested on slow network (3G throttling)
- [ ] Tested on slow device (throttle CPU)
- [ ] Tested on different browsers (Chrome, Firefox, Safari)

### After Deploying:
- [ ] Monitor real user metrics (e.g., Sentry, LogRocket)
- [ ] Set up performance budgets
- [ ] Create automated performance tests
- [ ] Schedule quarterly performance reviews

---

## 📊 Success Metrics

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Page Load Time | 120 sec | 20-30 sec | ⏳ |
| Duplicate API Calls | 3+ | 0 | ⏳ |
| Network Requests | 40+ | 15-20 | ⏳ |
| WebSocket Connections | 10+ | <5 | ⏳ |
| Time to Interactive | 40 sec | 10-12 sec | ⏳ |

---

## 🎯 Priority Tracker

```
CRITICAL (Start here):
[████████] Fix #1: Subscriptions
[████████] Fix #2: Deduplicate
[████████] Fix #3: Caching
[████████] Fix #4: Parallelize
Subtotal Time: 60 min | Time Saved: 50-80 sec

HIGH (This week):
[        ] Fix #5: DB Indexes
[        ] Fix #6: Pagination
[        ] Fix #7: Images
Subtotal Time: 90 min | Time Saved: 20-30 sec

MEDIUM (Next week):
[        ] Fix #8: Defer Loading
Subtotal Time: 30 min | Time Saved: 10-15 sec

Total Work: 3 hours | Total Saved: 80-125 seconds! 🎉
```

---

## Questions?

Refer to:
- 📖 QUICK_FIXES_IMPLEMENTATION.md - For exact code changes
- 🔍 NETWORK_DEBUGGING_GUIDE.md - For testing & verification
- 📊 DATA_LEAKS_DETAILED.md - For understanding the issues
- 🚀 PERFORMANCE_ANALYSIS_REPORT.md - For full analysis

Good luck! You've got this! 🚀

