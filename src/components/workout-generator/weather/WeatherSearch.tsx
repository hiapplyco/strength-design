
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CloudSun, Loader2 } from "lucide-react";
import { fetchWeatherData, searchLocations } from "./weather-utils";
import { TooltipWrapper } from "../TooltipWrapper";
import { LocationResultsDialog } from "./LocationResultsDialog";
import { SearchForm } from "./SearchForm";
import type { LocationResult } from "./types";

interface WeatherSearchProps {
  onWeatherUpdate: (weatherData: any | null) => void;
  renderTooltip?: () => React.ReactNode;
  numberOfDays?: number;
}

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
      
      onWeatherUpdate(weatherData);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setSearchError("Error fetching weather data. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <Card className="bg-black/20 border-primary/20 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <CloudSun className="h-5 w-5 text-primary" />
          <h3 className="font-oswald text-lg">Add Weather Conditions</h3>
          {renderTooltip ? (
            renderTooltip()
          ) : (
            <TooltipWrapper 
              content="Add local weather conditions to optimize your workout for the current environment"
            />
          )}
          {isSearching && (
            <Loader2 className="h-4 w-4 text-primary animate-spin ml-auto" />
          )}
        </CardHeader>
        <CardContent>
          <SearchForm
            searchQuery={searchQuery}
            isSearching={isSearching}
            searchError={searchError}
            onSearch={handleSearch}
          />
        </CardContent>
      </Card>
      
      <LocationResultsDialog
        isOpen={isLocationsDialogOpen}
        setIsOpen={setIsLocationsDialogOpen}
        locations={locations}
        onSelectLocation={handleSelectLocation}
      />
    </>
  );
}
