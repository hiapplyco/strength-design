
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
  console.log('SearchResults received:', results.length, 'exercises');
  
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No exercises found. Try different search terms.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card max-h-[60vh] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Exercise</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="w-[100px] text-center">Select</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((exercise, index) => {
            const isSelected = selectedExercises.some(ex => ex.id === exercise.id);
            return (
              <TableRow key={exercise.id || index}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-2">
                    <span className="text-primary font-semibold">
                      {sanitizeText(exercise.name)}
                    </span>
                    {exercise.images && exercise.images.length > 0 && (
                      <img
                        src={exercise.images[0]}
                        alt={exercise.name}
                        className="rounded-md w-32 h-24 object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {exercise.type && exercise.type.map((t) => (
                        <span key={t} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {t}
                        </span>
                      ))}
                      {exercise.equipment && exercise.equipment.map((eq) => (
                        <span key={eq} className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-1 text-xs font-medium">
                          {eq}
                        </span>
                      ))}
                    </div>
                    {exercise.instructions && exercise.instructions.length > 0 && (
                      <p className="text-xs leading-relaxed max-w-md">
                        {exercise.instructions.join(' ').substring(0, 150)}
                        {exercise.instructions.join(' ').length > 150 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <Button
                      onClick={() => onExerciseSelect(exercise)}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "w-20 transition-colors duration-200",
                        isSelected ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-primary/10"
                      )}
                    >
                      {isSelected ? "Added" : "Add"}
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
