
import { useState, useEffect, useCallback } from "react";
import type { Exercise } from "./types";
import { useToast } from "@/hooks/use-toast";
import { debounce } from "lodash";

// Use emulator URL in development, production URL in production
const SEARCH_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:5001/strength-design/us-central1/searchExercises'
  : 'https://us-central1-strength-design.cloudfunctions.net/searchExercises';

export const useExerciseSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const [equipment, setEquipment] = useState("");
  const [muscle, setMuscle] = useState("");
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const performSearch = useCallback(async (searchParams: {
    query: string;
    category: string;
    equipment: string;
    muscle: string;
  }) => {
    if (!searchParams.query && !searchParams.category && !searchParams.equipment && !searchParams.muscle) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...searchParams,
          limit: 50
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error searching exercises:', response.status, response.statusText, errorText);
        throw new Error(`Failed to search exercises: ${response.statusText}. Check console for details.`);
      }

      const data = await response.json();
      setSearchResults(data.exercises || []);
    } catch (error) {
      console.error('Error in performSearch:', error);
      toast({
        title: "Error Searching Exercises",
        description: "Could not perform search. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const debouncedSearch = useCallback(debounce(performSearch, 300), [performSearch]);

  useEffect(() => {
    debouncedSearch({ query: searchQuery, category, equipment, muscle });
  }, [searchQuery, category, equipment, muscle, debouncedSearch]);

  return {
    searchQuery,
    setSearchQuery,
    category,
    setCategory,
    equipment,
    setEquipment,
    muscle,
    setMuscle,
    searchResults,
    isLoading,
  };
};
