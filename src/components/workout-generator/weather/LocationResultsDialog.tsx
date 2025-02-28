
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LocationResult } from "./types";

interface LocationResultsDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  results: LocationResult[];
  onSelect: (location: LocationResult) => void;
}

export function LocationResultsDialog({
  open,
  setOpen,
  results,
  onSelect,
}: LocationResultsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {results.map((result, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start rounded-full"
              onClick={() => onSelect(result)}
            >
              {result.name}, {result.country} {result.admin1 ? `(${result.admin1})` : ''}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
