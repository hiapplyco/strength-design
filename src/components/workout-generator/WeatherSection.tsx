
import React from "react";
import { WeatherSearch } from "./weather/WeatherSearch";
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
  const handleClearWeather = () => {
    onWeatherUpdate(null, "");
  };

  const renderCustomContent = () => (
    <>
      {weatherData ? (
        <WeatherDisplay 
          weatherData={weatherData} 
          onClear={handleClearWeather}
          numberOfDays={numberOfDays}
        />
      ) : (
        <WeatherSearch 
          onWeatherUpdate={onWeatherUpdate}
          renderTooltip={renderTooltip}
          numberOfDays={numberOfDays}
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
      initialExpanded={false}
      renderCustomContent={renderCustomContent}
    />
  );
}
