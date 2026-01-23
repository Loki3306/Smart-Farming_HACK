import React, { useState, useEffect } from "react";
import {
  CloudSun,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Compass,
  Sunrise,
  Sunset,
  CloudLightning,
  Snowflake,
  CloudFog,
  Sprout,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { WeatherService } from "../services/WeatherService";

interface WeatherDay {
  day: string;
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: React.ElementType;
  precipitation: number;
}

interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  uvIndex: number;
  pressure: number;
  sunrise: string;
  sunset: string;
}

export const Weather: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather>({
    temperature: 0,
    feelsLike: 0,
    condition: "Loading...",
    humidity: 0,
    windSpeed: 0,
    windDirection: "",
    visibility: 0,
    uvIndex: 0,
    pressure: 0,
    sunrise: "--:--",
    sunset: "--:--",
  });

  const [forecast, setForecast] = useState<WeatherDay[]>([]);

  // Fetch real weather data
  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        // Fetch current weather
        const current = await WeatherService.getCurrentWeather();
        console.log('[Weather Page] Current weather:', current);

        // Calculate sunrise/sunset from timestamp (mock for now, OpenWeather free tier doesn't include this)
        const now = new Date();
        const sunriseTime = new Date(now);
        sunriseTime.setHours(6, 15, 0);
        const sunsetTime = new Date(now);
        sunsetTime.setHours(18, 45, 0);

        setCurrentWeather({
          temperature: current.temperature,
          feelsLike: current.feelsLike,
          condition: current.condition,
          humidity: current.humidity,
          windSpeed: current.windSpeed,
          windDirection: 'N/A', // OpenWeather free tier doesn't include wind direction
          visibility: 10, // Default visibility
          uvIndex: current.uvIndex || 0,
          pressure: current.pressure,
          sunrise: sunriseTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          sunset: sunsetTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        });

        // Fetch forecast
        const forecastData = await WeatherService.getForecast();
        console.log('[Weather Page] Forecast:', forecastData);

        // Extract daily forecast
        const dailyForecast = forecastData.forecast || forecastData;

        const formattedForecast: WeatherDay[] = dailyForecast.map((day: any, index: number) => {
          const date = new Date(day.date);
          const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return {
            day: dayName,
            date: dateStr,
            high: day.high,
            low: day.low,
            condition: day.condition,
            icon: getWeatherIconComponent(day.condition),
            precipitation: day.rainChance,
          };
        });

        setForecast(formattedForecast);
      } catch (error) {
        console.error('[Weather Page] Error fetching weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    // Refresh weather every 5 minutes
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to map condition string to icon component
  const getWeatherIconComponent = (condition: string): React.ElementType => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('rain')) return CloudRain;
    if (conditionLower.includes('thunder')) return CloudLightning;
    if (conditionLower.includes('snow')) return Snowflake;
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return CloudFog;
    if (conditionLower.includes('cloud') && conditionLower.includes('part')) return CloudSun;
    if (conditionLower.includes('cloud')) return Cloud;
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return Sun;
    return CloudSun;
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny":
      case "clear":
        return Sun;
      case "partly cloudy":
        return CloudSun;
      case "cloudy":
      case "overcast":
        return Cloud;
      case "rain":
      case "showers":
        return CloudRain;
      case "thunderstorm":
        return CloudLightning;
      case "snow":
        return Snowflake;
      case "fog":
      case "mist":
        return CloudFog;
      default:
        return CloudSun;
    }
  };

  const CurrentIcon = getWeatherIcon(currentWeather.condition);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div data-tour-id="weather-header">
        <h1 className="text-3xl font-bold text-foreground">Weather Forecast</h1>
        <p className="text-muted-foreground mt-1">
          Real-time weather data for your farm location
        </p>
      </div>

      {/* Current Weather Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white" data-tour-id="weather-current">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Weather */}
            <div className="flex items-center gap-6">
              <CurrentIcon className="w-24 h-24" />
              <div>
                <p className="text-6xl font-bold">{currentWeather.temperature}°C</p>
                <p className="text-xl opacity-90">{currentWeather.condition}</p>
                <p className="text-sm opacity-75">
                  Feels like {currentWeather.feelsLike}°C
                </p>
              </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Droplets className="w-5 h-5 opacity-75" />
                <div>
                  <p className="text-sm opacity-75">Humidity</p>
                  <p className="font-semibold">{currentWeather.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wind className="w-5 h-5 opacity-75" />
                <div>
                  <p className="text-sm opacity-75">Wind</p>
                  <p className="font-semibold">{currentWeather.windSpeed} km/h {currentWeather.windDirection}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 opacity-75" />
                <div>
                  <p className="text-sm opacity-75">Visibility</p>
                  <p className="font-semibold">{currentWeather.visibility} km</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 opacity-75" />
                <div>
                  <p className="text-sm opacity-75">UV Index</p>
                  <p className="font-semibold">{currentWeather.uvIndex} (High)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Sunrise className="w-5 h-5 opacity-75" />
                <div>
                  <p className="text-sm opacity-75">Sunrise</p>
                  <p className="font-semibold">{currentWeather.sunrise}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Sunset className="w-5 h-5 opacity-75" />
                <div>
                  <p className="text-sm opacity-75">Sunset</p>
                  <p className="font-semibold">{currentWeather.sunset}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 7-Day Forecast */}
      <div data-tour-id="weather-7day">
        <h2 className="text-xl font-semibold text-foreground mb-4">7-Day Forecast</h2>
        <div className="space-y-2">
          {forecast.map((day, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 w-32">
                    <div>
                      <p className="font-semibold">{day.day}</p>
                      <p className="text-sm text-muted-foreground">{day.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <day.icon className="w-8 h-8 text-primary" />
                    <span className="text-sm text-muted-foreground w-24">{day.condition}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-sm w-12">{day.precipitation}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{day.high}°</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{day.low}°</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Farming Insights */}
      <Card className="p-6 border-l-4 border-l-primary" data-tour-id="weather-insights">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <Sprout className="w-5 h-5 text-primary" />
          Farming Insights
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {forecast.length > 0 && forecast.some(day => day.precipitation > 50) && (
            <li>• <strong>Rain expected on {forecast.find(day => day.precipitation > 50)?.day}:</strong> Consider delaying fertilizer application</li>
          )}
          {currentWeather.uvIndex >= 6 && (
            <li>• <strong>High UV index today:</strong> Ideal for drying harvested crops</li>
          )}
          {currentWeather.windSpeed < 15 && (
            <li>• <strong>Low wind conditions:</strong> Good day for spraying pesticides</li>
          )}
          {currentWeather.windSpeed >= 15 && (
            <li>• <strong>High wind conditions:</strong> Avoid spraying pesticides today</li>
          )}
          {forecast.length > 0 && forecast.some(day => day.precipitation > 50) && (
            <li>• <strong>Soil moisture:</strong> Expected to increase after upcoming rain</li>
          )}
          {currentWeather.temperature > 30 && (
            <li>• <strong>High temperature alert:</strong> Ensure adequate irrigation for crops</li>
          )}
          {currentWeather.humidity < 40 && (
            <li>• <strong>Low humidity:</strong> Monitor crops for water stress</li>
          )}
          {currentWeather.humidity > 80 && (
            <li>• <strong>High humidity:</strong> Watch for fungal diseases in crops</li>
          )}
        </ul>
      </Card>
    </div>
  );
};
