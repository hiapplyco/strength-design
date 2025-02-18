
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Exercise } from "./types";
import { useToast } from "@/hooks/use-toast";

export const useExerciseSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const searchExercises = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase.functions.invoke('search-exercises', {
          body: { query: searchQuery }
        });

        if (error) throw error;

        setSearchResults(data.results);
        
        // Show analysis toast for better user understanding
        if (data.analysis) {
          toast({
            title: "Search Analysis",
            description: `Looking for: ${data.analysis.muscle_groups?.join(', ') || 'any exercises'}
                        ${data.analysis.difficulty_level ? `\nDifficulty: ${data.analysis.difficulty_level}` : ''}
                        ${data.analysis.equipment ? `\nEquipment: ${data.analysis.equipment}` : ''}`,
          });
        }
      } catch (error) {
        console.error('Error searching exercises:', error);
        toast({
          title: "Error",
          description: "Failed to search exercises. Please try again.",
          variant: "destructive",
        });
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchExercises, 500);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, toast]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isLoading
  };
};
