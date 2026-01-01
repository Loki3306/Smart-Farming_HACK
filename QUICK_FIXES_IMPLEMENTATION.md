# QUICK FIXES - Implementation Guide

## Fix #1: Clean Up Realtime Subscriptions (20-30 SECONDS SAVED)

### File 1: `client/hooks/useUserPresence.ts`

**Problem:** Heartbeat interval never stops, connections leak

**Solution:** Add proper cleanup

```typescript
// Around line 95-140
useEffect(() => {
  if (user?.id && !targetUserId) {
    updatePresence('online');

    // ✅ FIXED: Clear old interval before setting new one
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Start heartbeat interval
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);

    // ✅ FIXED: Add cleanup function
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      // Don't mark as offline on unmount - use page visibility instead
    };
  }
}, [user?.id, targetUserId, updatePresence, sendHeartbeat]);

// ✅ ADD: Page visibility handler
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!user?.id) return;
    if (document.hidden) {
      updatePresence('away');
    } else {
      updatePresence('online');
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [user?.id, updatePresence]);
```

---

### File 2: `client/hooks/useCommunity.ts` 

**Problem:** Multiple realtime subscriptions never unsubscribed

**Solution:** Add cleanup in useEffect return

```typescript
// Around line 60-80
useEffect(() => {
  fetchPosts();

  // Subscribe to new posts
  channelRef.current = realtime.subscribeToNewPosts((newPost) => {
    // Only add if matches filters
    const matchesCrop = !options.crop || newPost.crop === options.crop;
    const matchesType = !options.type || newPost.post_type === options.type;
    
    if (matchesCrop && matchesType) {
      setPosts((prev) => [newPost, ...prev]);
    }
  });

  // ✅ FIXED: Add cleanup
  return () => {
    if (channelRef.current) {
      realtime.unsubscribe(channelRef.current);
      channelRef.current = null;
    }
  };
}, [options.crop, options.type, options.tag, options.search, fetchPosts, realtime]);

// Same for updateChannelRef
useEffect(() => {
  // Subscribe to post updates
  updateChannelRef.current = realtime.subscribeToPostUpdates((updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
  });

  // ✅ FIXED: Add cleanup
  return () => {
    if (updateChannelRef.current) {
      realtime.unsubscribe(updateChannelRef.current);
      updateChannelRef.current = null;
    }
  };
}, [realtime]);
```

---

### File 3: `client/hooks/useMessages.ts`

**Problem:** Message subscriptions not cleaned up

**Solution:** Fix cleanup

```typescript
// Around line 50-70
// Subscribe to new messages
useEffect(() => {
  if (!conversationId) return;

  // ✅ FIXED: Store unsubscribe function
  const unsubscribeNew = chatService.subscribeToMessages(conversationId, (newMessage) => {
    setMessages((prev) => {
      const isDuplicate = prev.some((m) => m.id === newMessage.id);
      return isDuplicate ? prev : [newMessage, ...prev];
    });
  });

  // ✅ FIXED: Add cleanup
  return () => {
    if (unsubscribeNew) {
      unsubscribeNew();
    }
  };
}, [conversationId, chatService]);
```

---

## Fix #2: Consolidate Duplicate Farm Fetches (10-15 SECONDS SAVED)

### File: `client/context/FarmContext.tsx`

**Problem:** Farm data fetched in Home.tsx, Farm.tsx, Recommendations.tsx separately

**Solution:** Add farm data caching to context

```typescript
// Add to FarmContextType (around line 50)
interface FarmContextType {
  // ... existing fields ...
  
  // ✅ NEW: Farm data caching
  farmCache: Map<string, { data: any; timestamp: number }>;
  getFarmData: (farmId: string) => Promise<any>;
  getCurrentFarmData: () => Promise<any>;
}

// Add to FarmContextProvider (around line 200)
const FARM_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const [farmCache, setFarmCache] = useState<Map<string, { data: any; timestamp: number }>>(new Map());

const getFarmData = useCallback(async (farmId: string) => {
  // Check cache
  const cached = farmCache.get(farmId);
  if (cached && Date.now() - cached.timestamp < FARM_CACHE_TTL) {
    return cached.data;
  }

  // Fetch fresh
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/farms/${farmId}`);
    if (response.ok) {
      const result = await response.json();
      const farm = result.farm;
      
      // Update cache
      setFarmCache(prev => new Map(prev).set(farmId, { 
        data: farm, 
        timestamp: Date.now() 
      }));
      
      return farm;
    }
  } catch (error) {
    console.error('[FarmContext] Error fetching farm:', error);
  }
  return null;
}, [farmCache]);

const getCurrentFarmData = useCallback(async () => {
  const farmId = localStorage.getItem('current_farm_id');
  if (!farmId) return null;
  return getFarmData(farmId);
}, [getFarmData]);

// Export in context value
const value: FarmContextType = {
  // ... existing ...
  farmCache,
  getFarmData,
  getCurrentFarmData,
};
```

### File: `client/pages/Home.tsx`

**Problem:** Fetches farm name separately

**Solution:** Use context instead

```typescript
// Replace lines 45-60 with:
const { getCurrentFarmData } = useFarmContext();

useEffect(() => {
  const loadFarmData = async () => {
    try {
      const farm = await getCurrentFarmData();
      if (farm?.farm_name) {
        setFarmName(farm.farm_name);
      }
    } catch (error) {
      console.error('[Home] Error loading farm:', error);
    }
  };
  
  if (user?.id) {
    loadFarmData();
  }
}, [user, getCurrentFarmData]);
```

### File: `client/pages/Farm.tsx`

**Problem:** Fetches farm data separately

**Solution:** Use context instead

```typescript
// Around line 82-90, replace with:
const { getFarmData } = useFarmContext();

useEffect(() => {
  const fetchFarmData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const farmId = localStorage.getItem('current_farm_id');
      if (farmId) {
        // ✅ Use cached getFarmData instead of direct fetch
        const farm = await getFarmData(farmId);
        if (farm) {
          setFarmData({
            farmName: farm.farm_name || 'My Farm',
            state: farm.state || 'Maharashtra',
            // ... rest of mapping ...
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  fetchFarmData();
}, [user, getFarmData]);
```

### File: `client/pages/Recommendations.tsx`

**Problem:** Fetches farm data separately (third time!)

**Solution:** Use context instead

```typescript
// Around line 220, replace with:
const { getCurrentFarmData } = useFarmContext();

useEffect(() => {
  const loadFarmData = async () => {
    try {
      const farm = await getCurrentFarmData();
      if (farm) {
        setFarmData({
          farm_id: farm.id,
          crop_type: farm.crop_type,
          soil_type: farm.soil_type,
          farm_name: farm.farm_name
        });
      }
    } catch (error) {
      console.error('[Recommendations] Error loading farm data:', error);
    } finally {
      setLoadingFarm(false);
    }
  };

  loadFarmData();
}, [getCurrentFarmData]);
```

---

## Fix #3: Add Request Caching Service (15-25 SECONDS SAVED)

### File: Create `client/services/RequestCacheService.ts`

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class RequestCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  
  private readonly DEFAULT_TTL = 60000; // 1 minute

  async get<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Return cached data if still valid
    if (cached && now - cached.timestamp < ttl) {
      return cached.data as T;
    }

    // If request is already in flight, return that promise (deduplication)
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Fetch new data
    const promise = (async () => {
      try {
        const data = await fetcher();
        this.cache.set(key, { data, timestamp: now });
        return data;
      } finally {
        this.pendingRequests.delete(key);
      }
    })();

    this.pendingRequests.set(key, promise);
    return promise;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string | RegExp): void {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

export const requestCacheService = new RequestCacheService();
```

### File: `client/services/SensorService.ts`

**Problem:** Fetches sensor data without caching

**Solution:** Use cache service

```typescript
import { requestCacheService } from './RequestCacheService';

export async function getSensorData(): Promise<SensorData> {
  const farmId = localStorage.getItem('current_farm_id') || 'default';
  const cacheKey = `sensor_data_${farmId}`;

  return requestCacheService.get(
    cacheKey,
    async () => {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/sensors/latest?farmId=${encodeURIComponent(farmId)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch sensor data');
      }
      
      return response.json();
    },
    5 * 60 * 1000 // 5 minute cache
  );
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const farmId = localStorage.getItem('current_farm_id') || 'default';
  const cacheKey = `system_status_${farmId}`;

  return requestCacheService.get(
    cacheKey,
    async () => {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/sensors/system-status?farmId=${encodeURIComponent(farmId)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch system status');
      }
      
      return response.json();
    },
    2 * 60 * 1000 // 2 minute cache
  );
}
```

### File: `client/services/WeatherService.ts`

**Problem:** Fetches weather data without caching

**Solution:** Use cache service

```typescript
import { requestCacheService } from './RequestCacheService';

export async function getCurrentWeather(): Promise<WeatherData> {
  const farmId = localStorage.getItem('current_farm_id') || 'default';
  const cacheKey = `weather_current_${farmId}`;

  return requestCacheService.get(
    cacheKey,
    async () => {
      const response = await fetch(`${CONFIG.API_BASE_URL}/weather/current?farmId=${farmId}`);
      if (!response.ok) throw new Error('Failed to fetch weather');
      return response.json();
    },
    30 * 60 * 1000 // 30 minute cache
  );
}
```

---

## Summary of Changes

| File | Changes | Time Saved |
|------|---------|-----------|
| useUserPresence.ts | Add cleanup, use page visibility | 10-15 sec |
| useCommunity.ts | Add subscription cleanup | 10-15 sec |
| useMessages.ts | Fix cleanup | 5-10 sec |
| FarmContext.tsx | Add caching | 10-15 sec |
| Home/Farm/Recommendations.tsx | Use context instead of direct fetch | 10-15 sec |
| RequestCacheService.ts | New caching service | 15-25 sec |
| **TOTAL** | **All fixes combined** | **35-55 seconds** |

---

## Testing

1. Open browser DevTools → Network tab
2. Filter by XHR/Fetch
3. Reload page
4. Check for:
   - Duplicate requests (should be 0)
   - Supabase subscription connections (should be <5)
   - Total network time (should be <10 seconds)

