
import React, { useState } from "react";
import { Search, CloudSun, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationResultsDialog } from "./LocationResultsDialog";
import { useToast } from "@/components/ui/use-toast";
import { getWeatherDescription, searchLocations, fetchWeatherData } from "./weather-utils";
import type { LocationResult } from "./types";
import type { WeatherData } from "@/types/weather";

interface WeatherSearchProps {
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  renderTooltip?: () => React.ReactNode;
}

export function WeatherSearch({ onWeatherUpdate, renderTooltip }: WeatherSearchProps) {
  const [locationQuery, setLocationQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchLocations(locationQuery);
      setSearchResults(results || []);
      setShowResults(true);
      
      if (results.length === 0) {
        toast({
          title: "No locations found",
          description: "Try a different search term",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error searching locations:", error);
      toast({
        title: "Search failed",
        description: "Failed to search locations. Please try again.",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = async (location: LocationResult) => {
    try {
      const apiData = await fetchWeatherData(location.latitude, location.longitude, location.name);
      
      // Transform the data to match the WeatherData interface
      const weatherData: WeatherData = {
        temperature: apiData.current.temperature,
        humidity: apiData.current.humidity,
        windSpeed: apiData.current.windSpeed,
        location: apiData.current.location,
        apparentTemperature: apiData.current.apparentTemperature,
        precipitation: apiData.current.precipitation,
        weatherCode: apiData.current.weatherCode,
        windDirection: apiData.current.windDirection,
        windGusts: apiData.current.windGusts,
        isDay: apiData.current.isDay,
        forecast: apiData.forecast
      };
      
      const weatherPrompt = `Consider the weather in ${location.name}: ${apiData.current.weatherDescription}, temperature of ${apiData.current.tempC}°C (${apiData.current.tempF}°F), and ${apiData.current.humidity}% humidity.`;
      
      onWeatherUpdate(weatherData, weatherPrompt);
      toast({
        title: "Weather updated",
        description: `Weather data loaded for ${location.name}`,
      });
    } catch (error) {
      console.error("Error fetching weather data:", error);
      toast({
        title: "Weather fetch failed",
        description: "Failed to fetch weather data. Please try again.",
        variant: "destructive"
      });
    }
    
    setShowResults(false);
  };

  return (
    <Card className="bg-black/20 border-transparent shadow-sm hover:shadow-md transition-all duration-300 relative">
      <div className="absolute inset-0 rounded-lg p-[1px] -z-10 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40"></div>
      <div className="absolute inset-[1px] rounded-[calc(0.5rem-1px)] bg-black/70 -z-[5]"></div>
      <CardHeader className="flex flex-row items-center pb-2 relative z-10">
        <div className="flex items-center gap-2">
          <CloudSun className="h-5 w-5 text-transparent bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text" />
          <h3 className="font-oswald text-lg text-transparent bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text">Add Weather Conditions</h3>
          {renderTooltip && renderTooltip()}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter location (city, country)"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full"
              borderStyle="multicolor"
            />
          </div>
          <Button 
            type="submit" 
            variant="default" 
            className="relative overflow-hidden text-black font-medium"
            disabled={isSearching}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-100 group-hover:opacity-90 transition-opacity"></div>
            <span className="relative z-10 flex items-center gap-2">
              {isSearching ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-r-transparent"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </>
              )}
            </span>
          </Button>
        </form>
      </CardContent>
      
      <LocationResultsDialog
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        results={searchResults}
        onSelect={handleLocationSelect}
        isLoading={isSearching}
      />
    </Card>
  );
}
