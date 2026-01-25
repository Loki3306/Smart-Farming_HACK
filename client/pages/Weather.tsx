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

import { useTranslation } from "react-i18next";
// ... imports

export const Weather: React.FC = () => {
  const { t, i18n } = useTranslation("weather");
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

  // Helper to get localized condition
  const getLocalizedCondition = (condition: string) => {
    // Map API condition strings to translation keys
    const lower = condition.toLowerCase();
    if (lower.includes('partly')) return t('conditions.partlyCloudy');
    if (lower.includes('cloud')) return t('conditions.cloudy');
    if (lower.includes('rain')) return t('conditions.rain');
    if (lower.includes('showers')) return t('conditions.showers');
    if (lower.includes('thunder')) return t('conditions.thunderstorm');
    if (lower.includes('snow')) return t('conditions.snow');
    if (lower.includes('fog')) return t('conditions.fog');
    if (lower.includes('mist')) return t('conditions.mist');
    if (lower.includes('clear')) return t('conditions.clear');
    if (lower.includes('sunny')) return t('conditions.sunny');
    return condition; // Fallback to original string if no match
  };

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
          sunrise: sunriseTime.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', hour12: false }),
          sunset: sunsetTime.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', hour12: false }),
        });

        // Fetch forecast
        const forecastData = await WeatherService.getForecast();
        console.log('[Weather Page] Forecast:', forecastData);

        // Extract daily forecast
        const dailyForecast = forecastData.forecast || forecastData;

        const formattedForecast: WeatherDay[] = dailyForecast.map((day: any, index: number) => {
          const date = new Date(day.date);
          const dayName = index === 0 ? t('forecast.today') : date.toLocaleDateString(i18n.language, { weekday: 'short' });
          const dateStr = date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });

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

  const CurrentIcon = getWeatherIconComponent(currentWeather.condition);

  return (
    <div className="p-6 lg:p-8 space-y-8 pb-24">
      {/* Header */}
      <div data-tour-id="weather-header">
        <h1 className="text-3xl font-bold text-foreground">{t('header.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('header.subtitle')}
        </p>
      </div>

      {/* Current Weather Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 !bg-gradient-to-br !from-blue-500 !to-blue-600 !text-white border-none shadow-lg" data-tour-id="weather-current" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Weather */}
            <div className="flex items-center gap-6">
              <CurrentIcon className="w-24 h-24" />
              <div>
                <p className="text-6xl font-bold">{currentWeather.temperature}°C</p>
                <p className="text-xl opacity-90">{getLocalizedCondition(currentWeather.condition)}</p>
                <p className="text-sm opacity-75">
                  {t('current.feelsLike')} {currentWeather.feelsLike}°C
                </p>
              </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Droplets className="w-5 h-5 opacity-75" />
                <div>
                  <p className="text-sm opacity-75">{t('current.humidity')}</p>
                  <p className="font-semibold">{currentWeather.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wind className="w-5 h-5 opacity-75" />
                <div>
                  <p className="text-sm opacity-75">{t('current.wind')}</p>
                  <p className="font-semibold">{currentWeather.windSpeed} km/h {currentWeather.windDirection}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 opacity-75" />
                <div>
                  <p className="text-sm opacity-75">{t('current.visibility')}</p>
                  <p className="font-semibold">{currentWeather.visibility} km</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 opacity-75" />
                <div>
                  <p className="text-sm opacity-75">{t('current.uvIndex')}</p>
                  <p className="font-semibold">{currentWeather.uvIndex} ({t('current.high')})</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Sunrise className="w-5 h-5 opacity-75" />
                <div>
                  <p className="text-sm opacity-75">{t('current.sunrise')}</p>
                  <p className="font-semibold">{currentWeather.sunrise}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Sunset className="w-5 h-5 opacity-75" />
                <div>
                  <p className="text-sm opacity-75">{t('current.sunset')}</p>
                  <p className="font-semibold">{currentWeather.sunset}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div data-tour-id="weather-7day">
        <h2 className="text-xl font-semibold text-foreground mb-4">{t('forecast.title')}</h2>
        <div className="space-y-2">
          {forecast.map((day, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="p-4">
                <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 sm:gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold whitespace-nowrap">{day.day}</p>
                    <p className="text-sm text-muted-foreground whitespace-nowrap">{day.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <day.icon className="w-8 h-8 text-primary shrink-0" />
                    <span className="text-sm text-muted-foreground hidden sm:block w-24 truncate">{getLocalizedCondition(day.condition)}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-sm w-8 sm:w-12 text-right">{day.precipitation}%</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 justify-end min-w-[3.5rem]">
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
          {t('insights.title')}
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {forecast.length > 0 && forecast.some(day => day.precipitation > 50) && (
            <li>• <strong>{t('insights.rainExpected', { day: forecast.find(day => day.precipitation > 50)?.day })}</strong></li>
          )}
          {currentWeather.uvIndex >= 6 && (
            <li>• <strong>{t('insights.highUV')}</strong></li>
          )}
          {currentWeather.windSpeed < 15 && (
            <li>• <strong>{t('insights.lowWind')}</strong></li>
          )}
          {currentWeather.windSpeed >= 15 && (
            <li>• <strong>{t('insights.highWind')}</strong></li>
          )}
          {forecast.length > 0 && forecast.some(day => day.precipitation > 50) && (
            <li>• <strong>{t('insights.soilMoisture')}</strong></li>
          )}
          {currentWeather.temperature > 30 && (
            <li>• <strong>{t('insights.highTemp')}</strong></li>
          )}
          {currentWeather.humidity < 40 && (
            <li>• <strong>{t('insights.lowHumidity')}</strong></li>
          )}
          {currentWeather.humidity > 80 && (
            <li>• <strong>{t('insights.highHumidity')}</strong></li>
          )}
        </ul>
      </Card>
    </div>
  );
};
