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
    const response = await fetch(`${CONFIG.API_BASE_URL}/weather/current`);
    if (!response.ok) throw new Error("Failed to fetch weather data");
    return response.json();
  }

  async getForecast(): Promise<ForecastData[]> {
    if (CONFIG.USE_MOCK_DATA) {
      await this.simulateDelay();
      return mockForecast;
    }
    const response = await fetch(`${CONFIG.API_BASE_URL}/weather/forecast`);
    if (!response.ok) throw new Error("Failed to fetch forecast");
    return response.json();
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
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/weather/historical?days=${days}`,
    );
    if (!response.ok) throw new Error("Failed to fetch historical weather");
    return response.json();
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, CONFIG.SIMULATION_DELAY),
    );
  }
}

export const WeatherService = new WeatherServiceClass();
