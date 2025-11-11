import { useState } from "react";
import type { WeatherData } from "@/types/weather";

export const useWeatherState = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherPrompt, setWeatherPrompt] = useState<string>("");

  const handleWeatherUpdate = (weatherData: WeatherData | null, weatherPrompt: string) => {
    setWeatherData(weatherData);
    setWeatherPrompt(weatherPrompt);
  };

  return {
    weatherData,
    weatherPrompt,
    handleWeatherUpdate
  };
};