import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/generated-workouts/PageHeader";
import { WorkoutList } from "@/components/generated-workouts/WorkoutList";
import { WorkoutFilters } from "@/components/generated-workouts/WorkoutFilters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { BulkActionsBar } from "@/components/generated-workouts/BulkActionsBar";

type GeneratedWorkout = Database['public']['Tables']['generated_workouts']['Row'];

const GeneratedWorkouts = () => {
  const [workouts, setWorkouts] = useState<GeneratedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("generated_at_desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  useEffect(() => {
    const fetchWorkouts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('generated_workouts')
          .select('*')
          .order('generated_at', { ascending: false });
          
        if (error) throw error;
        setWorkouts(data || []);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        toast({
          title: "Error",
          description: "Failed to load workouts. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkouts();
  }, [toast]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    workouts.forEach(workout => {
      workout.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [workouts]);

  const filteredAndSortedWorkouts = useMemo(() => {
    let filtered = workouts.filter(workout => {
      const searchTermLower = searchTerm.toLowerCase();
      const titleMatch = workout.title?.toLowerCase().includes(searchTermLower) ?? false;
      const summaryMatch = workout.summary?.toLowerCase().includes(searchTermLower) ?? false;
      const tagsMatch = selectedTags.length === 0 || selectedTags.every(tag => workout.tags?.includes(tag));
      const favoritesMatch = !showOnlyFavorites || workout.is_favorite;
      
      return (titleMatch || summaryMatch) && tagsMatch && favoritesMatch;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "generated_at_desc":
          return new Date(b.generated_at!).getTime() - new Date(a.generated_at!).getTime();
        case "generated_at_asc":
          return new Date(a.generated_at!).getTime() - new Date(b.generated_at!).getTime();
        case "title_asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title_desc":
          return (b.title || "").localeCompare(a.title || "");
        default:
          return 0;
      }
    });
  }, [workouts, searchTerm, sortBy, selectedTags, showOnlyFavorites]);

  const toggleWorkoutSelection = (workoutId: string) => {
    setSelectedWorkouts(prev => 
      prev.includes(workoutId)
        ? prev.filter(id => id !== workoutId)
        : [...prev, workoutId]
    );
  };

  const handleToggleFavorite = async (workoutId: string) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;

    const newIsFavorite = !workout.is_favorite;

    try {
      const { error } = await supabase
        .from('generated_workouts')
        .update({ is_favorite: newIsFavorite })
        .eq('id', workoutId)
        .select()
        .single();

      if (error) throw error;

      setWorkouts(currentWorkouts =>
        currentWorkouts.map(w =>
          w.id === workoutId ? { ...w, is_favorite: newIsFavorite } : w
        )
      );

      toast({
        title: newIsFavorite ? "Added to Favorites" : "Removed from Favorites",
        description: `"${workout.title || 'Workout'}" has been updated.`,
      });
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateWorkout = async (workoutId: string) => {
    const workoutToDuplicate = workouts.find(w => w.id === workoutId);
    if (!workoutToDuplicate) {
      toast({ title: "Error", description: "Workout not found.", variant: "destructive" });
      return;
    }

    try {
      const { data: newWorkout, error } = await supabase
        .from('generated_workouts')
        .insert({
          title: `Copy of ${workoutToDuplicate.title || 'Generated Workout'}`,
          summary: workoutToDuplicate.summary,
          tags: workoutToDuplicate.tags,
          workout_data: workoutToDuplicate.workout_data,
          user_id: workoutToDuplicate.user_id,
          is_favorite: false,
        })
        .select()
        .single();

      if (error) throw error;

      if (newWorkout) {
        setWorkouts(currentWorkouts => [newWorkout, ...currentWorkouts]);
      }

      toast({
        title: "Workout Duplicated",
        description: `A copy of "${workoutToDuplicate.title || 'Generated Workout'}" has been created.`,
      });
    } catch (error) {
      console.error('Error duplicating workout:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate workout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedWorkouts.length === 0) return;

    try {
      const { error } = await supabase
        .from('generated_workouts')
        .delete()
        .in('id', selectedWorkouts);

      if (error) throw error;

      setWorkouts(currentWorkouts => 
        currentWorkouts.filter(w => !selectedWorkouts.includes(w.id))
      );
      
      toast({
        title: "Success",
        description: `${selectedWorkouts.length} workout(s) deleted successfully.`,
      });

      setSelectedWorkouts([]);
    } catch (error) {
      console.error('Error deleting workouts:', error);
      toast({
        title: "Error",
        description: "Failed to delete workouts. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <PageHeader />
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
          {isLoading ? (
            <p className="text-white text-center mt-8">Loading your workouts...</p>
          ) : (
            <WorkoutList
              workouts={filteredAndSortedWorkouts}
              selectedWorkouts={selectedWorkouts}
              onToggleSelection={toggleWorkoutSelection}
              onToggleFavorite={handleToggleFavorite}
              onDuplicate={handleDuplicateWorkout}
            />
          )}
        </div>
      </div>
      {selectedWorkouts.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedWorkouts.length}
          onDelete={handleDeleteSelected}
          onClearSelection={() => setSelectedWorkouts([])}
        />
      )}
    </div>
  );
};

export default GeneratedWorkouts;
