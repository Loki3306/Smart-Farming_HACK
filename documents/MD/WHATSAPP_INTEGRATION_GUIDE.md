# WhatsApp Integration Guide

## Overview
Krushi Unnati now supports seamless WhatsApp integration, allowing users to shift their conversations to WhatsApp with smart, personalized greetings.

## Features

### 1. **Smart Greeting Messages**
- **First-time conversation**: Sends a personalized introduction
  - Format: "Namaste [FirstName], myself [FullName]. Greetings! We got your contact from Krushi Unnati."
  - Example: "Namaste Raj, myself Lokesh Kumar. Greetings! We got your contact from Krushi Unnati."

- **Existing conversation**: Simple redirect
  - No pre-filled message
  - Shows system message in chat: "📱 Conversation shifted to WhatsApp"

### 2. **User Interface**
- WhatsApp button (green icon) appears beside video call button in chat header
- Hidden on mobile devices for cleaner UI
- Shows confirmation dialog before redirecting

### 3. **Confirmation Dialog**
- Asks user to confirm before opening WhatsApp
- Displays other user's name
- Cancel or proceed options

## Technical Implementation

### Components Created/Modified

#### 1. **WhatsAppDialog.tsx** (New)
- Confirmation dialog with green theme
- Props: `open`, `onOpenChange`, `otherUserName`, `onConfirm`
- Uses `AlertDialog` from shadcn/ui

#### 2. **ChatHeader.tsx** (Modified)
- Added `MessageCircle` icon from lucide-react
- New prop: `onWhatsApp?: () => void`
- WhatsApp button positioned between Video and dropdown menu

#### 3. **ChatWindow.tsx** (Modified)
- Implements `handleWhatsApp()` - Opens dialog
- Implements `confirmWhatsApp()` - Main logic:
  1. Fetches other user's phone from database
  2. Checks message history
  3. Generates appropriate greeting
  4. Opens WhatsApp with `wa.me` URL
  5. Adds system message if existing conversation

#### 4. **MessageBubble.tsx** (Modified)
- Handles system messages differently
- System messages are centered, gray, italic
- Format: `message_type === 'system'`

#### 5. **chatService.ts** (Modified)
- Added `message_type` field to `Message` interface
- Types: `'text' | 'system' | 'image'`

### Database Changes

#### New Column: `message_type`
```sql
ALTER TABLE messages 
ADD COLUMN message_type VARCHAR(20) DEFAULT 'text' 
CHECK (message_type IN ('text', 'system', 'image'));
```

**Migration Script**: `DB_Scripts/ADD_MESSAGE_TYPE_COLUMN.sql`

## How It Works

### Flow Diagram
```
User clicks WhatsApp button
    ↓
Confirmation dialog opens
    ↓
User confirms
    ↓
Fetch other user's phone number
    ↓
Check if messages exist in conversation
    ↓
┌─────────────────────┬──────────────────────┐
│ First Conversation  │ Existing Conversation│
├─────────────────────┼──────────────────────┤
│ Generate greeting   │ No pre-filled message│
│ Open WhatsApp with  │ Add system message   │
│ pre-filled message  │ Open WhatsApp        │
└─────────────────────┴──────────────────────┘
```

### Code Flow

1. **Button Click** → `handleWhatsApp()` → Opens dialog

2. **Confirm** → `confirmWhatsApp()`:
```typescript
// Fetch phone
const { data } = await supabase
  .from('farmers')
  .select('phone, name')
  .eq('id', other_user_id)
  .single();

// Check messages
const hasMessages = messages.length > 0;

// Generate message or add system message
if (!hasMessages) {
  const firstName = otherUserData.name.split(' ')[0];
  whatsappMessage = `Namaste ${firstName}, myself ${user.name}. 
    Greetings! We got your contact from Krushi Unnati.`;
} else {
  await supabase.from('messages').insert({
    conversation_id,
    sender_id: user.id,
    receiver_id: other_user_id,
    content: '📱 Conversation shifted to WhatsApp',
    message_type: 'system'
  });
}

// Open WhatsApp
const phoneNumber = phone.replace(/[^0-9]/g, '');
const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
window.open(url, '_blank');
```

## Requirements

### Database
- Phone numbers must be stored in `farmers.phone` field
- Format: `VARCHAR(15)`, example: `+919876543210`

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile: Opens WhatsApp app
- Desktop: Opens WhatsApp Web

## Testing Checklist

- [ ] WhatsApp button visible in chat header (desktop only)
- [ ] Button shows green color
- [ ] Confirmation dialog appears on click
- [ ] First-time greeting generated correctly
- [ ] Existing conversation redirects without message
- [ ] System message appears in chat for existing conversations
- [ ] URL opens correctly on mobile (WhatsApp app)
- [ ] URL opens correctly on desktop (WhatsApp Web)
- [ ] Phone number validation works
- [ ] Error handling for missing phone numbers

## Error Handling

### No Phone Number
```typescript
if (error || !otherUserData?.phone) {
  alert('Unable to get user\'s WhatsApp number. Please try again later.');
  return;
}
```

### Invalid Phone Format
- Automatically strips non-numeric characters
- Assumes phone numbers are in international format

## Future Enhancements

- [ ] Add WhatsApp status indicator (online/offline)
- [ ] Track WhatsApp redirects in analytics
- [ ] Allow custom greeting message templates
- [ ] Add WhatsApp QR code option
- [ ] Sync messages from WhatsApp back to Krushi Unnati
- [ ] WhatsApp Business API integration for automated messages

## Support

For issues or questions:
- Check console logs for errors
- Verify phone numbers in database
- Ensure `message_type` column exists in messages table
- Run migration script if needed: `ADD_MESSAGE_TYPE_COLUMN.sql`
