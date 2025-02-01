import { useState, useCallback } from "react";
import { GeneratorSection } from "@/components/landing/GeneratorSection";
import { triggerConfetti } from "@/utils/confetti";
import type { WeeklyWorkouts } from "@/types/fitness";
import { WorkoutDisplay } from "@/components/landing/WorkoutDisplay";
import { useNavigate } from "react-router-dom";
import { useWorkoutGeneration } from "@/hooks/useWorkoutGeneration";

const DEFAULT_DAYS = 7;

const WorkoutGenerator = () => {
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const [numberOfDays, setNumberOfDays] = useState(DEFAULT_DAYS);
  const { isGenerating, generateWorkout } = useWorkoutGeneration();
  const navigate = useNavigate();

  const resetWorkouts = useCallback(() => {
    setWorkouts(null);
    setShowGenerateInput(true);
  }, []);

  const handleGenerateWorkout = async (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: any[];
    fitnessLevel: string;
    prescribedExercises: string;
  }) => {
    const data = await generateWorkout({
      ...params,
      numberOfDays
    });

    if (data) {
      setWorkouts(data);
      setShowGenerateInput(false);
      triggerConfetti();
    }
  };

  if (workouts) {
    return (
      <WorkoutDisplay
        workouts={workouts}
        resetWorkouts={resetWorkouts}
        isExporting={isExporting}
        setIsExporting={setIsExporting}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div 
        className="relative bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        <div className="relative">
          <div className="container mx-auto px-4 max-w-[1200px] pt-24">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-oswald text-accent mb-6">
                Workout Generator
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Create personalized workout programs tailored to your needs. Our AI-powered generator considers your fitness level, available equipment, and specific requirements.
              </p>
            </div>
            
            <GeneratorSection
              generatePrompt={generatePrompt}
              setGeneratePrompt={setGeneratePrompt}
              handleGenerateWorkout={handleGenerateWorkout}
              isGenerating={isGenerating}
              setIsGenerating={() => {}} // This is now handled by the hook
              showGenerateInput={showGenerateInput}
              setShowGenerateInput={setShowGenerateInput}
              numberOfDays={numberOfDays}
              setNumberOfDays={setNumberOfDays}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutGenerator;