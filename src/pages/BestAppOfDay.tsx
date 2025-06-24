import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GenerateWorkoutInput } from "@/components/GenerateWorkoutInput";
import { useToast } from "@/hooks/use-toast";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { LoadingState } from "@/components/ui/loading-states/LoadingState";
import { Card } from "@/components/ui/card";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { animations, spacing } from "@/lib/design-tokens";
import { motion } from "framer-motion";

interface WorkoutDay {
  description: string;
  warmup: string;
  workout: string;
  strength: string;
  notes?: string;
}

type WeeklyWorkouts = Record<string, WorkoutDay>;

export default function BestAppOfDay() {
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [generatedWorkouts, setGeneratedWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleGenerateWorkout = async () => {
    if (!generatePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for workout generation",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke<WeeklyWorkouts>('generate-weekly-workouts', {
        body: { prompt: generatePrompt }
      });

      if (error) throw error;

      if (data) {
        setGeneratedWorkouts(data);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          await saveWorkouts(data);
        } else {
          setShowAuthDialog(true);
        }

        toast({
          title: "Success",
          description: "Your workout plan has been generated!",
        });
      }
    } catch (error) {
      console.error('Error generating workouts:', error);
      toast({
        title: "Error",
        description: "Failed to generate workouts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveWorkouts = async (workoutsToSave: WeeklyWorkouts) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const workoutPromises = Object.entries(workoutsToSave).map(([day, workout]) => {
        return supabase.from('workouts').insert({
          user_id: user.id,
          day,
          warmup: workout.warmup,
          workout: workout.workout,
          notes: workout.notes,
          strength: workout.strength,
          description: workout.description
        });
      });

      await Promise.all(workoutPromises);
      setWorkouts(workoutsToSave);
      toast({
        title: "Success",
        description: "Workouts saved successfully!",
      });
    } catch (error) {
      console.error('Error saving workouts:', error);
      toast({
        title: "Error",
        description: "Failed to save workouts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthDialog(false);
    if (generatedWorkouts) {
      await saveWorkouts(generatedWorkouts);
    }
  };

  const resetWorkouts = () => {
    setWorkouts(null);
    setGeneratePrompt("");
    setGeneratedWorkouts(null);
  };

  return (
    <StandardPageLayout
      title="Best App of the Day"
      description="Generate your personalized weekly workout plan with AI"
      maxWidth="5xl"
    >
      <div className={`space-y-8`}>
        {/* Workout Generation Section */}
        <SectionContainer
          variant={workouts ? "ghost" : "default"}
          spacing="lg"
        >
          <GenerateWorkoutInput
            generatePrompt={generatePrompt}
            setGeneratePrompt={setGeneratePrompt}
            handleGenerateWorkout={handleGenerateWorkout}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            showGenerateInput={showGenerateInput}
            setShowGenerateInput={setShowGenerateInput}
            numberOfDays={7}
            setNumberOfDays={() => {}}
          />
        </SectionContainer>

        {/* Workouts Display Section */}
        {workouts && (
          <motion.div {...animations.slideUp}>
            <SectionContainer spacing="lg">
              <WorkoutDisplay
                workouts={workouts}
                resetWorkouts={resetWorkouts}
                isExporting={isExporting}
                setIsExporting={setIsExporting}
              />
            </SectionContainer>
          </motion.div>
        )}
      </div>

      {/* Auth Dialog */}
      <AuthDialog 
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />

      {/* Loading State Overlay */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <Card variant="elevated" className={spacing.component.xl}>
            <LoadingState
              variant="dots"
              size="lg"
              message="Generating your personalized workout plan..."
            />
          </Card>
        </motion.div>
      )}
    </StandardPageLayout>
  );
}