# Migration: Add Data Column to Notifications

## Overview
This migration adds a `data` JSONB column to the notifications table to store additional structured data, such as recommendation cards.

## Steps to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `DB_Scripts/ADD_DATA_TO_NOTIFICATIONS.sql`
4. Click **Run** to execute the migration

### Option 2: Supabase CLI
```bash
supabase db push --local
```

### Option 3: Direct PostgreSQL
If you have direct database access:
```bash
psql -h <host> -U <user> -d <database> -f DB_Scripts/ADD_DATA_TO_NOTIFICATIONS.sql
```

## What This Migration Does

1. **Adds `data` column**: A JSONB column to store flexible JSON data
2. **Creates GIN index**: Optimizes JSONB queries on the data column
3. **Updates notification_details view**: Includes the new data column
4. **Updates type constraint**: Adds 'recommendation' to valid notification types

## Schema Change

### Before
```sql
CREATE TABLE notifications (
  id UUID,
  user_id UUID,
  actor_id UUID,
  type VARCHAR(50),  -- reaction, comment, reply, etc.
  message TEXT,
  read BOOLEAN,
  created_at TIMESTAMP
);
```

### After
```sql
CREATE TABLE notifications (
  id UUID,
  user_id UUID,
  actor_id UUID,
  type VARCHAR(50),  -- now includes 'recommendation'
  message TEXT,
  data JSONB,        -- NEW: stores recommendation cards, etc.
  read BOOLEAN,
  created_at TIMESTAMP
);
```

## Example Data Structure

### Recommendation Notification
```json
{
  "recommendations": [
    {
      "id": "rec_1",
      "type": "irrigation",
      "priority": "high",
      "title": "Increase Irrigation Frequency",
      "description": "Soil moisture is below optimal levels",
      "action": "Water your crops twice daily",
      "confidence": 94.5,
      "timestamp": "2025-01-15T10:30:00Z"
    },
    {
      "id": "rec_2",
      "type": "fertilizer",
      "priority": "medium",
      "title": "Apply Nitrogen Fertilizer",
      "description": "Nitrogen levels are slightly low",
      "action": "Apply 50kg/hectare of urea",
      "confidence": 87.2,
      "timestamp": "2025-01-15T10:30:00Z"
    }
  ]
}
```

## Testing

After running the migration, test with:
```sql
-- Insert a test notification with recommendation data
INSERT INTO notifications (user_id, actor_id, type, message, data)
VALUES (
  'your-user-id',
  'your-user-id',
  'recommendation',
  '🤖 2 new farming recommendations available',
  '{"recommendations": [{"id": "test", "type": "irrigation", "priority": "high", "title": "Test", "description": "Test", "action": "Test", "confidence": 95.0}]}'::jsonb
);

-- Query to verify
SELECT * FROM notification_details WHERE type = 'recommendation';
```

## Rollback (if needed)

If you need to undo this migration:
```sql
-- Remove the data column
ALTER TABLE notifications DROP COLUMN IF EXISTS data;

-- Restore old type constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('reaction', 'comment', 'reply', 'mention', 'share', 'follow', 'message'));

-- Recreate view without data column
CREATE OR REPLACE VIEW notification_details AS
SELECT 
  n.id,
  n.user_id,
  n.actor_id,
  n.type,
  n.post_id,
  n.comment_id,
  n.message,
  n.read,
  n.created_at,
  f.name AS actor_name,
  f.phone AS actor_phone
FROM notifications n
JOIN farmers f ON n.actor_id = f.id;
```

## Impact

- ✅ Backward compatible: Existing notifications will have `data = NULL`
- ✅ No breaking changes to existing code
- ✅ Enables rich notification content (recommendation cards, etc.)
- ✅ Performance: GIN index ensures fast JSONB queries

## Next Steps

After running this migration:
1. Frontend will automatically send recommendation data with notifications
2. Notifications page will render recommendation cards inline
3. Users can see AI recommendations directly in their notifications
