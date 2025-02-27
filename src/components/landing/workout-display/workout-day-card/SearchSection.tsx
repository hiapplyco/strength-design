
import { useState, useRef } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <div className="flex gap-2">
        <Input
          ref={searchInputRef}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for exercises..."
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button 
          onClick={handleSearch} 
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

interface SearchResultsProps {
  searchResults: any[];
  onExerciseSelect: (exerciseName: string) => void;
}

const SearchResults = ({ searchResults, onExerciseSelect }: SearchResultsProps) => {
  return (
    <ScrollArea className="h-[400px] w-full rounded-md border bg-black/5 backdrop-blur-sm p-4">
      <div className="grid grid-cols-1 gap-4">
        {searchResults.map((exercise, i) => (
          <SearchResultCard 
            key={i} 
            exercise={exercise} 
            onSelect={() => onExerciseSelect(exercise.name)}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

interface SearchResultCardProps {
  exercise: any;
  onSelect: () => void;
}

const SearchResultCard = ({ exercise, onSelect }: SearchResultCardProps) => {
  return (
    <div 
      className="group relative overflow-hidden rounded-lg border border-red-500/20 bg-black/40 p-4 transition-all hover:border-red-500/40 hover:bg-black/60"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4 flex-1">
          <div>
            <h4 className="font-medium text-lg text-white group-hover:text-red-400 transition-colors">
              {exercise.name}
            </h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {exercise.type && (
                <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                  {exercise.type}
                </span>
              )}
              {exercise.muscle && (
                <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                  {exercise.muscle}
                </span>
              )}
              {exercise.difficulty && (
                <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                  {exercise.difficulty}
                </span>
              )}
              {exercise.equipment && (
                <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                  {exercise.equipment}
                </span>
              )}
            </div>
          </div>

          {/* Muscles Section */}
          {(exercise.primaryMuscles?.length > 0 || exercise.secondaryMuscles?.length > 0) && (
            <div className="space-y-2">
              {exercise.primaryMuscles?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-red-400">Primary Muscles:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exercise.primaryMuscles.map((muscle, idx) => (
                      <span key={idx} className="text-xs text-gray-400">
                        {muscle}
                        {idx < exercise.primaryMuscles.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {exercise.secondaryMuscles?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-red-400">Secondary Muscles:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exercise.secondaryMuscles.map((muscle, idx) => (
                      <span key={idx} className="text-xs text-gray-400">
                        {muscle}
                        {idx < exercise.secondaryMuscles.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {exercise.instructions && (
            <div className="mt-2 space-y-1">
              <span className="text-xs font-medium text-red-400">Instructions:</span>
              {exercise.instructions.map((instruction, idx) => (
                <p key={idx} className="text-sm text-gray-400">
                  {idx + 1}. {instruction}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        {exercise.images && exercise.images.length > 0 && (
          <div className="hidden sm:flex flex-col gap-2">
            {exercise.images.slice(0, 2).map((image, idx) => (
              <div key={idx} className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-red-500/20">
                <img
                  src={image}
                  alt={`${exercise.name} - View ${idx + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'placeholder.svg';
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
