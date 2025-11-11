
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  isSearching: boolean;
  onSearch: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export const SearchInput = ({
  searchTerm,
  setSearchTerm,
  isSearching,
  onSearch,
  searchInputRef
}: SearchInputProps) => {
  return (
    <div className="flex gap-2">
      <Input
        ref={searchInputRef}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search for exercises..."
        className="flex-1"
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
      />
      <Button 
        onClick={onSearch} 
        disabled={isSearching}
        variant="outline"
        className="min-w-[44px]"
      >
        {isSearching ? (
          <div className="animate-spin">
            <Search className="h-4 w-4" />
          </div>
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
