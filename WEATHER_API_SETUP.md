# Weather API Setup Guide

## Overview
The Smart Farming platform now includes **real-time weather data** based on your farm's GPS location using the OpenWeatherMap API.

## Features
✅ **GPS-based weather** - Fetches weather for your farm's exact location  
✅ **Current conditions** - Temperature, humidity, wind speed, pressure, rain probability  
✅ **3-day forecast** - Daily high/low temps and rain chances  
✅ **Automatic fallback** - Uses mock data if API key not configured  
✅ **Free tier compatible** - Works with OpenWeatherMap's free API plan  

## Setup Instructions

### 1. Get your FREE OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Click **"Sign Up"** (top right)
3. Create a free account
4. Verify your email
5. Go to [API Keys page](https://home.openweathermap.org/api_keys)
6. Copy your **API key** (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 2. Add API Key to your project

Open your `.env` file and add:

```bash
OPENWEATHER_API_KEY=your_api_key_here
```

**Example:**
```bash
OPENWEATHER_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 3. Restart your server

```bash
npm run dev
```

## How It Works

1. **Farm Location**: The weather API reads your farm's GPS coordinates (latitude/longitude) from the database
2. **Real-time Weather**: Fetches current weather from OpenWeatherMap for that exact location
3. **Location Display**: Shows your city and state with the weather data
4. **Auto Refresh**: Weather updates every 30 seconds on the dashboard

## Testing

### Without API Key (Mock Data)
- System will use realistic mock weather data
- You'll see a warning in server logs: `⚠️ No OpenWeatherMap API key found`

### With API Key (Real Data)
- System fetches real weather for your farm location
- Server logs show: `✅ Weather data fetched: 24.5°C, Partly Cloudy`
- Location shows in weather card: "Nashik, Maharashtra"

## API Endpoints

### Current Weather
```
GET /api/weather/current?farmId=<farm-uuid>
```

### 3-Day Forecast
```
GET /api/weather/forecast?farmId=<farm-uuid>
```

### Historical Data (Mock)
```
GET /api/weather/historical?days=30&farmId=<farm-uuid>
```

## Troubleshooting

### "Weather API unavailable"
- Check if OPENWEATHER_API_KEY is in `.env`
- Verify API key is valid (test at https://openweathermap.org/api)
- Free tier keys may take 1-2 hours to activate after signup

### "Using mock data"
- This is normal without an API key
- Add your API key to `.env` and restart server

### Wrong location
- Check if your farm has latitude/longitude in the database
- Default location: Nashik, Maharashtra (20.0, 73.8)
- Update farm GPS coordinates in the "My Farm" page

## Free Tier Limits

OpenWeatherMap free tier includes:
- ✅ 60 calls/minute
- ✅ 1,000,000 calls/month
- ✅ Current weather + 5-day forecast
- ❌ Historical weather (requires paid plan)

This is **more than enough** for a smart farming app with multiple users!

## Dashboard Integration

The weather data appears in:
1. **Home Dashboard** - WeatherCard component (auto-refreshes every 30s)
2. **Recommendations** - AI uses weather data for crop suggestions
3. **Action Log** - Weather-based irrigation decisions

---

**Need help?** Check the server console logs for detailed weather API debug messages.
