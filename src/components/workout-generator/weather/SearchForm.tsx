import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

interface SearchFormProps {
  location: string;
  setLocation: (location: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export function SearchForm({
  location,
  setLocation,
  onSubmit,
  isLoading,
}: SearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Enter city name..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-white text-black placeholder:text-gray-500 rounded-full border-2 border-primary focus-visible:ring-primary pr-10"
        />
        {location && (
          <button
            type="button"
            onClick={() => setLocation("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-primary/20 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-primary" />
          </button>
        )}
      </div>
      <Button 
        type="submit" 
        disabled={isLoading}
        className="rounded-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching...
          </>
        ) : (
          "Search"
        )}
      </Button>
    </form>
  );
}