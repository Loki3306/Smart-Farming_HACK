# SMS Notification Integration Guide

## Overview
This guide shows how to integrate SMS notifications with your existing Twilio setup for:
1. AI Recommendations from Python backend
2. Voice/Video calls
3. Chat messages

## Setup Complete ✅

### Files Created:
1. `server/services/SmsNotificationService.ts` - SMS sending service
2. `server/routes/notifications.ts` - Notification API endpoints
3. `DB_Scripts/ADD_SMS_NOTIFICATIONS.sql` - Database migration

### Files Modified:
1. `server/index.ts` - Added notification routes
2. `server/routes/chat.ts` - Added SMS for messages

## Configuration

### 1. Environment Variables (.env)
Add these to your `.env` file:

```env
# Existing Twilio vars (already have these)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=your_verify_sid

# Add this new one for SMS
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number

# Frontend URL for links in SMS
FRONTEND_URL=http://localhost:5000
```

### 2. Database Migration
Run this SQL script:
```bash
psql -U your_user -d your_database -f DB_Scripts/ADD_SMS_NOTIFICATIONS.sql
```

Or via Supabase dashboard:
- Go to SQL Editor
- Copy contents of `DB_Scripts/ADD_SMS_NOTIFICATIONS.sql`
- Execute

## Integration Points

### 1. AI Recommendations (Python Backend → Node Server → SMS)

#### Option A: Direct from Python backend
Add this to your Python FastAPI backend (`backend/app/main.py`):

```python
import httpx
import os

@app.post("/api/ai/recommend")
async def get_recommendations(data: dict):
    # ... your existing AI recommendation logic ...
    recommendations = await ai_service.get_recommendations(data)
    
    # Send SMS notification via Node server
    user_id = data.get("user_id")
    if user_id and recommendations:
        try:
            node_server_url = os.getenv("NODE_SERVER_URL", "http://localhost:3000")
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{node_server_url}/api/notifications/sms/ai-recommendation",
                    json={
                        "userId": user_id,
                        "recommendationType": recommendations[0].get("type", "Farming Advice"),
                        "summary": recommendations[0].get("description", "")[:150]
                    },
                    timeout=5.0
                )
        except Exception as e:
            # Don't fail the recommendation if SMS fails
            print(f"SMS notification failed: {e}")
    
    return recommendations
```

#### Option B: From Node.js when forwarding to Python
If your Node server forwards requests to Python backend:

```typescript
// In your recommendation route
app.post("/api/recommendations", async (req, res) => {
  // Forward to Python backend
  const pythonResponse = await fetch(`${PYTHON_AI_URL}/api/recommend`, {
    method: 'POST',
    body: JSON.stringify(req.body),
  });
  
  const recommendations = await pythonResponse.json();
  
  // Send SMS notification
  if (req.user?.id && recommendations.length > 0) {
    try {
      await fetch(`http://localhost:3000/api/notifications/sms/ai-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: req.user.id,
          recommendationType: recommendations[0].type || 'Farming Advice',
          summary: recommendations[0].description || ''
        })
      });
    } catch (e) {
      console.error('SMS notification failed:', e);
    }
  }
  
  res.json(recommendations);
});
```

### 2. Voice/Video Calls (Already in Frontend)

Add this to your call initiation in the frontend:

```typescript
// client/pages/Chat.tsx or wherever calls are initiated
const initiateCall = async (recipientId: string, callType: 'voice' | 'video') => {
  try {
    // Your existing call logic...
    
    // Send SMS notification
    await fetch('/api/notifications/sms/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId,
        callerId: currentUserId,
        callType
      })
    });
    
    // Continue with call...
  } catch (error) {
    console.error('Call failed:', error);
  }
};
```

### 3. Chat Messages ✅ (Already Integrated)
SMS notifications for chat messages are already integrated in `server/routes/chat.ts`.
Messages will trigger SMS if:
- Recipient has SMS notifications enabled
- Recipient has a phone number
- Recipient is offline OR inactive for 5+ minutes

## API Endpoints

### Send Call Notification
```bash
POST /api/notifications/sms/call
Content-Type: application/json

{
  "recipientId": "user-uuid",
  "callerId": "caller-uuid",
  "callType": "voice" | "video"
}
```

### Send Message Notification  
```bash
POST /api/notifications/sms/message
Content-Type: application/json

{
  "recipientId": "user-uuid",
  "senderId": "sender-uuid",
  "messagePreview": "Hey, how are you?"
}
```

### Send AI Recommendation
```bash
POST /api/notifications/sms/ai-recommendation
Content-Type: application/json

{
  "userId": "user-uuid",
  "recommendationType": "Irrigation Alert",
  "summary": "Your wheat crop needs immediate watering..."
}
```

### Send Weather Alert
```bash
POST /api/notifications/sms/weather-alert
Content-Type: application/json

{
  "userId": "user-uuid",
  "alertType": "Heavy Rain Warning",
  "alertMessage": "Heavy rainfall expected in next 24 hours..."
}
```

### Get User Preferences
```bash
GET /api/notifications/preferences/:userId
```

### Update User Preferences
```bash
PATCH /api/notifications/preferences/:userId
Content-Type: application/json

{
  "smsEnabled": true
}
```

## Frontend Integration

### 1. Add Phone Number Field to Settings

```typescript
// client/pages/Settings.tsx
import { useState } from 'react';
import { Input, Button, Switch } from '@/components/ui';

function NotificationSettings() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(true);

  const savePreferences = async () => {
    await fetch(`/api/notifications/preferences/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smsEnabled })
    });
  };

  return (
    <div>
      <h3>SMS Notifications</h3>
      
      <div>
        <label>Phone Number</label>
        <Input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+91 98765 43210"
        />
        <Button onClick={verifyPhone}>Verify Phone</Button>
      </div>

      <div>
        <label>Enable SMS Notifications</label>
        <Switch
          checked={smsEnabled}
          onCheckedChange={(checked) => {
            setSmsEnabled(checked);
            savePreferences();
          }}
        />
      </div>
    </div>
  );
}
```

### 2. Test the Integration

```bash
# Send test SMS
curl -X POST http://localhost:3000/api/notifications/sms/ai-recommendation \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "recommendationType": "Test Recommendation",
    "summary": "This is a test SMS notification"
  }'
```

## Cost Considerations

Twilio SMS pricing (India):
- **Outbound SMS**: ~₹0.50 - ₹1.00 per SMS
- **For 100 users**: ₹50-100 per day (if each gets 1 SMS)
- **For 1000 users**: ₹500-1000 per day

### Cost Optimization:
1. **Only send SMS when user is offline** ✅ (Already implemented for messages)
2. **Batch notifications**: Instead of 10 irrigation reminders, send 1 daily summary
3. **Rate limiting**: Max 3 SMS per user per day
4. **User preferences**: Let users choose which notifications they want

## Mock Mode for Testing

If Twilio credentials are not configured, the system runs in **MOCK MODE**:
- All SMS functions return `true`
- Logs what would be sent to console
- No actual SMS sent
- No charges incurred

Check logs for `[SMS] [MOCK MODE]` to verify.

## Troubleshooting

### SMS not sending?
1. Check Twilio credentials in `.env`
2. Verify `TWILIO_PHONE_NUMBER` is set
3. Check user has `phone_number` and `sms_notifications_enabled = true`
4. Check logs for `[SMS]` entries

### Database errors?
1. Run the migration script: `ADD_SMS_NOTIFICATIONS.sql`
2. Verify tables exist: `users`, `notification_log`, `notification_preferences`

### Testing without real SMS?
Remove Twilio credentials temporarily - system runs in mock mode.

## Next Steps

1. ✅ Run database migration
2. ✅ Add `TWILIO_PHONE_NUMBER` to `.env`
3. ⚠️ Integrate with Python AI backend (see Option A or B above)
4. ⚠️ Add phone number field to frontend settings
5. ⚠️ Add call notification triggers in frontend
6. ✅ Test with mock mode first
7. ✅ Test with real Twilio credentials

## Support

- Twilio SMS Docs: https://www.twilio.com/docs/sms
- Twilio Node.js SDK: https://www.twilio.com/docs/libraries/node
