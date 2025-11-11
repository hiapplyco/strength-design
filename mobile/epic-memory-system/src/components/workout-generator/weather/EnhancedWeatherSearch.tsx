
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import { EnhancedWeatherSearchDialog } from './EnhancedWeatherSearchDialog';
import type { WeatherData } from '@/types/weather';

interface EnhancedWeatherSearchProps {
  onWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  numberOfDays?: number;
}

export const EnhancedWeatherSearch: React.FC<EnhancedWeatherSearchProps> = ({
  onWeatherUpdate,
  numberOfDays = 7
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Location Search</span>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-between h-[48px] bg-background hover:bg-muted text-foreground border-2 border-border hover:border-primary/50 rounded-lg px-4 py-2 transition-all duration-200"
          onClick={() => setIsDialogOpen(true)}
        >
          <span className="text-muted-foreground">Search for weather location...</span>
          <Search className="h-4 w-4 text-muted-foreground" />
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Add weather conditions to optimize your workout for the current environment
        </p>
      </div>

      <EnhancedWeatherSearchDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onWeatherUpdate={onWeatherUpdate}
        numberOfDays={numberOfDays}
      />
    </>
  );
};
