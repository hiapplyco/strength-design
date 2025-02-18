
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { useToast } from "@/hooks/use-toast";
import { exportToCalendar } from "@/utils/calendar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Image, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClickableExercise } from "@/components/workout/ClickableExercise";
import { extractExerciseNames } from "@/utils/exercise-formatting";
import type { WorkoutDay } from "@/types/fitness";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface WorkoutDayCardProps {
  day: string;
  index: number;
  workout: WorkoutDay;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  allWorkouts: Record<string, WorkoutDay>;
  onUpdate: (day: string, updates: Partial<WorkoutDay>) => void;
}

export const WorkoutDayCard = ({
  day,
  index,
  workout,
  isExporting,
  setIsExporting,
  allWorkouts,
  onUpdate
}: WorkoutDayCardProps) => {
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-exercises', {
        body: { query: searchTerm }
      });

      if (error) throw error;

      setSearchResults(data.results || []);
      
      if (data.results?.length === 0) {
        toast({
          title: "No results found",
          description: "Try different search terms",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching exercises:', error);
      toast({
        title: "Search failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleExerciseSelect = (exerciseName: string) => {
    setSearchTerm(exerciseName);
    handleSearch();
  };

  const renderTextWithClickableExercises = (text: string) => {
    if (!text) return null;

    const exercises = extractExerciseNames(text);
    let result = text;

    exercises.forEach(exercise => {
      const regex = new RegExp(`\\b${exercise}\\b`, 'g');
      result = result.replace(
        regex,
        `<span class="exercise-placeholder">${exercise}</span>`
      );
    });

    const parts = result.split(/<span class="exercise-placeholder">|<\/span>/);
    
    return (
      <p className="text-muted-foreground text-sm sm:text-base whitespace-pre-line">
        {parts.map((part, i) => {
          if (exercises.includes(part)) {
            return (
              <ClickableExercise
                key={i}
                name={part}
                onSelect={handleExerciseSelect}
              />
            );
          }
          return part;
        })}
      </p>
    );
  };

  return (
    <div className="w-full bg-card rounded-xl border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_rgba(255,0,0,1),8px_8px_0px_0px_#C4A052] transition-all duration-200 mx-auto max-w-[95%] sm:max-w-full">
      <WorkoutHeader
        title={`Day ${index + 1}`}
        isExporting={isExporting}
        onExport={async () => {
          try {
            setIsExporting(true);
            await exportToCalendar([{
              title: `Day ${index + 1}`,
              warmup: workout.warmup,
              workout: workout.workout,
              notes: workout.notes || '',
              dayOffset: 0
            }], toast);
          } finally {
            setIsExporting(false);
          }
        }}
        warmup={workout.warmup}
        workout={workout.workout}
        notes={workout.notes || ''}
        strength={workout.strength}
        allWorkouts={allWorkouts}
        onUpdate={(updates) => onUpdate(day, updates)}
        searchInputRef={searchInputRef}
      />
      
      <div className="p-4 sm:p-6 space-y-6">
        {/* Search Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-destructive">Exercise Search</h3>
          <div className="flex gap-2">
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for exercises..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              variant="outline"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <div className="space-y-2">
                {searchResults.map((exercise, i) => (
                  <div key={i} className="p-2 hover:bg-accent rounded-md cursor-pointer" onClick={() => handleExerciseSelect(exercise.name)}>
                    <h4 className="font-medium">{exercise.name}</h4>
                    {exercise.instructions && (
                      <p className="text-sm text-muted-foreground">{exercise.instructions[0]}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Description</h3>
          {renderTextWithClickableExercises(workout.description)}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Warm-up</h3>
          {renderTextWithClickableExercises(workout.warmup)}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Workout</h3>
          {renderTextWithClickableExercises(workout.workout)}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Strength Focus</h3>
          {renderTextWithClickableExercises(workout.strength)}
        </div>
        
        {workout.notes && (
          <div>
            <h3 className="text-lg font-semibold text-destructive mb-2">Coaching Notes</h3>
            {renderTextWithClickableExercises(workout.notes)}
          </div>
        )}

        {workout.exercises && workout.exercises.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-destructive mb-2">Exercise List</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {workout.exercises.map((exercise, i) => (
                <Button
                  key={i}
                  variant="outline"
                  onClick={() => handleExerciseSelect(exercise.name)}
                  className="text-left flex justify-between items-center p-4"
                >
                  <span className="font-medium">{exercise.name}</span>
                  {exercise.sets && exercise.reps && (
                    <span className="text-sm text-muted-foreground">
                      {exercise.sets}x{exercise.reps}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        {workout.images && workout.images.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-destructive mb-2">Exercise Images</h3>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {workout.images.map((image, i) => (
                  <div key={i} className="relative">
                    <AspectRatio ratio={1}>
                      {image ? (
                        <img
                          src={image}
                          alt={`Exercise ${i + 1}`}
                          className="rounded-md object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-muted rounded-md">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </AspectRatio>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};
