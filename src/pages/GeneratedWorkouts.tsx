
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/generated-workouts/PageHeader";
import { WorkoutList } from "@/components/generated-workouts/WorkoutList";
import { WorkoutFilters } from "@/components/generated-workouts/WorkoutFilters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type GeneratedWorkout = Database['public']['Tables']['generated_workouts']['Row'];

const GeneratedWorkouts = () => {
  const [workouts, setWorkouts] = useState<GeneratedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("generated_at_desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
      
      return (titleMatch || summaryMatch) && tagsMatch;
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
  }, [workouts, searchTerm, sortBy, selectedTags]);

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
          />
          {isLoading ? (
            <p className="text-white text-center mt-8">Loading your workouts...</p>
          ) : (
            <WorkoutList workouts={filteredAndSortedWorkouts} />
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratedWorkouts;
