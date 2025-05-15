
import { useState, useEffect } from "react";
import { WorkoutDayCard } from "./WorkoutDayCard";
import { WorkoutDisplayHeader } from "./WorkoutDisplayHeader";
import type { WeeklyWorkouts, WorkoutDay, WorkoutMeta, WorkoutCycle } from "@/types/fitness";
import { isWorkoutDay, isWorkoutCycle } from "@/types/fitness";
import { formatAllWorkouts, formatWorkoutToMarkdown } from "@/utils/workout-formatting";
import { filterWorkoutDays } from "@/utils/workout-helpers";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WorkoutContentProps {
  workouts: WeeklyWorkouts;
  resetWorkouts: () => void;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  onUpdate: (cycleKey: string, day: string, updates: Partial<WorkoutDay | WorkoutMeta>) => void;
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
  const numberOfCycles = meta?.inputs?.numberOfCycles || 1;

  // Find all cycle keys in the workouts
  const cycleKeys = Object.keys(workouts).filter(key => 
    key.startsWith('cycle') || (key !== '_meta' && isWorkoutCycle(workouts[key]))
  );

  // If no cycles found but we have workout days, treat it as a single unnamed cycle
  const legacyWorkoutDays = cycleKeys.length === 0 
    ? Object.entries(workouts)
        .filter(([key, value]) => key !== '_meta' && isWorkoutDay(value))
        .map(([key]) => key)
    : [];

  // Default to the first cycle or "legacy" for non-cycle data
  const [activeTab, setActiveTab] = useState(cycleKeys.length > 0 ? cycleKeys[0] : 'legacy');

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
        // Make sure we're passing a WorkoutMeta object
        onUpdate('_meta', '_meta', { 
          summary: data.summary 
        } as Partial<WorkoutMeta>);
        
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

      {/* Cycle Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mt-4 sm:mt-6"
      >
        {/* Only show tabs if we have multiple cycles */}
        {(cycleKeys.length > 1 || (cycleKeys.length === 1 && legacyWorkoutDays.length > 0)) && (
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full mb-6">
            {cycleKeys.map((cycleKey) => (
              <TabsTrigger key={cycleKey} value={cycleKey} className="text-sm">
                {cycleKey.charAt(0).toUpperCase() + cycleKey.slice(1)}
              </TabsTrigger>
            ))}
            {legacyWorkoutDays.length > 0 && (
              <TabsTrigger value="legacy" className="text-sm">
                Legacy Workouts
              </TabsTrigger>
            )}
          </TabsList>
        )}

        {/* Cycle Content */}
        {cycleKeys.map((cycleKey) => (
          <TabsContent key={cycleKey} value={cycleKey} className="space-y-6">
            <div className="grid gap-4 sm:gap-6 md:gap-8">
              {isWorkoutCycle(workouts[cycleKey]) && 
               Object.entries(workouts[cycleKey] as WorkoutCycle).map(([day, workout], index) => (
                <WorkoutDayCard 
                  key={`${cycleKey}-${day}`} 
                  day={day} 
                  workout={workout as WorkoutDay}
                  index={index}
                  isExporting={isExporting}
                  setIsExporting={setIsExporting}
                  allWorkouts={(workouts[cycleKey] as WorkoutCycle)}
                  onUpdate={(day, updates) => onUpdate(cycleKey, day, updates)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
        
        {/* Legacy Content (if any) */}
        {legacyWorkoutDays.length > 0 && (
          <TabsContent value="legacy" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 md:gap-8">
              {legacyWorkoutDays.map((day, index) => (
                <WorkoutDayCard 
                  key={day} 
                  day={day} 
                  workout={workouts[day] as WorkoutDay}
                  index={index}
                  isExporting={isExporting}
                  setIsExporting={setIsExporting}
                  allWorkouts={filterWorkoutDays(workouts)}
                  onUpdate={(day, updates) => onUpdate('', day, updates)}
                />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
