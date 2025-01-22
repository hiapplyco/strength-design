import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LocationResult } from "./types";

interface LocationResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationResults: LocationResult[];
  onLocationSelect: (location: LocationResult) => void;
  formatLocation: (location: LocationResult) => string;
}

export function LocationResultsDialog({
  open,
  onOpenChange,
  locationResults,
  onLocationSelect,
  formatLocation,
}: LocationResultsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {locationResults.map((result, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start rounded-full"
              onClick={() => onLocationSelect(result)}
            >
              {formatLocation(result)}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}