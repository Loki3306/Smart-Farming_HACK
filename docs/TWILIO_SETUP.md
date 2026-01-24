# 📧 Twilio Setup Guide

This project uses Twilio for SMS notifications and alerts.

## Configuration
Add the following keys to your `.env` file:

```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"
```

## Demo Credentials
For testing purposes, you can use the provided demo credentials (if applicable in sandbox mode):
- **Number**: `7718839348`
- **Password**: `123456` 

*(Note: These are project-specific Credentials provided for the hackathon demo)*

## Usage
The Twilio service is initialized in `backend/app/services/twilio_service.py`. It sends alerts when:
1. Soil moisture drops below threshold.
2. Disease is detected with high confidence.
