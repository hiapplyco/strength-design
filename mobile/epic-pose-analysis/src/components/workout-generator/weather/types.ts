
import { Dispatch, SetStateAction } from "react";
import { WeatherData } from "@/types/weather";

export interface LocationResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherSearchProps {
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  renderTooltip?: () => React.ReactNode;
  isSearching?: boolean;
  setIsSearching?: Dispatch<SetStateAction<boolean>>;
  numberOfDays?: number;
}
