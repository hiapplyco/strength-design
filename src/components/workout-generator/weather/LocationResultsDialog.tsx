
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      <DialogContent className="max-w-md mx-auto gradient-border bg-black/70">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Select Location</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid gap-3 py-4">
            {results.map((result, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start rounded-sm text-left px-4 py-3 hover:bg-primary/10 transition-colors"
                onClick={() => onSelect(result)}
              >
                <span className="truncate">
                  {result.name}, {result.country} {result.admin1 ? `(${result.admin1})` : ''}
                </span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
