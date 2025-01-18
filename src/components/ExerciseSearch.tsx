import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Exercise {
  name: string;
  level: string;
  instructions: string[];
  images?: string[];
}

export const ExerciseSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleScroll = () => {
      if (searchRef.current) {
        const scrollY = window.scrollY;
        searchRef.current.style.transform = `translateY(${scrollY}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={searchRef}
      className={cn(
        "fixed right-4 z-50 transition-all duration-300 ease-in-out",
        isOpen ? "w-96" : "w-12"
      )}
      style={{ top: '5rem' }}
    >
      <div className="bg-primary rounded-lg shadow-lg p-4 border-2 border-black">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="shrink-0 text-primary-foreground hover:text-primary-foreground/80"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>
          
          {isOpen && (
            <Input
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-black placeholder:text-gray-500"
            />
          )}
        </div>

        {isOpen && searchTerm && (
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-primary-foreground">Loading...</p>
            ) : filteredExercises.length > 0 ? (
              <div className="space-y-4">
                {filteredExercises.map((exercise, index) => (
                  <div key={index} className="bg-white rounded p-4 border border-black">
                    <h3 className="font-bold text-lg text-black">{exercise.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">Level: {exercise.level}</p>
                    <div className="text-sm">
                      <p className="font-medium mb-1 text-black">Instructions:</p>
                      <ul className="list-disc pl-4 space-y-1 text-black">
                        {exercise.instructions.map((instruction, idx) => (
                          <li key={idx}>{instruction}</li>
                        ))}
                      </ul>
                    </div>
                    {exercise.images?.[0] && (
                      <img
                        src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${exercise.images[0]}`}
                        alt={exercise.name}
                        className="mt-2 rounded w-full h-auto"
                        loading="lazy"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-destructive font-bold">No exercises found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};