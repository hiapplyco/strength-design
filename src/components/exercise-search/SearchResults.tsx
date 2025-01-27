import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  selectedExercises: Exercise[];
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

  return (
    <div className="rounded-lg border bg-card max-h-[60vh] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Exercise</TableHead>
            <TableHead>Instructions</TableHead>
            <TableHead className="w-[100px] text-center">Select</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((exercise, index) => {
            const isSelected = selectedExercises.some(ex => ex.name === exercise.name);
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
                        loading="eager"
                        decoding="async"
                        crossOrigin="anonymous"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-md">
                  {exercise.instructions[0]}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <Button
                      onClick={() => onExerciseSelect(exercise)}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "w-24 transition-colors duration-200",
                        isSelected ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-primary/10"
                      )}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};