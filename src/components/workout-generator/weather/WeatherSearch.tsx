
import React, { useState } from "react";
import { Search, CloudSun } from "lucide-react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationResultsDialog } from "./LocationResultsDialog";
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search-locations?query=${encodeURIComponent(locationQuery)}`);
      
      if (!response.ok) {
        throw new Error("Failed to search locations");
      }
      
      const data = await response.json();
      setSearchResults(data.results || []);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching locations:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = async (location: LocationResult) => {
    try {
      const response = await fetch(`/api/weather?lat=${location.latitude}&lon=${location.longitude}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }
      
      const data = await response.json();
      const weatherPrompt = `Consider the weather in ${location.name}: ${data.current.weatherDescription}, temperature of ${data.current.tempC}°C (${data.current.tempF}°F), and ${data.current.humidity}% humidity.`;
      
      onWeatherUpdate(data, weatherPrompt);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
    
    setShowResults(false);
  };

  return (
    <Card className="bg-black/20 border-primary/20 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="flex flex-row items-center pb-2">
        <div className="flex items-center gap-2">
          <CloudSun className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg">Add Weather Conditions</h3>
          {renderTooltip && renderTooltip()}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter location (city, country)"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full"
              borderStyle="gold"
            />
          </div>
          <Button 
            type="submit" 
            variant="default" 
            className="bg-primary hover:bg-primary/90 text-black font-medium"
            disabled={isSearching}
          >
            {isSearching ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-r-transparent"></div>
                <span>Searching...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>Search</span>
              </div>
            )}
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
