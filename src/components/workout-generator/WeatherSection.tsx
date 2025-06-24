
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
  const [shouldExpand, setShouldExpand] = useState(false);

  const handleClearWeather = () => {
    onWeatherUpdate(null, "");
    setShouldExpand(false);
  };

  const handleSearchStateChange = (searching: boolean) => {
    setIsSearching(searching);
    if (searching) {
      setShouldExpand(true);
    }
  };

  // Auto-expand when weather data is loaded
  useEffect(() => {
    if (weatherData) {
      setShouldExpand(true);
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
    <ExpandableSectionContainer
      icon={<CloudSun className="h-5 w-5 text-primary" />}
      title="Add Weather Conditions"
      tooltipContent="Add local weather conditions to optimize your workout for the current environment"
      textAreaPlaceholder=""
      fileUploadTitle=""
      fileAnalysisSteps={[]}
      content={weatherData ? "Weather data loaded" : ""}
      setContent={() => {}} // No-op since we handle weather differently
      isAnalyzing={false}
      handleFileSelect={async () => {}} // No-op for weather
      initialExpanded={shouldExpand}
      renderCustomContent={renderCustomContent}
    />
  );
}
