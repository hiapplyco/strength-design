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
                  <Button
                    variant={isSelected ? "default" : "default"}
                    onClick={() => onExerciseSelect(exercise)}
                    className={cn(
                      "w-full transition-all duration-200",
                      isSelected 
                        ? "bg-green-500 hover:bg-green-600" 
                        : "bg-primary hover:bg-primary/90"
                    )}
                  >
                    {isSelected ? (
                      <div className="flex items-center justify-center w-full">
                        <Check className="h-4 w-4 text-white" />
                        <X 
                          className="h-4 w-4 text-white ml-2 hover:text-red-200" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onExerciseSelect(exercise);
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};