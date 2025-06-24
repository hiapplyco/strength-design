
import React, { useEffect, useState } from "react";
import { LiveWeatherSearch } from "./weather/LiveWeatherSearch";
import { WeatherDisplay } from "./weather/WeatherDisplay";
import { CloudSun } from "lucide-react";
import type { WeatherData } from "@/types/weather";
import { ExpandableSectionContainer } from "./ExpandableSectionContainer";

interface WeatherSectionProps {
  weatherData: WeatherData | null;
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  renderTooltip?: () => React.ReactNode;
  numberOfDays?: number;
}

export function WeatherSection({ 
  weatherData, 
  onWeatherUpdate,
  renderTooltip,
  numberOfDays = 7
}: WeatherSectionProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClearWeather = () => {
    onWeatherUpdate(null, "");
    setIsExpanded(false);
  };

  const handleSearchStateChange = (searching: boolean) => {
    setIsSearching(searching);
    if (searching) {
      setIsExpanded(true);
    }
  };

  // Auto-expand when weather data is loaded
  useEffect(() => {
    if (weatherData) {
      setIsExpanded(true);
    }
  }, [weatherData]);

  const renderCustomContent = () => (
    <>
      {weatherData ? (
        <WeatherDisplay 
          weatherData={weatherData} 
          onClear={handleClearWeather}
          numberOfDays={numberOfDays}
        />
      ) : (
        <LiveWeatherSearch 
          onWeatherUpdate={onWeatherUpdate}
          numberOfDays={numberOfDays}
          onSearchStateChange={handleSearchStateChange}
        />
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div 
        className="flex items-center gap-3 cursor-pointer p-3 rounded-md bg-card hover:bg-card/80 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CloudSun className="h-5 w-5 text-primary" />
        <h3 className="font-medium text-lg">Add Weather Conditions</h3>
        <div className="ml-auto">
          {isExpanded ? (
            <div className="h-5 w-5 text-muted-foreground">▲</div>
          ) : (
            <div className="h-5 w-5 text-muted-foreground">▼</div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="overflow-hidden rounded-md p-4 pl-6 bg-card/50">
          <div className="relative z-10 pt-2">
            {renderCustomContent()}
          </div>
        </div>
      )}
    </div>
  );
}
