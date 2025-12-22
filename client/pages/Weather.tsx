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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

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
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather>({
    temperature: 32,
    feelsLike: 35,
    condition: "Partly Cloudy",
    humidity: 65,
    windSpeed: 12,
    windDirection: "NE",
    visibility: 10,
    uvIndex: 7,
    pressure: 1013,
    sunrise: "06:15",
    sunset: "18:45",
  });

  const [forecast, setForecast] = useState<WeatherDay[]>([
    { day: "Today", date: "Dec 22", high: 32, low: 24, condition: "Partly Cloudy", icon: CloudSun, precipitation: 20 },
    { day: "Mon", date: "Dec 23", high: 30, low: 22, condition: "Sunny", icon: Sun, precipitation: 0 },
    { day: "Tue", date: "Dec 24", high: 28, low: 21, condition: "Cloudy", icon: Cloud, precipitation: 30 },
    { day: "Wed", date: "Dec 25", high: 26, low: 20, condition: "Rain", icon: CloudRain, precipitation: 80 },
    { day: "Thu", date: "Dec 26", high: 27, low: 19, condition: "Rain", icon: CloudRain, precipitation: 60 },
    { day: "Fri", date: "Dec 27", high: 29, low: 21, condition: "Partly Cloudy", icon: CloudSun, precipitation: 15 },
    { day: "Sat", date: "Dec 28", high: 31, low: 23, condition: "Sunny", icon: Sun, precipitation: 0 },
  ]);

  const [hourlyForecast] = useState([
    { time: "Now", temp: 32, icon: CloudSun },
    { time: "1PM", temp: 33, icon: Sun },
    { time: "2PM", temp: 34, icon: Sun },
    { time: "3PM", temp: 33, icon: CloudSun },
    { time: "4PM", temp: 31, icon: CloudSun },
    { time: "5PM", temp: 29, icon: Cloud },
    { time: "6PM", temp: 27, icon: Cloud },
    { time: "7PM", temp: 26, icon: CloudSun },
  ]);

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
      <div>
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
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
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

      {/* Hourly Forecast */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Hourly Forecast</h2>
        <Card className="p-4">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {hourlyForecast.map((hour, index) => (
              <div
                key={index}
                className="flex flex-col items-center min-w-[70px] p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <p className="text-sm text-muted-foreground">{hour.time}</p>
                <hour.icon className="w-8 h-8 my-2 text-primary" />
                <p className="font-semibold">{hour.temp}°</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 7-Day Forecast */}
      <div>
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
      <Card className="p-6 border-l-4 border-l-primary">
        <h3 className="font-semibold text-foreground mb-2">🌾 Farming Insights</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Rain expected on Dec 25-26:</strong> Consider delaying fertilizer application</li>
          <li>• <strong>High UV index today:</strong> Ideal for drying harvested crops</li>
          <li>• <strong>Low wind conditions:</strong> Good day for spraying pesticides</li>
          <li>• <strong>Soil moisture:</strong> Expected to increase after Wednesday's rain</li>
        </ul>
      </Card>
    </div>
  );
};
