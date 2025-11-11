
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Exercise } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EnhancedSearchResultsProps {
  results: Exercise[];
  selectedExercises: Exercise[];
  onExerciseToggle: (exercise: Exercise) => void;
  isLoading: boolean;
}

export const EnhancedSearchResults = ({ 
  results, 
  selectedExercises, 
  onExerciseToggle,
  isLoading 
}: EnhancedSearchResultsProps) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Searching exercises...</span>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No exercises found. Try different search terms.</p>
      </div>
    );
  }

  const sanitizeText = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const handleVideoPlay = (videoUrl: string) => {
    setSelectedVideo(videoUrl);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  return (
    <>
      <div className="rounded-lg border bg-card max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
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
                <TableRow key={exercise.id || index} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-2">
                      <span className="text-primary font-semibold">
                        {sanitizeText(exercise.name)}
                      </span>
                      <div className="relative">
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
                        {exercise.video_url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => handleVideoPlay(exercise.video_url!)}>
                            <PlayCircle className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {exercise.level && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {exercise.level}
                          </span>
                        )}
                        {exercise.equipment && (
                          <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-1 text-xs font-medium">
                            {Array.isArray(exercise.equipment) ? exercise.equipment.join(', ') : exercise.equipment}
                          </span>
                        )}
                      </div>
                      {exercise.instructions && exercise.instructions.length > 0 && (
                        <p className="text-xs leading-relaxed max-w-md">
                          {exercise.instructions[0].substring(0, 120)}
                          {exercise.instructions[0].length > 120 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Button
                        onClick={() => onExerciseToggle(exercise)}
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
      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={handleCloseVideo}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Exercise Video</DialogTitle>
              <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={handleCloseVideo}>
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <div className="aspect-video">
              <video src={selectedVideo} controls autoPlay className="w-full h-full rounded-lg" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
