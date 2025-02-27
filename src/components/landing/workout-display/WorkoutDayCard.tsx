
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { useToast } from "@/hooks/use-toast";
import { exportToCalendar } from "@/utils/calendar";
import { useRef, useState } from "react";
import type { WorkoutDay } from "@/types/fitness";
import { SearchSection } from "./workout-day-card/SearchSection";
import { WorkoutContentSection } from "./workout-day-card/WorkoutContentSection";

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

  const handleExerciseSelect = (exerciseName: string) => {
    setSearchTerm(exerciseName);
    // Focus the search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
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
        
        {/* Workout Content Sections */}
        <WorkoutContentSection
          workout={workout}
          onExerciseSelect={handleExerciseSelect}
        />
      </div>
    </div>
  );
};
