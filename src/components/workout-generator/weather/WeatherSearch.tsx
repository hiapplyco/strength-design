import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { WeatherData } from "@/types/weather";
import { useToast } from "@/hooks/use-toast";
import debounce from 'lodash/debounce';
import { getWeatherDescription } from "./weather-utils";

interface WeatherSearchProps {
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  renderTooltip: () => React.ReactNode;
}

export function WeatherSearch({ onWeatherUpdate, renderTooltip }: WeatherSearchProps) {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchWeather = async (searchLocation: string) => {
    if (!searchLocation.trim()) {
      setError("Please enter a location");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching weather data for:", searchLocation);
      const { data, error: apiError } = await supabase.functions.invoke("get-weather", {
        body: { query: searchLocation },
      });

      if (apiError) {
        console.error("Error fetching weather data:", apiError);
        throw new Error(apiError.message);
      }

      if (!data) {
        throw new Error("No weather data found for this location");
      }

      console.log("Weather data received:", data);
      const weatherDescription = getWeatherDescription(data.weatherCode);
      onWeatherUpdate(data, `The weather in ${data.location} is ${weatherDescription} with a temperature of ${data.temperature}°C.`);
      
      toast({
        title: "Weather Updated",
        description: `Successfully loaded weather data for ${data.location}`,
      });
    } catch (err) {
      console.error("Error fetching weather data:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetchWeather = useCallback(
    debounce(fetchWeather, 500),
    []
  );

  const handleLocationSearch = () => {
    fetchWeather(location);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Add Your Location</h3>
        {renderTooltip()}
      </div>
      
      <div className="flex gap-2">
        <Input
          placeholder="Enter your location"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            if (e.target.value.length >= 3) {
              debouncedFetchWeather(e.target.value);
            }
          }}
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
        />
        <Button 
          onClick={handleLocationSearch} 
          disabled={isLoading || !location.trim()}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Get Weather"
          )}
        </Button>
      </div>

      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}
    </div>
  );
}