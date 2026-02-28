# Community Page — Real-Time Integration Guide

## ✅ Implementation Status

| Component | Status | File Location |
|-----------|--------|---------------|
| Database Schema | ✅ Created | `COMMUNITY_SCHEMA.sql` |
| Server API Routes | ✅ Created | `server/routes/community.ts` |
| Server Index | ✅ Updated | `server/index.ts` |
| API Service | ✅ Created | `client/services/communityApi.ts` |
| React Hooks | ✅ Created | `client/hooks/useCommunity.ts` |
| Community.tsx | ✅ Updated | `client/pages/Community.tsx` |

---

## 🚀 Setup Steps

### Step 1: Run Database Schema

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to SQL Editor
3. Copy contents of `COMMUNITY_SCHEMA.sql`
4. Execute the SQL to create all tables

### Step 2: Verify Environment Variables

Ensure these are set in your `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Start the Server

```bash
npm run dev
```

---

## 📁 File Structure

```
client/
├── pages/
│   └── Community.tsx          # Main page (updated to use real API)
├── hooks/
│   └── useCommunity.ts        # Real-time React hooks
└── services/
    └── communityApi.ts        # API client + Supabase realtime

server/
├── index.ts                   # Express server (updated)
└── routes/
    └── community.ts           # All community API endpoints

COMMUNITY_SCHEMA.sql           # Database tables
```

---

## 🔗 API Endpoints

Base URL: `/api/community`

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | List posts with filters |
| POST | `/posts` | Create new post |
| GET | `/posts/:id` | Get single post with comments |
| DELETE | `/posts/:id` | Delete a post |

### Reactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/posts/:id/react` | Toggle reaction |
| GET | `/posts/:id/reactions` | Get reaction counts |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts/:id/comments` | Get comments |
| POST | `/posts/:id/comments` | Add comment |

### Experts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/experts` | List all experts |
| POST | `/experts/:id/follow` | Toggle follow |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Community statistics |
| GET | `/trending` | Trending topics |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/posts/:id/summarize` | Generate AI summary |

---

## 🎣 React Hooks

### `useCommunityPosts(options)`

Main hook for fetching and managing posts with real-time updates.

```tsx
const {
  posts,
  loading,
  error,
  hasMore,
  loadMore,
  refresh,
  createPost,
  deletePost,
} = useCommunityPosts({
  crop: 'Rice',      // Filter by crop
  type: 'question',  // Filter by post type
  search: 'water',   // Search query
  limit: 20,         // Posts per page
});
```

### `usePostReactions(postId, userId, initialCounts)`

Real-time reaction management for a single post.

```tsx
const {
  reactionCounts,
  userReactions,
  toggleReaction,
  loading,
} = usePostReactions(postId, userId);
```

### `usePostComments(postId, authorId)`

Real-time comments for a post.

```tsx
const {
  comments,
  loading,
  error,
  addComment,
  refresh,
} = usePostComments(postId, authorId);
```

### `useCommunityExperts(userId)`

Expert list with follow functionality.

```tsx
const {
  experts,
  loading,
  followedExperts,
  toggleFollow,
} = useCommunityExperts(userId);
```

### `useCommunityStats()`

Real-time community statistics.

```tsx
const {
  stats,
  trending,
  loading,
} = useCommunityStats();
```

### `useAISummary(postId)`

Generate AI summary for posts.

```tsx
const {
  summary,
  loading,
  generateSummary,
  cached,
} = useAISummary(postId);
```

---

## ⚡ Real-Time Subscriptions

The system automatically subscribes to:

1. **New Posts** - Instantly appear in feed
2. **Post Updates** - Trending status, expert replies
3. **Reactions** - Live reaction counts
4. **Comments** - Real-time comment threads
5. **Expert Follows** - Follow counts update live
6. **Community Stats** - Active farmers, posts today

---

## 🧪 Testing Multi-User Sync

1. Open the app in two browser windows
2. Create a post in Window A
3. See it appear instantly in Window B
4. Toggle a reaction in Window B
5. See count update in Window A

---

## 🎨 UI Features

### Loading States
- Skeleton loaders while data fetches
- Spinner on load more
- Disabled buttons during operations

### Error Handling
- Error cards with retry buttons
- Toast notifications for failures
- Offline indicator banner

### Optimistic Updates
- Reactions update immediately
- Server confirms in background
- Reverts on error

### Connection Status
- "Live" indicator when online
- Offline warning banner
- Auto-reconnect on network restore

---

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| `community_posts` | All user posts |
| `post_reactions` | Reactions (helpful, tried, etc.) |
| `post_comments` | Comment threads |
| `experts` | Verified expert profiles |
| `expert_follows` | Follow relationships |
| `community_stats` | Aggregated statistics |
| `ai_summaries` | Cached AI summaries |

---

## 🔒 Security

- Row Level Security (RLS) enabled
- Users can only modify their own posts
- Experts table is read-only for users
- Auth context provides user ID

---

## 🚦 Next Steps

1. [ ] Run `COMMUNITY_SCHEMA.sql` in Supabase
2. [ ] Seed initial expert data
3. [ ] Test with multiple browser sessions
4. [ ] Add image upload (Supabase Storage)
5. [ ] Implement AI summary with OpenAI
