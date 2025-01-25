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
                    variant="default"
                    onClick={() => onExerciseSelect(exercise)}
                    className={cn(
                      "w-full transition-colors duration-200 group",
                      isSelected 
                        ? "bg-green-500 hover:bg-red-500" 
                        : "bg-[#C4A052] hover:bg-[#B38E3B]"
                    )}
                  >
                    <div className="flex items-center justify-center w-full gap-2">
                      {isSelected ? (
                        <>
                          <Check className="h-4 w-4 group-hover:hidden" />
                          <X className="h-4 w-4 hidden group-hover:block" />
                          <span className="hidden group-hover:block">Remove</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Add</span>
                        </>
                      )}
                    </div>
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