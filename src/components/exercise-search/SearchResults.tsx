import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Exercise } from "./types";

interface SearchResultsProps {
  results: Exercise[];
  selectedExercises: string[];
  onExerciseSelect: (exercise: Exercise) => void;
  sanitizeText: (text: string) => string;
}

export const SearchResults = ({ 
  results, 
  selectedExercises, 
  onExerciseSelect,
  sanitizeText 
}: SearchResultsProps) => {
  if (results.length === 0) return null;

  const handleSelection = (exercise: Exercise, isSelected: boolean) => {
    onExerciseSelect(exercise);
  };

  return (
    <div className="rounded-lg border bg-card max-h-[60vh] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Exercise</TableHead>
            <TableHead>Instructions</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((exercise, index) => {
            const isSelected = selectedExercises.includes(exercise.name);
            return (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-2">
                    <span className="text-primary font-semibold">
                      {sanitizeText(exercise.name)}
                    </span>
                    {exercise.images?.[0] && (
                      <img
                        src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${exercise.images[0]}`}
                        alt={exercise.name}
                        className="rounded-md w-48 h-auto object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-md">
                  {exercise.instructions[0]}
                </TableCell>
                <TableCell>
                  {isSelected ? (
                    <Button
                      variant="default"
                      className="w-full bg-green-500 hover:bg-green-600 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between w-full">
                        <Check className="h-4 w-4 text-white" />
                        <X 
                          className="h-4 w-4 text-red-500 hover:text-red-600 cursor-pointer" 
                          onClick={() => handleSelection(exercise, false)}
                        />
                      </div>
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={() => handleSelection(exercise, true)}
                      className="w-full bg-[#C4A052] hover:bg-[#B38E3B] transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};