
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { PageHeader } from "@/components/generated-workouts/PageHeader";
import { WorkoutFilters } from "@/components/generated-workouts/WorkoutFilters";
import { WorkoutList } from "@/components/generated-workouts/WorkoutList";
import { BulkActionsBar } from "@/components/generated-workouts/BulkActionsBar";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, width, layout } from "@/utils/responsive";
import { ProFeatureWrapper } from "@/components/common/ProFeatureWrapper";

export default function GeneratedWorkouts() {
  const { session } = useAuth();
  const { sessions: workoutSessions, isLoading } = useWorkoutSessions();
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("generated_at_desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Extract all unique tags from workouts
  const allTags = Array.from(new Set(
    workoutSessions?.flatMap(session => 
      session.generated_workouts?.tags || []
    ) || []
  ));

  const filteredWorkouts = workoutSessions?.filter(session => {
    const workout = session.generated_workouts;
    if (!workout) return false;

    const searchRegex = new RegExp(searchTerm, 'i');
    const matchesSearch = searchRegex.test(workout.title || '') || 
                         searchRegex.test(workout.summary || '');

    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => workout.tags?.includes(tag));

    const matchesFavorites = !showOnlyFavorites || workout.is_favorite;

    return matchesSearch && matchesTags && matchesFavorites;
  }) || [];

  const handleWorkoutSelect = (workoutId: string) => {
    setSelectedWorkouts(prev => {
      if (prev.includes(workoutId)) {
        return prev.filter(id => id !== workoutId);
      } else {
        return [...prev, workoutId];
      }
    });
  };

  const handleToggleFavorite = async (workoutId: string) => {
    // TODO: Implement favorite toggle functionality
    console.log('Toggle favorite for workout:', workoutId);
  };

  const handleDuplicate = async (workoutId: string) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate workout:', workoutId);
  };

  const handleBulkDelete = async () => {
    if (selectedWorkouts.length === 0) return;
    // TODO: Implement bulk delete functionality
    console.log('Delete workouts:', selectedWorkouts);
    setSelectedWorkouts([]);
  };

  return (
    <StandardPageLayout className={spacing.container}>
      <div className={`${width.full} ${spacing.section} ${layout.stack} ${spacing.gap}`}>
        <ProFeatureWrapper featureName="Workout History">
          <PageHeader 
            totalWorkouts={filteredWorkouts.length}
            selectedCount={selectedWorkouts.length}
          />
          
          <WorkoutFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            allTags={allTags}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            showOnlyFavorites={showOnlyFavorites}
            setShowOnlyFavorites={setShowOnlyFavorites}
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
              workouts={filteredWorkouts.map(session => session.generated_workouts!)}
              selectedWorkouts={selectedWorkouts}
              onToggleSelection={handleWorkoutSelect}
              onToggleFavorite={handleToggleFavorite}
              onDuplicate={handleDuplicate}
            />
          </div>
        </ProFeatureWrapper>
      </div>
    </StandardPageLayout>
  );
}
