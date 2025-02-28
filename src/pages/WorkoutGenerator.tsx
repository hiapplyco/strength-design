import { useState, useCallback, useEffect } from "react";
import { GeneratorSection } from "@/components/landing/GeneratorSection";
import { triggerConfetti } from "@/utils/confetti";
import type { WeeklyWorkouts } from "@/types/fitness";
import { useNavigate } from "react-router-dom";
import { useWorkoutGeneration } from "@/hooks/useWorkoutGeneration";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_DAYS = 7;
const WORKOUT_STORAGE_KEY = "strength_design_current_workout";

const WorkoutGenerator = () => {
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const [numberOfDays, setNumberOfDays] = useState(DEFAULT_DAYS);
  const { isGenerating, generateWorkout } = useWorkoutGeneration();
  const navigate = useNavigate();
  const { session } = useAuth();
  
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
      triggerConfetti();
      
      localStorage.setItem(
        session?.user?.id 
          ? `${WORKOUT_STORAGE_KEY}_${session.user.id}` 
          : WORKOUT_STORAGE_KEY,
        JSON.stringify(data)
      );
      
      navigate("/workout-results", { state: { workouts: data } });
    }
  };

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
            <div className="text-center mb-16 max-w-full overflow-hidden px-2">
              <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-md px-2 sm:px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-6 max-w-full break-words">
                generate.workout
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto px-2">
                Create personalized workout programs tailored to your needs. Our machine learned models considers your fitness level, available equipment, and specific requirements.
              </p>
            </div>
            
            <GeneratorSection
              generatePrompt={generatePrompt}
              setGeneratePrompt={setGeneratePrompt}
              handleGenerateWorkout={handleGenerateWorkout}
              isGenerating={isGenerating}
              setIsGenerating={() => {}}
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
