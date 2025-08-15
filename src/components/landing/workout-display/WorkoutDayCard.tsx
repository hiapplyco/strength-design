
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { useToast } from "@/hooks/use-toast";
import { exportToCalendar } from "@/utils/calendar";
import { useRef, useState } from "react";
import type { WorkoutDay } from "@/types/fitness";
import { SearchSection } from "./workout-day-card/SearchSection";
import { WorkoutContentSection } from "./workout-day-card/WorkoutContentSection";
import { EditWorkoutDayDialog } from "@/components/workout/EditWorkoutDayDialog";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface WorkoutDayCardProps {
  day: string;
  index: number;
  workout: WorkoutDay;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  allWorkouts: Record<string, WorkoutDay>;
  onUpdate: (day: string, updates: Partial<WorkoutDay>) => void;
  cycleNumber?: number;
}

export const WorkoutDayCard = ({
  day,
  index,
  workout,
  isExporting,
  setIsExporting,
  allWorkouts,
  onUpdate,
  cycleNumber = 1
}: WorkoutDayCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleExerciseSelect = (exerciseName: string) => {
    setSearchTerm(exerciseName);
    // Focus the search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="w-full bg-card/90 backdrop-blur-sm rounded-xl border border-border/60 hover:border-primary/30 hover:bg-card/95 transition-all duration-300 mx-auto max-w-[95%] sm:max-w-full overflow-hidden shadow-sm">
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
      
      <div className="p-6 sm:p-8 space-y-8">
        {/* Edit Button */}
        {user && (
          <div className="flex justify-end -mt-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Day
            </Button>
          </div>
        )}

        {/* Clean Search Section */}
        <div className="bg-muted/30 rounded-lg p-4 border border-border/20">
          <SearchSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchResults={searchResults}
            setSearchResults={setSearchResults}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
            onExerciseSelect={handleExerciseSelect}
            searchInputRef={searchInputRef}
          />
        </div>
        
        {/* Clean Workout Content Sections */}
        <WorkoutContentSection
          workout={workout}
          onExerciseSelect={handleExerciseSelect}
        />
      </div>

      {/* Edit Dialog */}
      <EditWorkoutDayDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        workoutDay={workout}
        dayNumber={index + 1}
        cycleNumber={cycleNumber}
        fitnessLevel={user?.user_metadata?.fitness_level || "beginner"}
        onUpdate={(updatedDay) => {
          onUpdate(day, updatedDay);
        }}
      />
    </div>
  );
};
