
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchWeatherData, searchLocations, getWeatherDescription } from "./weather-utils";
import { TooltipWrapper } from "../TooltipWrapper";
import { LocationResultsDialog } from "./LocationResultsDialog";
import { SearchForm } from "./SearchForm";
import type { LocationResult, WeatherSearchProps } from "./types";
import type { WeatherData } from "@/types/weather";

export function WeatherSearch({ 
  onWeatherUpdate, 
  renderTooltip,
  numberOfDays = 7
}: WeatherSearchProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState<LocationResult[]>([]);
  const [isLocationsDialogOpen, setIsLocationsDialogOpen] = useState(false);
  const [searchError, setSearchError] = useState("");

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchError("Please enter a location");
      return;
    }
    
    setSearchQuery(query);
    setSearchError("");
    setIsSearching(true);
    
    try {
      const locationResults = await searchLocations(query);
      
      if (locationResults.length === 0) {
        setSearchError(`No locations found for "${query}"`);
        setLocations([]);
      } else {
        setLocations(locationResults);
        setIsLocationsDialogOpen(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError("Error searching for locations. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = async (location: LocationResult) => {
    setIsLocationsDialogOpen(false);
    setIsSearching(true);
    
    try {
      const weatherData = await fetchWeatherData(
        location.latitude,
        location.longitude,
        location.name,
        numberOfDays
      );
      
      // Generate a simple weather prompt based on the data
      const weatherPrompt = `Consider the weather in ${location.name}: ${weatherData.temperature}°C, 
        ${weatherData.weatherCode ? getWeatherDescription(weatherData.weatherCode) : 'varied conditions'}, 
        with humidity at ${weatherData.humidity}% and wind speed of ${weatherData.windSpeed} km/h.`;
        
      onWeatherUpdate(weatherData, weatherPrompt);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setSearchError("Error fetching weather data. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCloseDialog = () => {
    setIsLocationsDialogOpen(false);
  };

  return (
    <>
      <div className="relative">
        {isSearching && (
          <div className="absolute right-2 top-2 z-10">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          </div>
        )}
        <SearchForm
          searchQuery={searchQuery}
          isSearching={isSearching}
          searchError={searchError}
          onSearch={handleSearch}
        />
      </div>
      
      <LocationResultsDialog
        isOpen={isLocationsDialogOpen}
        onClose={handleCloseDialog}
        results={locations}
        onSelect={handleSelectLocation}
        isLoading={isSearching}
      />
    </>
  );
}
