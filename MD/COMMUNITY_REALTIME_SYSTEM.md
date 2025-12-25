# Community Page — Real-Time System Architecture

## Overview

This document describes the real-time, non-mocked Community Page system for the Smart Farming platform. All data is persisted in Supabase and synchronized across all connected clients in real-time.

---

## 1. Real-Time Strategy: Supabase Realtime (PostgreSQL + WebSockets)

### Why This Approach?

| Factor | Supabase Realtime |
|--------|-------------------|
| **Already integrated** | Your backend uses Supabase |
| **WebSocket-based** | Persistent connections, instant updates |
| **Database triggers** | Any INSERT/UPDATE/DELETE broadcasts automatically |
| **Row-level filtering** | Subscribe to specific posts, users, or topics |
| **Scales horizontally** | Supabase handles connection pooling |

### How It Works

```
┌─────────────┐     INSERT/UPDATE     ┌─────────────┐
│   User A    │ ────────────────────► │  Supabase   │
│  (Browser)  │                       │  Database   │
└─────────────┘                       └──────┬──────┘
                                             │
                                      Realtime Broadcast
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    ▼                        ▼                        ▼
             ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
             │   User A    │          │   User B    │          │   User C    │
             │  (Browser)  │          │  (Browser)  │          │  (Browser)  │
             └─────────────┘          └─────────────┘          └─────────────┘
```

### Dev vs Prod Consistency

- **Same Supabase project** used in development and production
- All developers connect to the same database
- Real-time subscriptions work identically in both environments
- No mock data layer to maintain

---

## 2. Database Schema for Community

### Tables Required

```sql
-- Community Posts
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('success', 'question', 'problem', 'update')),
  content TEXT NOT NULL,
  crop VARCHAR(100),
  method VARCHAR(200),
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Reactions (one per user per post per type)
CREATE TABLE post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('helpful', 'tried', 'didnt_work', 'new_idea')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id, reaction_type)
);

-- Post Comments
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_expert_reply BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experts Profile (extends farmers)
CREATE TABLE experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE UNIQUE,
  specializations TEXT[] DEFAULT '{}',
  experience VARCHAR(50),
  is_verified BOOLEAN DEFAULT false,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expert Follows
CREATE TABLE expert_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(expert_id, follower_id)
);

-- Community Stats (materialized/cached)
CREATE TABLE community_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  active_farmers INTEGER DEFAULT 0,
  posts_today INTEGER DEFAULT 0,
  questions_answered_percent INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Summaries Cache
CREATE TABLE ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE UNIQUE,
  summary TEXT NOT NULL,
  common_solution TEXT,
  warnings TEXT,
  best_practice TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_posts_author ON community_posts(author_id);
CREATE INDEX idx_posts_created ON community_posts(created_at DESC);
CREATE INDEX idx_posts_type ON community_posts(post_type);
CREATE INDEX idx_posts_crop ON community_posts(crop);
CREATE INDEX idx_reactions_post ON post_reactions(post_id);
CREATE INDEX idx_comments_post ON post_comments(post_id);
CREATE INDEX idx_expert_follows_expert ON expert_follows(expert_id);

-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE expert_follows;
ALTER PUBLICATION supabase_realtime ADD TABLE community_stats;
```

---

## 3. Data Flow: Posts

### Creating a Post

```
1. User clicks "Create Post"
2. Fills guided form (type, crop, content, method, image)
3. Client calls POST /api/community/posts
4. Server validates & inserts into community_posts
5. Supabase broadcasts INSERT event
6. All subscribed clients receive the new post
7. Feed updates instantly without refresh
```

### Feed Subscription (Client-Side)

```typescript
// Subscribe to new posts
supabase
  .channel('community-posts')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'community_posts' },
    (payload) => {
      // Add new post to feed state
      setPosts(prev => [payload.new, ...prev]);
    }
  )
  .subscribe();
```

### Ordering

- Posts ordered by `created_at DESC` (newest first)
- Trending posts (`is_trending = true`) can be boosted
- Client maintains sorted order on new inserts

---

## 4. Data Flow: Reactions

### Reaction Schema

```
post_reactions:
  - post_id: UUID (which post)
  - user_id: UUID (who reacted)
  - reaction_type: 'helpful' | 'tried' | 'didnt_work' | 'new_idea'
  - UNIQUE(post_id, user_id, reaction_type) — prevents duplicates
```

### Toggle Reaction Flow

```
1. User clicks reaction button
2. Client calls POST /api/community/posts/:id/react
3. Server checks if reaction exists:
   - If exists: DELETE (unreact)
   - If not: INSERT (react)
4. Supabase broadcasts change
5. All clients update reaction counts
```

### Conflict Handling

- UNIQUE constraint prevents duplicate reactions
- Optimistic UI: show change immediately, rollback on error
- Server is source of truth

### Aggregating Counts

```sql
-- View for reaction counts per post
CREATE VIEW post_reaction_counts AS
SELECT 
  post_id,
  reaction_type,
  COUNT(*) as count
FROM post_reactions
GROUP BY post_id, reaction_type;
```

---

## 5. Data Flow: Comments

### Comment Creation

```
1. User types comment, clicks send
2. Client calls POST /api/community/posts/:id/comments
3. Server inserts into post_comments
4. If author is expert → is_expert_reply = true
5. Supabase broadcasts INSERT
6. All clients viewing that post see new comment
```

### Subscription Model

```typescript
// Subscribe to comments for a specific post
supabase
  .channel(`comments-${postId}`)
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
    (payload) => {
      setComments(prev => [...prev, payload.new]);
    }
  )
  .subscribe();
```

### Expert Reply Distinction

- When inserting comment, check if `author_id` exists in `experts` table
- Set `is_expert_reply = true` automatically via trigger or server logic
- UI shows expert badge on these comments

---

## 6. Data Flow: Experts Tab

### Expert Activity Tracking

```sql
-- Update last_active_at when expert posts/comments
CREATE OR REPLACE FUNCTION update_expert_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE experts SET last_active_at = NOW()
  WHERE farmer_id = NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expert_post_activity
AFTER INSERT ON community_posts
FOR EACH ROW EXECUTE FUNCTION update_expert_activity();

CREATE TRIGGER expert_comment_activity
AFTER INSERT ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_expert_activity();
```

### "Active This Week" Logic

```sql
-- Expert is active if last_active_at > NOW() - INTERVAL '7 days'
SELECT *, 
  (last_active_at > NOW() - INTERVAL '7 days') AS is_active_this_week
FROM experts;
```

### Follow/Unfollow Propagation

```
1. User clicks Follow/Unfollow
2. Client calls POST /api/community/experts/:id/follow
3. Server inserts/deletes from expert_follows
4. Supabase broadcasts change
5. All clients update follower counts
```

---

## 7. Search & Filtering

### Query Strategy

```sql
-- Search posts by text, crop, tag, type, author
SELECT p.*, f.name as author_name, f.phone as author_location
FROM community_posts p
JOIN farmers f ON p.author_id = f.id
WHERE 
  (p.content ILIKE '%' || $search || '%' OR p.crop ILIKE '%' || $search || '%')
  AND ($crop IS NULL OR p.crop = $crop)
  AND ($type IS NULL OR p.post_type = $type)
  AND ($tag IS NULL OR $tag = ANY(p.tags))
ORDER BY p.created_at DESC
LIMIT 20 OFFSET $offset;
```

### Basic Indexing

```sql
-- Text search index (PostgreSQL full-text)
CREATE INDEX idx_posts_content_search ON community_posts USING GIN(to_tsvector('english', content));

-- Crop and type indexes already created above
```

### Performance

- Pagination with LIMIT/OFFSET
- Filter indexes reduce scan size
- For large scale: consider Supabase Edge Functions for caching

---

## 8. Sidebar: Live Metrics

### Metrics Computed

```sql
-- Active farmers: users who posted/commented in last 24h
SELECT COUNT(DISTINCT author_id) 
FROM (
  SELECT author_id FROM community_posts WHERE created_at > NOW() - INTERVAL '24 hours'
  UNION
  SELECT author_id FROM post_comments WHERE created_at > NOW() - INTERVAL '24 hours'
) active;

-- Posts today
SELECT COUNT(*) FROM community_posts WHERE created_at > CURRENT_DATE;

-- Questions answered %
SELECT 
  (COUNT(CASE WHEN EXISTS (
    SELECT 1 FROM post_comments c WHERE c.post_id = p.id
  ) THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0))::INTEGER
FROM community_posts p
WHERE p.post_type = 'question';
```

### Update Strategy

- **community_stats** table updated every 5 minutes via Supabase Edge Function or cron
- Clients subscribe to `community_stats` table for real-time updates
- Trade-off: near-real-time (5 min) vs true real-time (expensive aggregations)

---

## 9. AI Summary

### Trigger

- User clicks "Summarize" button on a post with 5+ comments
- Only generate if not already cached

### Data Flow

```
1. Client calls POST /api/community/posts/:id/summarize
2. Server checks ai_summaries for existing cache
3. If cached: return immediately
4. If not: 
   a. Fetch post + all comments
   b. Send to Python AI backend (existing PYTHON_AI_URL)
   c. Store result in ai_summaries
   d. Return to client
5. Subsequent calls return cached result
```

### Cache Invalidation

- New comment on post: mark summary as stale (optional)
- Or: regenerate on demand only

---

## 10. Mascot: Event-Driven Behavior

### Event Triggers

| Event | Mascot Message |
|-------|----------------|
| First post by user | "बहुत बढ़िया! पहली पोस्ट के लिए बधाई!" |
| First reaction received | "आपकी पोस्ट को पसंद किया गया!" |
| Expert replied | "एक विशेषज्ञ ने जवाब दिया है!" |
| No activity 5+ min | "कोई सवाल है? पूछने में संकोच न करें।" |
| Trending post | "आपकी पोस्ट trending है! 🔥" |

### Implementation

```typescript
// Client-side event listener
useEffect(() => {
  const channel = supabase
    .channel('user-events')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'post_reactions', filter: `post_id=in.(${userPostIds.join(',')})` },
      () => setMascotMessage({ message: "आपकी पोस्ट को पसंद किया गया!", show: true })
    )
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, [userPostIds]);
```

### Non-Intrusive Rules

- Mascot auto-dismisses after 5 seconds
- Only one message at a time
- User can dismiss immediately
- No sound effects

---

## 11. Authentication (Minimum Viable)

### Current System

Your app already has:
- `farmers` table with phone-based auth
- OTP verification (`/api/otp/send`, `/api/otp/verify`)

### Identity Attachment

```typescript
// Every API call includes user ID from session
app.post('/api/community/posts', async (req, res) => {
  const userId = req.session.userId; // or from JWT
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const post = await db.createPost({ ...req.body, author_id: userId });
  res.json(post);
});
```

### Farmer vs Expert

- Check if `farmer_id` exists in `experts` table
- Add `is_expert` flag to session/JWT
- UI shows different badges based on role

---

## 12. Development Consistency

### How Multiple Developers See Same State

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Developer A │     │  Developer B │     │  Developer C │
│  localhost   │     │  localhost   │     │  localhost   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Supabase Cloud  │
                  │  (Single Source) │
                  └──────────────────┘
```

- **All environments connect to same Supabase project**
- No local database for community features
- Real-time subscriptions work across all machines
- Test users created once, visible to everyone

### Test User Strategy

```sql
-- Create test users for development
INSERT INTO farmers (id, name, phone, password) VALUES
  ('test-farmer-1', 'Test Farmer 1', '+911111111111', 'hashed_password'),
  ('test-farmer-2', 'Test Farmer 2', '+912222222222', 'hashed_password'),
  ('test-expert-1', 'Test Expert', '+913333333333', 'hashed_password');

INSERT INTO experts (farmer_id, specializations, experience, is_verified) VALUES
  ('test-expert-1', ARRAY['Rice', 'Wheat'], '10 years', true);
```

---

## 13. Error & Failure Handling

### Network Drop

```typescript
// Supabase auto-reconnects
// Client shows offline indicator
const [isOnline, setIsOnline] = useState(true);

supabase.channel('system')
  .on('system', { event: 'disconnect' }, () => setIsOnline(false))
  .on('system', { event: 'reconnect' }, () => setIsOnline(true))
  .subscribe();
```

### Duplicate Submissions

- **Client**: Disable submit button during request
- **Server**: UNIQUE constraints prevent duplicates
- **Optimistic UI**: Show pending state, confirm on success

### Partial Failures

```typescript
// Transaction for multi-step operations
const { error } = await supabase.rpc('create_post_with_tags', {
  content: '...',
  tags: ['wheat', 'organic']
});

if (error) {
  toast({ title: 'Failed to create post', variant: 'destructive' });
  // Rollback optimistic update
}
```

### Latency Spikes

- Show loading spinners for actions > 500ms
- Timeout after 10 seconds with retry option
- Cache previous feed state for instant display

---

## 14. File Structure

```
server/
├── routes/
│   └── community.ts          # All community API endpoints
├── db/
│   └── community.ts          # Database helper functions
│   └── supabase.ts           # Existing Supabase client

client/
├── pages/
│   └── Community.tsx         # Main page component
├── hooks/
│   └── useCommunityRealtime.ts  # Real-time subscriptions
│   └── useCommunityPosts.ts     # Posts CRUD
│   └── useCommunityExperts.ts   # Experts data
├── services/
│   └── communityApi.ts       # API call functions
```

---

## 15. Implementation Order

1. **Database Schema** — Run SQL in Supabase
2. **Server Routes** — CRUD endpoints
3. **Real-time Hooks** — Client subscriptions
4. **UI Integration** — Connect components to hooks
5. **Testing** — Multiple browser sessions

---

## Summary

| Requirement | Solution |
|-------------|----------|
| Real-time updates | Supabase Realtime (WebSockets) |
| Data persistence | PostgreSQL via Supabase |
| Multi-user consistency | Single cloud database |
| Dev/Prod parity | Same Supabase project |
| Authentication | Existing phone OTP system |
| Scalability | Supabase handles connection pooling |
