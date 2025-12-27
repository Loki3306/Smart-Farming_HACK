# AI Recommendations Notifications Implementation

## Summary
Successfully implemented two key features:
1. **Real Notification Badge**: Sidebar notification badge now displays actual unread count from database
2. **AI Recommendation Notifications**: System automatically sends notifications when AI recommendations are generated

## Changes Made

### 1. Server-Side (Backend)

#### `server/routes/notifications.ts`
**Added POST endpoint to create notifications:**
```typescript
POST /api/notifications
- Creates new notifications
- Required fields: user_id, type, message
- Optional fields: actor_id (defaults to 'system'), post_id, comment_id
- Returns created notification object
```

### 2. Client-Side Services

#### `client/services/apiNotificationService.ts`
**Added notification creation function:**
- Updated `ApiNotification` type to include `'recommendation'` type
- Added `createNotification()` method to service:
  - Takes: userId, actorId, type, message, postId, commentId
  - Returns: Created notification
  - Makes POST request to `/api/notifications`

### 3. Sidebar Component

#### `client/components/layout/Sidebar.tsx`
**Replaced fake badge with real count:**
- Added import: `useNotifications` hook
- Removed hardcoded `badge: 3` from bottomNavItems
- Now displays real unread count from database
- Badge shows "99+" for counts over 99
- Only displays when unreadCount > 0

**Before:**
```tsx
{ label: "Notifications", icon: Bell, path: "/notifications", badge: 3 }
```

**After:**
```tsx
{ label: "Notifications", icon: Bell, path: "/notifications" }
// Dynamic badge in render:
{unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}
```

### 4. Recommendations Page

#### `client/pages/Recommendations.tsx`
**Added notification creation on AI analysis:**
- Imports `apiNotificationService`
- After successful AI analysis, creates notification
- Smart message generation:
  - High priority: "${count} new recommendations (${highPriorityCount} high priority)"
  - Normal: "${count} new farming recommendations available"
- Notification type: `'recommendation'`
- Actor: `'system'`
- Only sends if user authenticated and recommendations > 0

**Implementation:**
```typescript
if (user?.id && mappedRecommendations.length > 0) {
  const highPriorityCount = mappedRecommendations.filter(r => r.priority === 'high').length;
  const message = highPriorityCount > 0 
    ? `${mappedRecommendations.length} new recommendations (${highPriorityCount} high priority)`
    : `${mappedRecommendations.length} new farming recommendations available`;
  
  await apiNotificationService.createNotification(
    user.id,
    'system',
    'recommendation',
    message,
    null,
    null
  );
}
```

### 5. Notifications Display

#### `client/pages/Notifications.tsx`
**Added support for recommendation notifications:**
- Added `Lightbulb` icon import
- Added case for `'recommendation'` type in `getIcon()`
  - Icon: Lightbulb
  - Color: Amber (yellow/orange)
- Returns: `<Lightbulb className="w-5 h-5" />`

**Color scheme:**
```typescript
case "recommendation":
  return "text-amber-500 bg-amber-100";
```

## User Experience Flow

### Scenario 1: AI Recommendations Generated
1. User clicks "Analyze Farm Data" on Recommendations page
2. AI backend processes data and returns recommendations
3. System automatically creates notification
4. Notification appears in bell icon (badge increments)
5. Real-time: Notification instantly appears without refresh
6. User clicks bell → sees "5 new recommendations (2 high priority)"
7. Click notification → navigates to Recommendations page (future enhancement)

### Scenario 2: Real Badge Count
1. User has 3 unread notifications in database
2. Sidebar loads → calls useNotifications() hook
3. Hook fetches unread count from API
4. Badge displays "3" next to Notifications icon
5. User marks 1 as read → badge updates to "2"
6. User marks all as read → badge disappears
7. New notification arrives → badge reappears with "1"

## Technical Details

### Notification Type: `'recommendation'`
- **Actor**: `'system'` (not a user)
- **Message**: Dynamic based on priority count
- **Post ID**: `null` (not associated with a post)
- **Comment ID**: `null` (not associated with a comment)
- **Read Status**: `false` (initially unread)
- **Created At**: Timestamp from database

### Badge Behavior
- **Hidden**: When unreadCount = 0
- **Displays**: When unreadCount > 0
- **Format**: Number (1-99) or "99+"
- **Color**: Red background, white text
- **Position**: Right side of "Notifications" label
- **Updates**: Real-time via useNotifications hook

### API Integration
```
POST /api/notifications
Request Body:
{
  "user_id": "uuid",
  "actor_id": "system",
  "type": "recommendation",
  "message": "5 new recommendations (2 high priority)",
  "post_id": null,
  "comment_id": null
}

Response:
{
  "notification": {
    "id": "uuid",
    "user_id": "uuid",
    "actor_id": "system",
    "type": "recommendation",
    "message": "...",
    "read": false,
    "created_at": "2025-12-27T..."
  }
}
```

## Files Modified
1. ✅ `server/routes/notifications.ts` - Added POST endpoint
2. ✅ `client/services/apiNotificationService.ts` - Added createNotification function
3. ✅ `client/components/layout/Sidebar.tsx` - Real badge count
4. ✅ `client/pages/Recommendations.tsx` - Send notifications
5. ✅ `client/pages/Notifications.tsx` - Display recommendation type

## Benefits
1. **Better User Engagement**: Users notified of new AI insights
2. **Real Data**: No more fake/hardcoded numbers
3. **Consistency**: Notification system unified across all features
4. **Real-time**: Badge updates instantly via Supabase subscriptions
5. **Scalable**: Easy to add more notification types (weather alerts, marketplace deals, etc.)

## Future Enhancements
1. Click notification → Navigate to Recommendations page with highlight
2. Add "View Recommendations" button in notification
3. Group multiple recommendation notifications
4. Add notification preferences (enable/disable recommendation alerts)
5. Show recommendation summary in notification (e.g., "2 irrigation, 3 fertilizer")
6. Add notification for high-priority recommendations only
7. Schedule notifications for optimal farming times

## Testing Checklist
- [ ] Generate recommendations → notification created
- [ ] Sidebar badge shows correct unread count
- [ ] Mark notification as read → badge decreases
- [ ] Mark all as read → badge disappears
- [ ] New notification → badge reappears
- [ ] Real-time updates work (no page refresh needed)
- [ ] Notification displays with Lightbulb icon
- [ ] Amber color scheme applied to recommendation notifications
- [ ] Badge shows "99+" for count > 99
- [ ] System notifications show "System" as actor
