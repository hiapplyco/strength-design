
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { PageHeader } from "@/components/generated-workouts/PageHeader";
import { WorkoutFilters } from "@/components/generated-workouts/WorkoutFilters";
import { WorkoutList } from "@/components/generated-workouts/WorkoutList";
import { BulkActionsBar } from "@/components/generated-workouts/BulkActionsBar";

type GeneratedWorkout = Database['public']['Tables']['generated_workouts']['Row'];

export default function GeneratedWorkouts() {
  const [workouts, setWorkouts] = useState<GeneratedWorkout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<GeneratedWorkout[]>([]);
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("generated_at_desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("generated_workouts")
          .select("*")
          .eq("user_id", user.id)
          .order("generated_at", { ascending: false });

        if (error) {
          console.error("Error fetching workouts:", error);
          toast({
            title: "Error",
            description: "Failed to load your workouts. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setWorkouts(data || []);
      } catch (error) {
        console.error("Error fetching workouts:", error);
        toast({
          title: "Error",
          description: "Failed to load your workouts. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, [user, toast]);

  // Get all unique tags from workouts
  const allTags = Array.from(
    new Set(
      workouts
        .flatMap(workout => workout.tags || [])
        .filter(Boolean)
    )
  );

  // Filter and sort workouts
  useEffect(() => {
    let filtered = [...workouts];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(workout =>
        workout.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply favorites filter
    if (showOnlyFavorites) {
      filtered = filtered.filter(workout => workout.is_favorite);
    }

    // Apply tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(workout =>
        workout.tags?.some(tag => selectedTags.includes(tag))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "generated_at_asc":
          return new Date(a.generated_at || 0).getTime() - new Date(b.generated_at || 0).getTime();
        case "generated_at_desc":
          return new Date(b.generated_at || 0).getTime() - new Date(a.generated_at || 0).getTime();
        case "title_asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title_desc":
          return (b.title || "").localeCompare(a.title || "");
        default:
          return 0;
      }
    });

    setFilteredWorkouts(filtered);
  }, [workouts, searchTerm, sortBy, selectedTags, showOnlyFavorites]);

  const handleToggleSelection = (workoutId: string) => {
    setSelectedWorkouts(prev => 
      prev.includes(workoutId) 
        ? prev.filter(id => id !== workoutId)
        : [...prev, workoutId]
    );
  };

  const handleToggleFavorite = async (workoutId: string) => {
    try {
      const workout = workouts.find(w => w.id === workoutId);
      if (!workout) return;

      const { error } = await supabase
        .from("generated_workouts")
        .update({ is_favorite: !workout.is_favorite })
        .eq("id", workoutId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update favorite status.",
          variant: "destructive",
        });
        return;
      }

      setWorkouts(prev => 
        prev.map(w => 
          w.id === workoutId 
            ? { ...w, is_favorite: !w.is_favorite }
            : w
        )
      );

      toast({
        title: workout.is_favorite ? "Removed from favorites" : "Added to favorites",
        description: workout.is_favorite 
          ? "Workout removed from your favorites." 
          : "Workout added to your favorites.",
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite status.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (workoutId: string) => {
    try {
      const workout = workouts.find(w => w.id === workoutId);
      if (!workout) return;

      const { data, error } = await supabase
        .from("generated_workouts")
        .insert({
          user_id: user?.id,
          title: `${workout.title} (Copy)`,
          summary: workout.summary,
          workout_data: workout.workout_data,
          tags: workout.tags,
          target_muscle_groups: workout.target_muscle_groups,
          equipment_needed: workout.equipment_needed,
          estimated_duration_minutes: workout.estimated_duration_minutes,
          difficulty_level: workout.difficulty_level,
          is_favorite: false
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to duplicate workout.",
          variant: "destructive",
        });
        return;
      }

      setWorkouts(prev => [data, ...prev]);
      toast({
        title: "Workout duplicated",
        description: "A copy of the workout has been created.",
      });
    } catch (error) {
      console.error("Error duplicating workout:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate workout.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const { error } = await supabase
        .from("generated_workouts")
        .delete()
        .in("id", selectedWorkouts);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete selected workouts.",
          variant: "destructive",
        });
        return;
      }

      setWorkouts(prev => prev.filter(w => !selectedWorkouts.includes(w.id)));
      setSelectedWorkouts([]);
      toast({
        title: "Workouts deleted",
        description: `${selectedWorkouts.length} workout(s) have been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting workouts:", error);
      toast({
        title: "Error",
        description: "Failed to delete selected workouts.",
        variant: "destructive",
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedWorkouts([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader />
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-white/60 mt-4">Loading your workouts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black p-8">
      <div className="max-w-7xl mx-auto">
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

        <WorkoutList
          workouts={filteredWorkouts}
          selectedWorkouts={selectedWorkouts}
          onToggleSelection={handleToggleSelection}
          onToggleFavorite={handleToggleFavorite}
          onDuplicate={handleDuplicate}
        />

        {selectedWorkouts.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedWorkouts.length}
            onDelete={handleDeleteSelected}
            onClearSelection={handleClearSelection}
          />
        )}
      </div>
    </div>
  );
}
