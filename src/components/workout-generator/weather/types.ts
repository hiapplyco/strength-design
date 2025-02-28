
import { Dispatch, SetStateAction } from "react";

export interface LocationResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherSearchProps {
  onWeatherUpdate: (weatherData: any | null, weatherPrompt: string) => void;
  renderTooltip?: () => React.ReactNode;
  isSearching?: boolean;
  setIsSearching?: Dispatch<SetStateAction<boolean>>;
  numberOfDays?: number;
}
