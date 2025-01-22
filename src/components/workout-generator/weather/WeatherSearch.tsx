import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getWeatherDescription } from "./weather-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WeatherSearchProps {
  onWeatherUpdate: (weatherData: any | null, weatherPrompt: string) => void;
  renderTooltip: () => React.ReactNode;
}

interface LocationResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

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
      
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Enter city name..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-white text-black placeholder:text-gray-500 rounded-full border-2 border-primary focus-visible:ring-primary pr-10"
          />
          {location && (
            <button
              type="button"
              onClick={() => setLocation("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-primary/20 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-primary" />
            </button>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="rounded-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            "Search"
          )}
        </Button>
      </form>

      {isWeatherLoading && (
        <div className="flex items-center justify-center p-8 bg-primary/10 rounded-xl animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-primary font-medium">Loading weather data...</span>
        </div>
      )}

      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Location</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {locationResults.map((result, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start rounded-full"
                onClick={() => handleLocationSelect(result)}
              >
                {formatLocation(result)}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}