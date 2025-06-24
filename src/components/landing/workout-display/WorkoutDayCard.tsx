
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
    <div className="w-full bg-card/70 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mx-auto max-w-[95%] sm:max-w-full border border-border/20 hover:border-primary/20 overflow-hidden">
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
        {/* Enhanced Search Section */}
        <div className="bg-gradient-to-r from-slate-500/5 to-slate-500/10 rounded-lg p-4 border border-border/10">
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
        
        {/* Enhanced Workout Content Sections */}
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/2 to-transparent rounded-lg -z-10"></div>
          
          <WorkoutContentSection
            workout={workout}
            onExerciseSelect={handleExerciseSelect}
          />
        </div>
      </div>
    </div>
  );
};
