import CONFIG from "../config";

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  rainProbability: number;
  condition: string;
  uvIndex: number;
  feelsLike: number;
  timestamp: Date;
}

export interface ForecastData {
  date: Date;
  high: number;
  low: number;
  rainChance: number;
  condition: string;
}

const mockWeatherData: WeatherData = {
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

const mockForecast: ForecastData[] = [
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

class WeatherServiceClass {
  private cachedLocation: { latitude: number; longitude: number; timestamp: number } | null = null;
  private readonly LOCATION_CACHE_DURATION = 5 * 60 * 1000; // Cache for 5 minutes

  // Get user's current GPS location from browser
  private async getUserLocation(): Promise<{ latitude: number; longitude: number } | null> {
    // Check if we have a recent cached location
    if (this.cachedLocation) {
      const age = Date.now() - this.cachedLocation.timestamp;
      if (age < this.LOCATION_CACHE_DURATION) {
        console.log(`[Weather] Using cached GPS location: ${this.cachedLocation.latitude}, ${this.cachedLocation.longitude}`);
        return { latitude: this.cachedLocation.latitude, longitude: this.cachedLocation.longitude };
      }
    }

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('[Weather] Geolocation not supported by browser');
        resolve(null);
        return;
      }

      console.log('[Weather] Requesting GPS location...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(`[Weather] ✅ GPS Location detected: ${position.coords.latitude}, ${position.coords.longitude}`);
          
          // Cache the location
          this.cachedLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now(),
          };
          
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn(`[Weather] ⚠️  Could not get GPS location: ${error.message}`);
          console.warn('[Weather] Falling back to farm location. To enable GPS:');
          console.warn('[Weather]   1. Check browser location permissions');
          console.warn('[Weather]   2. Enable location services on your device');
          resolve(null);
        },
        { 
          timeout: 15000, // Increased to 15 seconds
          enableHighAccuracy: false, // Use network location (faster)
          maximumAge: 300000 // Accept cached location up to 5 minutes old
        }
      );
    });
  }

  async getCurrentWeather(): Promise<WeatherData> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      return {
        ...mockWeatherData,
        humidity: Math.max(
          40,
          Math.min(85, mockWeatherData.humidity + (Math.random() - 0.5) * 4),
        ),
        temperature: mockWeatherData.temperature + (Math.random() - 0.5) * 1.5,
        rainProbability: Math.max(
          0,
          Math.min(
            100,
            mockWeatherData.rainProbability + (Math.random() - 0.5) * 10,
          ),
        ),
        timestamp: new Date(),
      };
    }
    
    // Try to get user's current GPS location first
    const gpsLocation = await this.getUserLocation();
    
    let url: string;
    if (gpsLocation) {
      // Use real GPS coordinates from browser
      url = `${CONFIG.API_BASE_URL}/weather/current?lat=${gpsLocation.latitude}&lon=${gpsLocation.longitude}`;
      console.log(`[Weather] Using GPS coordinates: ${gpsLocation.latitude}, ${gpsLocation.longitude}`);
    } else {
      // Fall back to farm location
      const farmId = localStorage.getItem('current_farm_id');
      url = farmId 
        ? `${CONFIG.API_BASE_URL}/weather/current?farmId=${encodeURIComponent(farmId)}`
        : `${CONFIG.API_BASE_URL}/weather/current`;
      console.log('[Weather] Using farm location (GPS not available)');
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch weather data");
    return response.json();
  }

  async getForecast(): Promise<ForecastData[]> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      return mockForecast;
    }
    
    // Try to get user's current GPS location first
    const gpsLocation = await this.getUserLocation();
    
    let url: string;
    if (gpsLocation) {
      // Use real GPS coordinates from browser
      url = `${CONFIG.API_BASE_URL}/weather/forecast?lat=${gpsLocation.latitude}&lon=${gpsLocation.longitude}`;
    } else {
      // Fall back to farm location
      const farmId = localStorage.getItem('current_farm_id');
      url = farmId 
        ? `${CONFIG.API_BASE_URL}/weather/forecast?farmId=${encodeURIComponent(farmId)}`
        : `${CONFIG.API_BASE_URL}/weather/forecast`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch forecast");
    const data = await response.json();
    return data.forecast || data; // Handle both response formats
  }

  async getHistoricalData(days: number = 30): Promise<WeatherData[]> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      const data: WeatherData[] = [];
      for (let i = 0; i < days; i++) {
        data.push({
          ...mockWeatherData,
          temperature: 20 + Math.random() * 10,
          humidity: 50 + Math.random() * 30,
          timestamp: new Date(Date.now() - i * 86400000),
        });
      }
      return data;
    }
    
    // Get current farm ID from localStorage
    const farmId = localStorage.getItem('current_farm_id');
    const url = farmId 
      ? `${CONFIG.API_BASE_URL}/weather/historical?days=${days}&farmId=${encodeURIComponent(farmId)}`
      : `${CONFIG.API_BASE_URL}/weather/historical?days=${days}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch historical weather");
    const responseData = await response.json();
    return responseData.data || responseData; // Handle both response formats
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, CONFIG.SIMULATION_DELAY),
    );
  }
}

export const WeatherService = new WeatherServiceClass();
