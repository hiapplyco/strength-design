import { useState, useEffect } from "react";
import type { Exercise } from "./types";

export const useExerciseSearch = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
        if (!response.ok) {
          throw new Error('Failed to fetch exercises');
        }
        const data = await response.json();
        setExercises(data);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      }
    };
    fetchExercises();
  }, []);

  useEffect(() => {
    const performSearch = () => {
      try {
        if (searchQuery.trim()) {
          const term = searchQuery.toLowerCase();
          const results = exercises.filter(exercise => {
            const nameMatch = exercise.name.toLowerCase().includes(term);
            const instructionsMatch = exercise.instructions.some(
              instruction => instruction.toLowerCase().includes(term)
            );
            return nameMatch || instructionsMatch;
          });
          setSearchResults(results);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching exercises:', error);
      }
    };

    const debounceTimeout = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, exercises]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults
  };
};