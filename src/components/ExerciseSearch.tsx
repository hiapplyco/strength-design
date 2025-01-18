import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SearchButton } from "./exercise-search/SearchButton";
import { SearchInput } from "./exercise-search/SearchInput";
import { SearchResults } from "./exercise-search/SearchResults";
import type { Exercise } from "./exercise-search/types";

export const ExerciseSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
        const data = await response.json();
        setExercises(data);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      }
    };
    fetchExercises();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current;
      const isNearBottom = window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 100;

      // Hide when near bottom or scrolling down significantly
      if (isNearBottom || (isScrollingDown && currentScrollY > 200)) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      setIsLoading(true);
      const term = searchTerm.toLowerCase();
      const results = exercises.filter(exercise => {
        const nameMatch = exercise.name.toLowerCase().includes(term);
        const instructionsMatch = exercise.instructions.some(
          instruction => instruction.toLowerCase().includes(term)
        );
        return nameMatch || instructionsMatch;
      });
      setFilteredExercises(results);
      setIsLoading(false);
    } else {
      setFilteredExercises([]);
    }
  }, [searchTerm, exercises]);

  const handleClickOutside = (event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const sanitizeText = (text: string): string => {
    return text
      .replace(/WOD/g, 'Workout')
      .replace(/[^\w\s.,!?;:()\-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={searchRef}
      className={cn(
        "fixed bottom-8 right-8 z-50 transition-all duration-300 ease-in-out",
        isOpen ? "w-96" : "w-12"
      )}
    >
      <div className="bg-primary rounded-lg shadow-lg p-4 border-2 border-black">
        <div className="flex items-center justify-center gap-2">
          <SearchButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
          {isOpen && <SearchInput value={searchTerm} onChange={setSearchTerm} />}
        </div>

        {isOpen && searchTerm && (
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <SearchResults 
              isLoading={isLoading}
              exercises={filteredExercises}
              sanitizeText={sanitizeText}
            />
          </div>
        )}
      </div>
    </div>
  );
};