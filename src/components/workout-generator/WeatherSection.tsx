
import React from "react";
import { WeatherSearch } from "./weather/WeatherSearch";
import { WeatherDisplay } from "./weather/WeatherDisplay";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CloudSun } from "lucide-react";
import type { WeatherData } from "@/types/weather";

interface WeatherSectionProps {
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  renderTooltip?: () => React.ReactNode;
}

export function WeatherSection({ 
  weatherData, 
  onWeatherUpdate,
  renderTooltip
}: WeatherSectionProps) {
  const handleClearWeather = () => {
    onWeatherUpdate(null, "");
  };

  return (
    <div className="space-y-4">
      {weatherData ? (
        <Card className="bg-black/20 border-primary/20 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center pb-2">
            <div className="flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-primary" />
              <h3 className="font-oswald text-lg">Weather Conditions</h3>
              {renderTooltip && renderTooltip()}
            </div>
          </CardHeader>
          <CardContent>
            <WeatherDisplay 
              weatherData={weatherData} 
              onClear={handleClearWeather}
            />
          </CardContent>
        </Card>
      ) : (
        <WeatherSearch 
          onWeatherUpdate={onWeatherUpdate}
          renderTooltip={renderTooltip}
        />
      )}
    </div>
  );
}
