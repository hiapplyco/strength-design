
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";

interface SearchSectionProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  searchResults: any[];
  setSearchResults: (results: any[]) => void;
  isSearching: boolean;
  setIsSearching: (value: boolean) => void;
  onExerciseSelect: (exerciseName: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export const SearchSection = ({
  searchTerm,
  setSearchTerm,
  searchResults,
  setSearchResults,
  isSearching,
  setIsSearching,
  onExerciseSelect,
  searchInputRef
}: SearchSectionProps) => {
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-exercises', {
        body: { query: searchTerm }
      });

      if (error) throw error;

      setSearchResults(data.results || []);
      
      if (data.results?.length === 0) {
        toast({
          title: "No results found",
          description: "Try different search terms",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching exercises:', error);
      toast({
        title: "Search failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-destructive">Exercise Search</h3>
      <SearchInput 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isSearching={isSearching}
        onSearch={handleSearch}
        searchInputRef={searchInputRef}
      />
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <SearchResults 
          searchResults={searchResults} 
          onExerciseSelect={onExerciseSelect}
        />
      )}
    </div>
  );
};
