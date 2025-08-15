
import { useState, useEffect, useCallback } from "react";
import type { Exercise } from "@/components/exercise-search/types";
import { useToast } from "@/hooks/use-toast";
import { debounce } from "lodash";

const SEARCH_URL = 'https://us-central1-strength-design.cloudfunctions.net/searchExercises';
const CATEGORIES_URL = 'https://us-central1-strength-design.cloudfunctions.net/getExerciseCategories';

export const useEnhancedExerciseSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const [equipment, setEquipment] = useState("");
  const [muscle, setMuscle] = useState("");
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [equipments, setEquipments] = useState<string[]>([]);
  const [muscles, setMuscles] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(CATEGORIES_URL);
        const data = await response.json();
        setCategories(data.categories || []);
        setEquipments(data.equipment || []);
        setMuscles(data.muscles || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

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
    categories,
    equipments,
    muscles,
    exerciseCount: searchResults.length,
    hasError: false, // This should be handled properly based on the try/catch block
  };
};
