import { Request, Response } from 'express';
import { db } from '../db/supabase';

// OpenWeatherMap API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Mock weather data as fallback
const mockWeatherData = {
  temperature: 24.5,
  humidity: 68,
  pressure: 1013,
  windSpeed: 12,
  rainProbability: 15,
  condition: "Partly Cloudy",
  uvIndex: 6,
  feelsLike: 23.8,
  timestamp: new Date(),
};

const mockForecast = [
  {
    date: new Date(Date.now() + 86400000),
    high: 28,
    low: 18,
    rainChance: 10,
    condition: "Sunny",
  },
  {
    date: new Date(Date.now() + 172800000),
    high: 26,
    low: 17,
    rainChance: 35,
    condition: "Cloudy",
  },
  {
    date: new Date(Date.now() + 259200000),
    high: 22,
    low: 15,
    rainChance: 65,
    condition: "Rainy",
  },
];

// Get current farm's location
async function getFarmLocation(farmId?: string) {
  if (!farmId) {
    // If no farmId, use default location (Nashik, Maharashtra, India)
    return { latitude: 20.0, longitude: 73.8, city: 'Nashik', state: 'Maharashtra' };
  }

  try {
    const farm = await db.getFarmById(farmId);
    if (farm && farm.latitude && farm.longitude) {
      return {
        latitude: farm.latitude,
        longitude: farm.longitude,
        city: farm.city || 'Unknown',
        state: farm.state || 'Unknown',
      };
    }
  } catch (error) {
    console.warn('[Weather] Could not fetch farm location:', error);
  }

  // Default location if farm not found or no GPS coordinates
  return { latitude: 20.0, longitude: 73.8, city: 'Nashik', state: 'Maharashtra' };
}

// Map OpenWeatherMap condition codes to readable conditions
function mapWeatherCondition(code: number, description: string): string {
  if (code >= 200 && code < 300) return 'Thunderstorm';
  if (code >= 300 && code < 400) return 'Drizzle';
  if (code >= 500 && code < 600) return 'Rainy';
  if (code >= 600 && code < 700) return 'Snow';
  if (code >= 700 && code < 800) return 'Mist';
  if (code === 800) return 'Clear';
  if (code === 801) return 'Partly Cloudy';
  if (code >= 802) return 'Cloudy';
  return description;
}

// GET /api/weather/current - Get current weather for user's farm location
export const getCurrentWeather = async (req: Request, res: Response) => {
  try {
    const { farmId, lat, lon } = req.query;
    
    let location;
    
    // Priority 1: Use GPS coordinates from query if provided
    if (lat && lon) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        location = { latitude, longitude, city: 'Your Location', state: '' };
        console.log(`[Weather] Using GPS coordinates from request: (${latitude}, ${longitude})`);
      }
    }
    
    // Priority 2: Fall back to farm location
    if (!location) {
      location = await getFarmLocation(farmId as string | undefined);
      console.log(`[Weather] Using farm location: ${location.city}, ${location.state} (${location.latitude}, ${location.longitude})`);
    }

    // If no API key, return mock data
    if (!OPENWEATHER_API_KEY) {
      console.warn('[Weather] ⚠️  No OpenWeatherMap API key found. Using mock data.');
      console.warn('[Weather] Set OPENWEATHER_API_KEY in .env to enable real weather data.');
      return res.json({
        ...mockWeatherData,
        location: `${location.city}, ${location.state}`,
        source: 'mock',
      });
    }

    // Fetch real weather data from OpenWeatherMap
    const url = `${OPENWEATHER_BASE_URL}/weather?lat=${location.latitude}&lon=${location.longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform OpenWeatherMap data to our format
    const weatherData = {
      temperature: Math.round(data.main.temp * 10) / 10,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round(data.wind.speed * 3.6 * 10) / 10, // Convert m/s to km/h
      rainProbability: data.clouds?.all || 0, // Use cloud cover as proxy for rain probability
      condition: mapWeatherCondition(data.weather[0].id, data.weather[0].main),
      uvIndex: 0, // UV index requires separate API call in free tier
      feelsLike: Math.round(data.main.feels_like * 10) / 10,
      timestamp: new Date(data.dt * 1000),
      location: location.state ? `${data.name || location.city}, ${location.state}` : data.name || location.city,
      source: 'openweathermap',
    };

    console.log(`✅ Weather data fetched: ${weatherData.temperature}°C, ${weatherData.condition} at ${weatherData.location}`);
    res.json(weatherData);

  } catch (error) {
    console.error('[Weather] Error fetching weather:', error);
    
    // Fallback to mock data on error
    const location = await getFarmLocation(req.query.farmId as string | undefined);
    res.json({
      ...mockWeatherData,
      location: `${location.city}, ${location.state}`,
      source: 'mock_fallback',
      error: error instanceof Error ? error.message : 'Weather API error',
    });
  }
};

// GET /api/weather/forecast - Get 3-day forecast
export const getForecast = async (req: Request, res: Response) => {
  try {
    const { farmId, lat, lon } = req.query;
    
    let location;
    
    // Priority 1: Use GPS coordinates from query if provided
    if (lat && lon) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        location = { latitude, longitude, city: 'Your Location', state: '' };
      }
    }
    
    // Priority 2: Fall back to farm location
    if (!location) {
      location = await getFarmLocation(farmId as string | undefined);
    }

    // If no API key, return mock data
    if (!OPENWEATHER_API_KEY) {
      console.warn('[Weather] No OpenWeatherMap API key. Using mock forecast.');
      return res.json({
        forecast: mockForecast,
        location: location.state ? `${location.city}, ${location.state}` : location.city,
        source: 'mock',
      });
    }

    // Fetch forecast from OpenWeatherMap (5 day / 3 hour forecast)
    const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${location.latitude}&lon=${location.longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();

    // Process forecast data - group by day and get high/low
    const dailyData: { [key: string]: any } = {};
    
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date,
          temps: [],
          conditions: [],
          rainChances: [],
        };
      }
      
      dailyData[dateKey].temps.push(item.main.temp);
      dailyData[dateKey].conditions.push(mapWeatherCondition(item.weather[0].id, item.weather[0].main));
      dailyData[dateKey].rainChances.push(item.pop * 100); // Probability of precipitation
    });

    // Convert to forecast array
    const forecast = Object.values(dailyData).slice(0, 3).map((day: any) => ({
      date: day.date,
      high: Math.round(Math.max(...day.temps)),
      low: Math.round(Math.min(...day.temps)),
      rainChance: Math.round(Math.max(...day.rainChances)),
      condition: day.conditions[Math.floor(day.conditions.length / 2)], // Middle of day
    }));

    res.json({
      forecast,
      location: `${location.city}, ${location.state}`,
      source: 'openweathermap',
    });

  } catch (error) {
    console.error('[Weather] Error fetching forecast:', error);
    
    // Fallback to mock data
    const location = await getFarmLocation(req.query.farmId as string | undefined);
    res.json({
      forecast: mockForecast,
      location: `${location.city}, ${location.state}`,
      source: 'mock_fallback',
      error: error instanceof Error ? error.message : 'Weather API error',
    });
  }
};

// GET /api/weather/historical - Get historical weather data
export const getHistoricalWeather = async (req: Request, res: Response) => {
  try {
    const { days = 30, farmId } = req.query;
    const daysNum = parseInt(days as string, 10);
    const location = await getFarmLocation(farmId as string | undefined);

    // Historical weather requires paid OpenWeatherMap tier, so return mock data
    console.warn('[Weather] Historical weather requires OpenWeatherMap paid tier. Using mock data.');
    
    const historicalData = [];
    for (let i = 0; i < daysNum; i++) {
      historicalData.push({
        temperature: 20 + Math.random() * 10,
        humidity: 50 + Math.random() * 30,
        pressure: 1010 + Math.random() * 10,
        windSpeed: 5 + Math.random() * 15,
        rainProbability: Math.random() * 100,
        condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
        uvIndex: Math.floor(Math.random() * 11),
        feelsLike: 20 + Math.random() * 10,
        timestamp: new Date(Date.now() - i * 86400000),
      });
    }

    res.json({
      data: historicalData,
      location: `${location.city}, ${location.state}`,
      source: 'mock',
      note: 'Historical weather requires OpenWeatherMap paid tier',
    });

  } catch (error) {
    console.error('[Weather] Error fetching historical weather:', error);
    res.status(500).json({
      error: 'Failed to fetch historical weather',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
