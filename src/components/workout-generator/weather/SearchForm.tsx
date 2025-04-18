
import { useState, FormEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchFormProps {
  searchQuery?: string;
  isSearching: boolean;
  searchError?: string;
  onSearch: (location: string) => void;
}

export function SearchForm({ searchQuery = "", isSearching, searchError, onSearch }: SearchFormProps) {
  const [location, setLocation] = useState(searchQuery);

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
          className="w-full"
        />
        {searchError && (
          <p className="text-destructive text-sm mt-1">{searchError}</p>
        )}
      </div>
      <Button 
        type="submit" 
        variant="default" 
        className="font-medium"
        disabled={isSearching}
      >
        {isSearching ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"></div>
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
