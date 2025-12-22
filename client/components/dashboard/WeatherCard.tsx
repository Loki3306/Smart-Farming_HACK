import React from "react";
import { Cloud, CloudRain, Wind, Droplets, Sun } from "lucide-react";
import { Card } from "../ui/Card";
import { useFarmContext } from "../../context/FarmContext";

export const WeatherCard: React.FC = () => {
  const { weatherData } = useFarmContext();

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("rainy")) {
      return <CloudRain className="w-12 h-12 text-blue-500" />;
    }
    if (lowerCondition.includes("cloudy")) {
      return <Cloud className="w-12 h-12 text-gray-500" />;
    }
    return <Sun className="w-12 h-12 text-amber-500" />;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Weather</h3>

        {/* Main Weather Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getWeatherIcon(weatherData?.condition ?? "Sunny")}
              <span className="text-lg font-medium text-foreground">
                {weatherData?.condition ?? "Loading..."}
              </span>
            </div>
            <div className="text-3xl font-bold text-primary">
              {weatherData?.temperature.toFixed(1) ?? 0}°C
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Feels like {weatherData?.feelsLike.toFixed(1) ?? 0}°C
            </div>
          </div>
        </div>

        {/* Weather Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 border-t border-border/30 pt-4">
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Humidity</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {Math.round(weatherData?.humidity ?? 0)}%
            </div>
          </div>

          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <CloudRain className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Rain Chance</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {Math.round(weatherData?.rainProbability ?? 0)}%
            </div>
          </div>

          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Wind className="w-4 h-4 text-cyan-500" />
              <span className="text-xs text-muted-foreground">Wind Speed</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {weatherData?.windSpeed ?? 0} km/h
            </div>
          </div>

          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Sun className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">UV Index</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {weatherData?.uvIndex ?? 0}
            </div>
          </div>
        </div>

        {/* Rain Alert */}
        {weatherData && weatherData.rainProbability > 40 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-blue-900 font-medium">
              ⚠️ Rain expected soon. System will adjust irrigation schedule.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
