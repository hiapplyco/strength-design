import { useState } from "react";
import { MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getWeatherDescription } from "./weather-utils";
import { SearchForm } from "./SearchForm";
import { LocationResultsDialog } from "./LocationResultsDialog";
import type { WeatherSearchProps, LocationResult } from "./types";

export function WeatherSearch({ onWeatherUpdate, renderTooltip }: WeatherSearchProps) {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const { toast } = useToast();

  const formatLocation = (result: LocationResult) => {
    const parts = [result.name];
    if (result.admin1) {
      parts.push(result.admin1);
    }
    parts.push(result.country);
    return parts.join(", ");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim()) {
      toast({
        title: "Error",
        description: "Please enter a location",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const geocodingResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=5&language=en&format=json`
      );
      
      if (!geocodingResponse.ok) {
        throw new Error("Failed to find location");
      }

      const geocodingData = await geocodingResponse.json();
      
      if (!geocodingData.results?.length) {
        throw new Error("No locations found");
      }

      setLocationResults(geocodingData.results);
      setShowLocationDialog(true);
    } catch (err) {
      console.error("Error searching locations:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to search locations";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = async (selectedLocation: LocationResult) => {
    setIsLoading(true);
    setIsWeatherLoading(true);
    setShowLocationDialog(false);
    
    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${selectedLocation.latitude}&longitude=${selectedLocation.longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
        `&timezone=auto`
      );

      if (!weatherResponse.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const weatherData = await weatherResponse.json();
      
      if (!weatherData.current) {
        throw new Error("Weather data not available");
      }

      const transformedData = {
        location: formatLocation(selectedLocation),
        temperature: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        apparentTemperature: weatherData.current.apparent_temperature,
        precipitation: weatherData.current.precipitation,
        weatherCode: weatherData.current.weather_code,
        windDirection: weatherData.current.wind_direction_10m,
        windGusts: weatherData.current.wind_gusts_10m,
        forecast: weatherData.daily ? {
          dates: weatherData.daily.time,
          weatherCodes: weatherData.daily.weather_code,
          maxTemps: weatherData.daily.temperature_2m_max,
          minTemps: weatherData.daily.temperature_2m_min,
          precipitationProb: weatherData.daily.precipitation_probability_max,
          maxWindSpeed: weatherData.daily.wind_speed_10m_max
        } : null
      };

      const weatherDescription = getWeatherDescription(weatherData.current.weather_code);
      onWeatherUpdate(
        transformedData, 
        `The weather in ${formatLocation(selectedLocation)} is ${weatherDescription} with a temperature of ${weatherData.current.temperature_2m}°C.`
      );
      
      toast({
        title: "Success",
        description: `Weather data loaded for ${formatLocation(selectedLocation)}`,
      });

    } catch (err) {
      console.error("Error fetching weather:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch weather data";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      onWeatherUpdate(null, "");
    } finally {
      setIsLoading(false);
      setIsWeatherLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Add Your Location</h3>
        {renderTooltip()}
      </div>
      
      <SearchForm
        location={location}
        setLocation={setLocation}
        onSubmit={handleSearch}
        isLoading={isLoading}
      />

      <LocationResultsDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        locationResults={locationResults}
        onLocationSelect={handleLocationSelect}
        formatLocation={formatLocation}
      />
    </div>
  );
}