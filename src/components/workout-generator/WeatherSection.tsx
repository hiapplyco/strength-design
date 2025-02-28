
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Cloud } from "lucide-react";
import { WeatherSearch } from "./weather/WeatherSearch";
import { WeatherDisplay } from "./weather/WeatherDisplay";
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
  const [isSearching, setIsSearching] = useState(false);

  return (
    <Card className="bg-black/20 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg">Local Weather</h3>
          {renderTooltip && renderTooltip()}
        </div>
      </CardHeader>
      <CardContent>
        {weatherData ? (
          <WeatherDisplay 
            weather={weatherData} 
            onClear={() => onWeatherUpdate(null, "")}
          />
        ) : (
          <WeatherSearch 
            onWeatherUpdate={onWeatherUpdate}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
          />
        )}
      </CardContent>
    </Card>
  );
}
