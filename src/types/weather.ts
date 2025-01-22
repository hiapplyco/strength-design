export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  location: string;
  apparentTemperature: number;
  precipitation: number;
  weatherCode: number;
  windDirection: number;
  windGusts: number;
  forecast: {
    dates: string[];
    weatherCodes: number[];
    maxTemps: number[];
    minTemps: number[];
    precipitationProb: number[];
    maxWindSpeed: number[];
  } | null;
}