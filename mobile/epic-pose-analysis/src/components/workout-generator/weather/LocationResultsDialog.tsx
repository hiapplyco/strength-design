
import React from "react";
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MapPin } from "lucide-react";
import type { LocationResult } from "./types";

interface LocationResultsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  results: LocationResult[];
  onSelect: (location: LocationResult) => void;
  isLoading: boolean;
}

export function LocationResultsDialog({
  isOpen,
  onClose,
  results,
  onSelect,
  isLoading
}: LocationResultsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
          <DialogDescription>
            Choose a location to get weather data for your workout
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : results.length > 0 ? (
          <ScrollArea className="max-h-[300px] mt-2">
            <div className="space-y-2 p-1">
              {results.map((location, index) => (
                <Button
                  key={`${location.name}-${location.country}-${index}`}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => onSelect(location)}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {location.admin1 && `${location.admin1}, `}{location.country}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            No locations found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
