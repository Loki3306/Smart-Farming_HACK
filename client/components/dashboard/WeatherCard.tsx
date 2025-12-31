import React from "react";
import { Cloud, CloudRain, Wind, Droplets, Sun, Thermometer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useFarmContext } from "../../context/FarmContext";
import { SunIcon, CloudIcon, WaterDropIcon } from "./FarmIllustrations";

export const WeatherCard: React.FC = () => {
  const { weatherData } = useFarmContext();

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("rainy")) {
      return <CloudRain className="w-14 h-14 text-[hsl(200,70%,55%)]" />;
    }
    if (lowerCondition.includes("cloudy")) {
      return <Cloud className="w-14 h-14 text-[hsl(200,30%,60%)]" />;
    }
    return <SunIcon size={56} />;
  };

  const getWeatherGradient = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("rainy")) {
      return "from-[hsl(200,60%,50%)] to-[hsl(200,70%,40%)]";
    }
    if (lowerCondition.includes("cloudy")) {
      return "from-[hsl(200,30%,60%)] to-[hsl(200,40%,50%)]";
    }
    return "from-[hsl(200,70%,65%)] to-[hsl(200,75%,55%)]";
  };

  return (
    <Card className="overflow-hidden">
      {/* Sky-themed Header */}
      <div className={`relative px-6 pt-6 pb-8 bg-gradient-to-r ${getWeatherGradient(weatherData?.condition ?? "Sunny")}`}>
        {/* Decorative Clouds */}
        <div className="absolute top-2 right-8 opacity-30">
          <CloudIcon size={40} />
        </div>
        <div className="absolute top-6 right-20 opacity-20">
          <CloudIcon size={30} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Weather
            </h3>
            <div className="flex items-center gap-2 mt-2">
              {getWeatherIcon(weatherData?.condition ?? "Sunny")}
              <div>
                <span className="text-lg font-medium text-white/90">
                  {weatherData?.condition ?? "Loading..."}
                </span>
                <div className="text-4xl font-bold text-white mt-1">
                  {weatherData?.temperature.toFixed(1) ?? 0}°C
                </div>
              </div>
            </div>
            <div className="text-sm text-white/70 mt-2 flex items-center gap-1">
              <Thermometer className="w-4 h-4" />
              Feels like {weatherData?.feelsLike.toFixed(1) ?? 0}°C
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Weather Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[hsl(200,60%,95%)] to-[hsl(200,65%,90%)] rounded-xl p-4 border border-[hsl(200,40%,85%)] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[hsl(200,70%,55%)]/20 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-[hsl(200,70%,45%)]" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Humidity</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {Math.round(weatherData?.humidity ?? 0)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-[hsl(200,50%,95%)] to-[hsl(200,55%,90%)] rounded-xl p-4 border border-[hsl(200,30%,85%)] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[hsl(200,60%,55%)]/20 flex items-center justify-center">
                <CloudRain className="w-4 h-4 text-[hsl(200,60%,45%)]" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Rain Chance</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {Math.round(weatherData?.rainProbability ?? 0)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-[hsl(180,50%,95%)] to-[hsl(180,55%,90%)] rounded-xl p-4 border border-[hsl(180,30%,85%)] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[hsl(180,60%,50%)]/20 flex items-center justify-center">
                <Wind className="w-4 h-4 text-[hsl(180,60%,40%)]" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Wind Speed</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {weatherData?.windSpeed ?? 0} <span className="text-sm font-normal text-muted-foreground">km/h</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[hsl(42,70%,95%)] to-[hsl(42,75%,90%)] rounded-xl p-4 border border-[hsl(42,50%,85%)] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[hsl(42,85%,55%)]/20 flex items-center justify-center">
                <Sun className="w-4 h-4 text-[hsl(42,85%,45%)]" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">UV Index</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {weatherData?.uvIndex ?? 0}
            </div>
          </div>
        </div>

        {/* Rain Alert */}
        {weatherData && weatherData.rainProbability > 40 && (
          <div className="mt-4 bg-gradient-to-r from-[hsl(200,60%,95%)] to-[hsl(200,50%,92%)] border border-[hsl(200,50%,80%)] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[hsl(200,70%,55%)]/20 flex items-center justify-center flex-shrink-0">
              <CloudRain className="w-5 h-5 text-[hsl(200,70%,45%)]" />
            </div>
            <p className="text-sm text-[hsl(200,50%,30%)] font-medium">
              Rain expected soon. System will adjust irrigation schedule automatically.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
