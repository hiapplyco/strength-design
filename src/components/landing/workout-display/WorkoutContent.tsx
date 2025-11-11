
import { useState, useEffect } from "react";
import { WorkoutDayCard } from "./WorkoutDayCard";
import { WorkoutDisplayHeader } from "./WorkoutDisplayHeader";
import type { WeeklyWorkouts, WorkoutDay, WorkoutMeta, WorkoutCycle } from "@/types/fitness";
import { isWorkoutDay, isWorkoutCycle } from "@/types/fitness";
import { formatAllWorkouts, formatWorkoutToMarkdown } from "@/utils/workout-formatting";
import { filterWorkoutDays } from "@/utils/workout-helpers";
import { functions } from "@/lib/firebase/config";
import { httpsCallable } from "firebase/functions";
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

      const generateWorkoutSummary = httpsCallable<
        { workouts: Record<string, any> },
        { summary: string }
      >(functions, 'generateWorkoutSummary');

      const result = await generateWorkoutSummary({
        workouts: workoutDataForSummary
      });

      if (result.data?.summary) {
        onUpdate('_meta', '_meta', {
          summary: result.data.summary
        } as Partial<WorkoutMeta>);

        setSummaryGenerated(true);
        toast({
          title: "Summary Generated",
          description: "AI has created a summary of your workout program.",
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
    <div className="bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl border border-border/20 overflow-hidden">
      {/* Enhanced Title Section */}
      <div className="text-center mb-8 sm:mb-12 space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-oswald font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-primary/80 tracking-tight leading-none">
            {workoutTitle}
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-primary/60 mx-auto rounded-full"></div>
        </div>
        
        <div className="mt-6 relative">
          {workoutSummary ? (
            <div className="bg-card/60 backdrop-blur-sm rounded-lg p-6 border border-border/30 max-w-4xl mx-auto">
              <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-medium">
                {workoutSummary}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4">
              {isGeneratingSummary ? (
                <div className="flex items-center gap-3 bg-card/60 backdrop-blur-sm rounded-lg p-4 border border-border/30">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm font-medium">Generating AI summary...</p>
                </div>
              ) : (
                <Button 
                  onClick={generateGeminiSummary} 
                  variant="outline" 
                  size="lg" 
                  className="flex items-center gap-2 bg-card/60 backdrop-blur-sm hover:bg-card/80 border-primary/30 hover:border-primary/60 transition-all duration-200 px-6 py-3"
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                  Generate AI Summary
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

      {/* Enhanced Cycle Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mt-8 sm:mt-12"
      >
        {/* Enhanced Tab List */}
        {(cycleKeys.length > 1 || (cycleKeys.length === 1 && legacyWorkoutDays.length > 0)) && (
          <div className="mb-8">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full h-auto p-1 bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl">
              {cycleKeys.map((cycleKey) => (
                <TabsTrigger 
                  key={cycleKey} 
                  value={cycleKey} 
                  className="text-sm sm:text-base font-medium py-3 px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200"
                >
                  {cycleKey.charAt(0).toUpperCase() + cycleKey.slice(1)}
                </TabsTrigger>
              ))}
              {legacyWorkoutDays.length > 0 && (
                <TabsTrigger 
                  value="legacy" 
                  className="text-sm sm:text-base font-medium py-3 px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200"
                >
                  Legacy Workouts
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        )}

        {/* Enhanced Cycle Content */}
        {cycleKeys.map((cycleKey) => (
          <TabsContent key={cycleKey} value={cycleKey} className="space-y-8 sm:space-y-12">
            <div className="grid gap-6 sm:gap-8 md:gap-10">
              {isWorkoutCycle(workouts[cycleKey]) && 
               Object.entries(workouts[cycleKey] as WorkoutCycle).map(([day, workout], index) => (
                <div key={`${cycleKey}-${day}`} className="relative">
                  <WorkoutDayCard 
                    day={day} 
                    workout={workout as WorkoutDay}
                    index={index}
                    isExporting={isExporting}
                    setIsExporting={setIsExporting}
                    allWorkouts={(workouts[cycleKey] as WorkoutCycle)}
                    onUpdate={(day, updates) => onUpdate(cycleKey, day, updates)}
                    cycleNumber={parseInt(cycleKey.replace('cycle', '')) || 1}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
        
        {/* Enhanced Legacy Content */}
        {legacyWorkoutDays.length > 0 && (
          <TabsContent value="legacy" className="space-y-8 sm:space-y-12">
            <div className="grid gap-6 sm:gap-8 md:gap-10">
              {legacyWorkoutDays.map((day, index) => (
                <div key={day} className="relative">
                  <WorkoutDayCard 
                    day={day} 
                    workout={workouts[day] as WorkoutDay}
                    index={index}
                    isExporting={isExporting}
                    setIsExporting={setIsExporting}
                    allWorkouts={filterWorkoutDays(workouts)}
                    onUpdate={(day, updates) => onUpdate('', day, updates)}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
