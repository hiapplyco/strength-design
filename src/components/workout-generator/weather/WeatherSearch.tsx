import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { WeatherData } from "@/types/weather";
import { useToast } from "@/hooks/use-toast";
import debounce from 'lodash/debounce';
import { getWeatherDescription } from "./weather-utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface WeatherSearchProps {
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  renderTooltip: () => React.ReactNode;
}

interface LocationResult {
  name: string;
  country: string;
  admin1?: string;
}

export function WeatherSearch({ onWeatherUpdate, renderTooltip }: WeatherSearchProps) {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState<LocationResult[]>([]);
  const { toast } = useToast();

  const searchLocations = async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setLocations([]);
      return;
    }

    try {
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=5&language=en&format=json`;
      const response = await fetch(geocodingUrl);
      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        setLocations(data.results.map((result: any) => ({
          name: result.name,
          country: result.country,
          admin1: result.admin1
        })));
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setLocations([]);
    }
  };

  const debouncedSearch = useCallback(
    debounce(searchLocations, 300),
    []
  );

  const fetchWeather = async (selectedLocation: string) => {
    if (!selectedLocation.trim()) {
      setError("Please enter a location");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching weather data for:", selectedLocation);
      const { data, error: apiError } = await supabase.functions.invoke("get-weather", {
        body: { query: selectedLocation },
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
      setOpen(false);
    }
  };

  const handleLocationSelect = (locationString: string) => {
    setLocation(locationString);
    fetchWeather(locationString);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Add Your Location</h3>
        {renderTooltip()}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {location ? location : "Search for a location..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Search for a location..."
              value={location}
              onValueChange={(search) => {
                setLocation(search);
                debouncedSearch(search);
              }}
            />
            <CommandEmpty>No locations found.</CommandEmpty>
            <CommandGroup>
              {locations.map((loc, index) => (
                <CommandItem
                  key={index}
                  value={`${loc.name}, ${loc.admin1 ? `${loc.admin1}, ` : ''}${loc.country}`}
                  onSelect={handleLocationSelect}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {loc.name}, {loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2">Loading weather data...</span>
        </div>
      )}

      {error && (
        <div className="text-destructive text-sm">{error}</div>
      )}
    </div>
  );
}