
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2 } from 'lucide-react';
import type { LocationResult } from './types';

interface EnhancedWeatherSearchResultsProps {
  locations: LocationResult[];
  isLoading: boolean;
  searchQuery: string;
  onLocationSelect: (location: LocationResult) => void;
}

export const EnhancedWeatherSearchResults: React.FC<EnhancedWeatherSearchResultsProps> = ({
  locations,
  isLoading,
  searchQuery,
  onLocationSelect
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Searching locations...</span>
        </div>
      </div>
    );
  }

  if (!searchQuery || searchQuery.length < 2) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Type at least 2 characters to search locations</p>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No locations found for "{searchQuery}"</p>
        <p className="text-xs mt-1">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">Locations</span>
        <Badge variant="secondary" className="text-xs">
          {locations.length} found
        </Badge>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        {locations.map((location, index) => (
          <Button
            key={`${location.latitude}-${location.longitude}-${index}`}
            variant="ghost"
            className="w-full justify-start h-auto p-3 hover:bg-muted/50"
            onClick={() => onLocationSelect(location)}
          >
            <div className="flex items-start gap-3 w-full">
              <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {location.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {location.country}
                  {location.admin1 && `, ${location.admin1}`}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
