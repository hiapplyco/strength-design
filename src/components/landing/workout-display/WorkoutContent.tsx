
import { useState, useEffect } from "react";
import { WorkoutDayCard } from "./WorkoutDayCard";
import { WorkoutDisplayHeader } from "./WorkoutDisplayHeader";
import type { WeeklyWorkouts, WorkoutDay, WorkoutMeta } from "@/types/fitness";
import { isWorkoutDay } from "@/types/fitness";
import { formatAllWorkouts, formatWorkoutToMarkdown } from "@/utils/workout-formatting";
import { filterWorkoutDays } from "@/utils/workout-helpers";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface WorkoutContentProps {
  workouts: WeeklyWorkouts;
  resetWorkouts: () => void;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  onUpdate: (day: string, updates: Partial<WorkoutDay>) => void;
}

export const WorkoutContent = ({
  workouts,
  resetWorkouts,
  isExporting,
  setIsExporting,
  onUpdate
}: WorkoutContentProps) => {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const { toast } = useToast();
  const formattedWorkouts = formatAllWorkouts(workouts);
  const workoutText = formatWorkoutToMarkdown(formattedWorkouts);
  
  // Extract title and summary from _meta if available
  const meta = workouts._meta as WorkoutMeta | undefined;
  const workoutTitle = meta?.title || "Custom Workout Program";
  const workoutSummary = meta?.summary || "";

  // Filter out non-workout day entries
  const workoutDays = filterWorkoutDays(workouts);

  const generateGeminiSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const workoutDataForSummary = { ...workouts };
      if (workoutDataForSummary._meta) delete workoutDataForSummary._meta;
      
      const { data, error } = await supabase.functions.invoke('generate-workout-summary', {
        body: { workouts: workoutDataForSummary }
      });

      if (error) throw error;

      if (data?.summary) {
        // Update the workout meta with the new summary
        onUpdate('_meta', { 
          ...meta, 
          summary: data.summary 
        });
        
        setSummaryGenerated(true);
        toast({
          title: "Summary Generated",
          description: "Gemini has created a summary of your workout program.",
        });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="bg-background p-3 sm:p-4 md:p-6 rounded-lg overflow-hidden">
      {/* Title Section */}
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-oswald text-primary tracking-tight">
          {workoutTitle}
        </h1>
        
        <div className="mt-4 relative">
          {workoutSummary ? (
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto">
              {workoutSummary}
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              {isGeneratingSummary ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm">Generating Gemini summary...</p>
                </div>
              ) : (
                <Button 
                  onClick={generateGeminiSummary} 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  Generate Gemini Summary
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <WorkoutDisplayHeader
        resetWorkouts={resetWorkouts}
        isExporting={isExporting}
        workoutText={workoutText}
        allWorkouts={workouts}
      />

      <div className="grid gap-4 sm:gap-6 md:gap-8 mt-4 sm:mt-6 md:mt-8">
        {Object.entries(workouts)
          .filter(([key, value]) => key !== '_meta' && isWorkoutDay(value)) // Filter out the _meta entry and ensure it's a WorkoutDay
          .map(([day, workout], index) => (
            <WorkoutDayCard 
              key={day} 
              day={day} 
              workout={workout as WorkoutDay}
              index={index}
              isExporting={isExporting}
              setIsExporting={setIsExporting}
              allWorkouts={workoutDays}
              onUpdate={onUpdate}
            />
          ))}
      </div>
    </div>
  );
};
