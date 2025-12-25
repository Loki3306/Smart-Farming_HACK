# Notification System - Implementation Guide

## 🔔 Overview
Real-time notification system for user interactions in the Smart Farming community platform. Users receive instant notifications for reactions, comments, mentions, shares, and follows.

---

## 📊 Database Schema

### Table: `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,        -- Notification recipient  
  actor_id UUID NOT NULL,        -- User who triggered action
  type VARCHAR(50) NOT NULL,     -- notification type
  post_id UUID,                  -- Related post (optional)
  comment_id UUID,               -- Related comment (optional)
  message TEXT,                  -- Notification text
  read BOOLEAN DEFAULT FALSE,    -- Read status
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Notification Types
- `reaction` - Someone reacted to your post
- `comment` - Someone commented on your post
- `reply` - Someone replied to your comment
- `mention` - Someone mentioned you (@username)
- `share` - Someone shared your post
- `follow` - Someone followed you

### Indexes
- `idx_notifications_user_id` - Fast user lookups
- `idx_notifications_user_unread` - Unread count optimization
- `idx_notifications_created_at` - Chronological ordering

### Helper Functions
```sql
-- Get unread count
SELECT get_unread_notification_count('user-uuid');

-- Mark all as read
SELECT mark_all_notifications_read('user-uuid');

-- Clean old notifications (30+ days)
SELECT cleanup_old_notifications();
```

---

## 🔌 API Layer

### File: `client/services/communityApi.ts`

#### `notificationsApi.getNotifications(userId, limit)`
Fetches user's notifications with actor details.

```typescript
const notifications = await notificationsApi.getNotifications(userId, 20);
```

#### `notificationsApi.getUnreadCount(userId)`
Returns the count of unread notifications.

```typescript
const count = await notificationsApi.getUnreadCount(userId);
```

#### `notificationsApi.markAsRead(notificationId)`
Marks a single notification as read.

```typescript
await notificationsApi.markAsRead(notificationId);
```

#### `notificationsApi.markAllAsRead(userId)`
Marks all user's notifications as read.

```typescript
await notificationsApi.markAllAsRead(userId);
```

#### `notificationsApi.deleteNotification(notificationId)`
Deletes a notification.

```typescript
await notificationsApi.deleteNotification(notificationId);
```

#### `notificationsApi.createNotification(...)`
Creates a new notification (called when user interacts).

```typescript
await notificationsApi.createNotification(
  recipientId,
  actorId,
  'reaction',
  'liked your post',
  postId
);
```

#### `notificationsApi.subscribeToNotifications(userId, callback)`
Subscribes to real-time notifications via Supabase realtime.

```typescript
const channel = notificationsApi.subscribeToNotifications(
  userId,
  (notification) => {
    console.log('New notification:', notification);
  }
);
```

---

## ⚛️ React Hook

### File: `client/hooks/useCommunity.ts`

#### `useNotifications(userId)`
Custom hook for managing notifications state.

```typescript
const {
  notifications,      // Array of notification objects
  unreadCount,        // Number of unread notifications
  loading,            // Loading state
  error,              // Error message (if any)
  markAsRead,         // Function to mark as read
  markAllAsRead,      // Function to mark all as read
  deleteNotification, // Function to delete
  refresh,            // Function to refetch
} = useNotifications(userId);
```

**Features:**
- ✅ Fetches notifications on mount
- ✅ Real-time updates via Supabase subscription
- ✅ Automatic unread count tracking
- ✅ Optimistic UI updates
- ✅ Cleanup on unmount

---

## 🎨 UI Components

### NotificationBell Component
**File:** `client/components/community/NotificationBell.tsx`

Bell icon with badge showing unread count. Opens popover with notification list.

```tsx
<NotificationBell userId={currentUser.id} />
```

**Features:**
- 🔴 Red badge with unread count
- 📜 Scrollable list (up to 50 notifications)
- ✅ Mark as read (individual or all)
- 🗑️ Delete notifications
- ⏰ Time ago formatting
- 🎭 Animated transitions
- 📱 Responsive design
- 🎯 Click to navigate to related post

**UI Elements:**
- Avatar of user who triggered action
- Notification message with user name
- Type badge with emoji (👍 💬 @ 🔄 👤)
- Timestamp (e.g., "2m ago", "3h ago")
- Unread indicator (blue dot)
- Action buttons (mark read, delete)

---

## 🔗 Integration Points

### 1. Post Reactions
When a user reacts to a post, create a notification:

```typescript
const handleReaction = async (postId, reactionType) => {
  await reactionsApi.toggleReaction(postId, userId, reactionType);
  
  const post = posts.find(p => p.id === postId);
  if (post && post.author_id !== userId) {
    await notificationsApi.createNotification(
      post.author_id,
      userId,
      'reaction',
      `reacted ${emoji} to your post`,
      postId
    );
  }
};
```

### 2. Comments (TO BE IMPLEMENTED)
```typescript
const handleComment = async (postId, content) => {
  const comment = await commentsApi.createComment(postId, userId, content);
  
  const post = await postsApi.getPost(postId);
  if (post.author_id !== userId) {
    await notificationsApi.createNotification(
      post.author_id,
      userId,
      'comment',
      'commented on your post',
      postId,
      comment.id
    );
  }
};
```

### 3. Mentions (TO BE IMPLEMENTED)
```typescript
// Parse @mentions from post content
const mentions = extractMentions(content); // ['@user123', '@farmer456']

for (const mention of mentions) {
  await notificationsApi.createNotification(
    mention.userId,
    userId,
    'mention',
    'mentioned you in a post',
    postId
  );
}
```

### 4. Shares (TO BE IMPLEMENTED)
```typescript
const handleShare = async (postId) => {
  await sharesApi.createShare(postId, userId);
  
  const post = await postsApi.getPost(postId);
  if (post.author_id !== userId) {
    await notificationsApi.createNotification(
      post.author_id,
      userId,
      'share',
      'shared your post',
      postId
    );
  }
};
```

---

## 🚀 Usage in Community Page

### Setup (Already Integrated)

```tsx
import NotificationBell from "@/components/community/NotificationBell";

function Community() {
  const { user } = useAuth();
  
  return (
    <div className="header">
      <NotificationBell userId={user.id} />
      {/* Other header content */}
    </div>
  );
}
```

### Current Notification Triggers
1. ✅ **Post Reactions** - When someone reacts to your post
2. ⏳ **Comments** - TO BE IMPLEMENTED
3. ⏳ **Mentions** - TO BE IMPLEMENTED  
4. ⏳ **Shares** - TO BE IMPLEMENTED
5. ⏳ **Follows** - TO BE IMPLEMENTED

---

## 🎯 User Experience Flow

### 1. User Receives Notification
- Real-time subscription detects new notification
- Badge count increments automatically
- Badge appears on bell icon (red with number)

### 2. User Opens Notification Center
- Clicks bell icon
- Popover opens with notification list
- Unread notifications highlighted with blue dot
- Most recent at top

### 3. User Interacts with Notification
- **Click notification** → Navigate to related post
- **Click checkmark** → Mark as read
- **Click trash** → Delete notification
- **Click "Mark all as read"** → Mark all as read

### 4. Real-time Updates
- New notifications appear instantly
- No page refresh needed
- Smooth animations for new items

---

## 🔧 Configuration

### Environment Variables
Ensure Supabase credentials are set:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Realtime Subscription
Requires Supabase Realtime enabled on `notifications` table:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## 📝 Database Setup Steps

1. **Run SQL Script**
   ```bash
   # Execute CREATE_NOTIFICATIONS.sql in Supabase SQL Editor
   ```

2. **Verify Table Creation**
   ```sql
   SELECT * FROM notifications LIMIT 1;
   ```

3. **Test Helper Functions**
   ```sql
   SELECT get_unread_notification_count('test-user-id');
   ```

4. **Enable Realtime**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
   ```

---

## 🧪 Testing

### Create Test Notification
```sql
INSERT INTO notifications (user_id, actor_id, type, post_id, message)
VALUES (
  'recipient-user-id',
  'actor-user-id', 
  'reaction',
  'post-id',
  'liked your post'
);
```

### Verify Real-time Subscription
1. Open Community page
2. Open browser console
3. Create notification via SQL (as above)
4. Check console for subscription event
5. Verify notification appears in bell dropdown

### Test Unread Count
1. Create multiple unread notifications
2. Check bell badge shows correct count
3. Click "Mark all as read"
4. Verify badge disappears

---

## 🎨 Styling Customization

### Badge Colors
- **Unread**: Red badge (`variant="destructive"`)
- **Read**: Normal text color
- **Hover**: Accent background

### Icons
- **Bell**: `<Bell />` (lucide-react)
- **Reaction**: 👍
- **Comment**: 💬
- **Reply**: ↩️
- **Mention**: @
- **Share**: 🔄
- **Follow**: 👤

---

## 🚀 Future Enhancements

### Phase 2 - Notification Triggers
- [ ] Comment notifications
- [ ] Reply notifications  
- [ ] Mention detection and notifications
- [ ] Share notifications
- [ ] Follow notifications

### Phase 3 - Advanced Features
- [ ] Notification preferences (toggle types)
- [ ] Email notifications
- [ ] Push notifications (PWA)
- [ ] Notification grouping ("User1 and 3 others liked your post")
- [ ] Read receipts
- [ ] Notification sound effects
- [ ] Do Not Disturb mode
- [ ] Notification history page

### Phase 4 - Analytics
- [ ] Notification engagement metrics
- [ ] Most active notification types
- [ ] Average response time
- [ ] User notification preferences dashboard

---

## 🐛 Troubleshooting

### Notifications Not Appearing
1. Check Supabase connection
2. Verify user_id is correct
3. Check browser console for errors
4. Verify RLS policies allow access
5. Check realtime subscription status

### Real-time Not Working
1. Verify `ALTER PUBLICATION supabase_realtime ADD TABLE notifications;`
2. Check Supabase realtime connection in Network tab
3. Verify channel subscription in console
4. Test manual notification creation

### Badge Count Wrong
1. Check `get_unread_notification_count()` function
2. Verify read/unread status updates
3. Clear and refetch notifications
4. Check for duplicate subscriptions

---

## 📚 Related Files

- `DB_Scripts/CREATE_NOTIFICATIONS.sql` - Database schema
- `client/services/communityApi.ts` - API layer (notificationsApi)
- `client/hooks/useCommunity.ts` - useNotifications hook
- `client/components/community/NotificationBell.tsx` - UI component
- `client/pages/Community.tsx` - Integration point

---

## ✅ Checklist

- [x] Database schema created
- [x] RLS policies configured
- [x] Helper functions added
- [x] API layer implemented
- [x] React hook created
- [x] UI component built
- [x] Real-time subscription working
- [x] Integrated into Community page
- [x] Reaction notifications working
- [ ] Comment notifications (pending)
- [ ] Mention notifications (pending)
- [ ] Share notifications (pending)
- [ ] Follow notifications (pending)

---

## 🎉 Success!

The notification system is now **live and functional** for post reactions! Users will see real-time notifications when others interact with their posts.

Next steps: Implement comment, mention, share, and follow notifications using the same pattern.
