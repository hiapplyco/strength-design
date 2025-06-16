import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { PageHeader } from "@/components/generated-workouts/PageHeader";
import { WorkoutFilters } from "@/components/generated-workouts/WorkoutFilters";
import { WorkoutList } from "@/components/generated-workouts/WorkoutList";
import { BulkActionsBar } from "@/components/generated-workouts/BulkActionsBar";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, width, layout } from "@/utils/responsive";

export default function GeneratedWorkouts() {
  const { session } = useAuth();
  const { workoutSessions, isLoading, deleteWorkoutSession } = useWorkoutSessions(session?.user?.id);
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    fitnessLevel: "",
    goals: "",
    dateRange: ""
  });

  const filteredWorkouts = workoutSessions?.filter(workout => {
    const searchRegex = new RegExp(filters.search, 'i');
    const matchesSearch = searchRegex.test(workout.name);

    const matchesFitnessLevel = !filters.fitnessLevel || workout.fitnessLevel === filters.fitnessLevel;
    const matchesGoals = !filters.goals || workout.goals === filters.goals;

    const matchesDateRange = !filters.dateRange || (
      filters.dateRange === '7' && isWithinLast7Days(workout.created_at) ||
      filters.dateRange === '30' && isWithinLast30Days(workout.created_at)
    );

    return matchesSearch && matchesFitnessLevel && matchesGoals && matchesDateRange;
  }) || [];

  function isWithinLast7Days(dateString: string): boolean {
    const date = new Date(dateString);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return date >= sevenDaysAgo;
  }

  function isWithinLast30Days(dateString: string): boolean {
    const date = new Date(dateString);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  }

  const handleWorkoutSelect = (workoutId: string) => {
    setSelectedWorkouts(prev => {
      if (prev.includes(workoutId)) {
        return prev.filter(id => id !== workoutId);
      } else {
        return [...prev, workoutId];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedWorkouts.length === 0) return;

    for (const workoutId of selectedWorkouts) {
      await deleteWorkoutSession(workoutId);
    }

    setSelectedWorkouts([]);
  };

  return (
    <StandardPageLayout className={spacing.container}>
      <div className={`${width.full} ${spacing.section} ${layout.stack} ${spacing.gap}`}>
        <PageHeader 
          totalWorkouts={filteredWorkouts.length}
          selectedCount={selectedWorkouts.length}
        />
        
        <WorkoutFilters 
          filters={filters}
          onFiltersChange={setFilters}
        />
        
        {selectedWorkouts.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedWorkouts.length}
            onDelete={handleBulkDelete}
            onClearSelection={() => setSelectedWorkouts([])}
          />
        )}
        
        <div className={`${width.full} ${layout.noOverflow}`}>
          <WorkoutList
            workouts={filteredWorkouts}
            isLoading={isLoading}
            selectedWorkouts={selectedWorkouts}
            onWorkoutSelect={handleWorkoutSelect}
            onWorkoutDelete={deleteWorkoutSession}
          />
        </div>
      </div>
    </StandardPageLayout>
  );
}
