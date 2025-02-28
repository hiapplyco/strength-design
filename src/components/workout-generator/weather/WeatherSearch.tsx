
import { useState, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WeatherDisplay } from "./WeatherDisplay";
import { LocationResultsDialog } from "./LocationResultsDialog";
import type { WeatherData } from "@/types/weather";
import type { LocationResult, WeatherSearchProps } from "./types";

export function WeatherSearch({ 
  onWeatherUpdate, 
  renderTooltip,
  isSearching: externalIsSearching,
  setIsSearching: externalSetIsSearching 
}: WeatherSearchProps) {
  const [location, setLocation] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Use external state if provided
  const searching = externalIsSearching !== undefined ? externalIsSearching : isSearching;
  const setSearching = externalSetIsSearching || setIsSearching;

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location to search for.",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);

    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=5&language=en&format=json`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setResults(data.results);
        setDialogOpen(true);
      } else {
        toast({
          title: "No Results Found",
          description: "We couldn't find any locations matching your search.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Weather search error:", error);
      toast({
        title: "Search Failed",
        description: "An error occurred while searching for weather data.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  }, [location, setSearching]);

  const handleSelectLocation = useCallback(async (location: LocationResult) => {
    setDialogOpen(false);
    setSearching(true);

    try {
      // Call weather API with latitude and longitude
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,is_day,weathercode,wind_speed_10m,wind_direction_10m,wind_gusts_10m,relative_humidity_2m,precipitation`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const weatherData: WeatherData = {
        location: `${location.name}, ${location.country}`,
        temperature: data.current.temperature_2m,
        apparentTemperature: data.current.apparent_temperature,
        weatherCode: data.current.weathercode,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m,
        windGusts: data.current.wind_gusts_10m,
        humidity: data.current.relative_humidity_2m,
        precipitation: data.current.precipitation,
        isDay: data.current.is_day === 1,
        forecast: null // We're not fetching forecast data in this simplified version
      };
      
      setWeather(weatherData);
      
      // Generate a descriptive prompt about the weather
      const prompt = `The current weather in ${weatherData.location} is ${weatherData.temperature}°C, feels like ${weatherData.apparentTemperature}°C, with ${weatherData.humidity}% humidity and wind speeds of ${weatherData.windSpeed} km/h.`;
      
      // Pass the data back to the parent
      onWeatherUpdate(weatherData, prompt);
      
      setLocation("");
    } catch (error) {
      console.error("Weather data fetch error:", error);
      toast({
        title: "Weather Data Error",
        description: "We couldn't retrieve weather data for this location.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  }, [onWeatherUpdate, setSearching]);

  const handleClearWeather = useCallback(() => {
    setWeather(null);
    onWeatherUpdate(null, "");
  }, [onWeatherUpdate]);

  return (
    <Card className="bg-black/20 border-primary/20 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="flex flex-row items-center pb-2">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg">Add Weather Conditions</h3>
          {renderTooltip && renderTooltip()}
        </div>
      </CardHeader>
      <CardContent>
        {weather ? (
          <WeatherDisplay 
            weather={weather} 
            onClear={handleClearWeather} 
          />
        ) : (
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter location (city, country)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-black/30 border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <Button 
                type="submit" 
                disabled={searching}
                className="bg-primary text-primary-foreground min-w-24 hover:bg-primary/90"
              >
                {searching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="hidden sm:inline">Searching...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Search</span>
                    <Search className="h-4 w-4 sm:hidden" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
        
        <LocationResultsDialog
          open={dialogOpen}
          setOpen={setDialogOpen}
          results={results}
          onSelect={handleSelectLocation}
        />
      </CardContent>
    </Card>
  );
}
