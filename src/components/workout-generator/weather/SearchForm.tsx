
import { useState, FormEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchFormProps {
  onSearch: (location: string) => void;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [location, setLocation] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      onSearch(location);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Enter city name..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-black text-white placeholder:text-gray-400 w-full"
          borderStyle="multicolor"
        />
      </div>
      <Button 
        type="submit" 
        variant="default" 
        className="bg-primary hover:bg-primary/90 text-black font-medium"
        disabled={isLoading}
      >
        {isLoading ? (
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
  );
}
