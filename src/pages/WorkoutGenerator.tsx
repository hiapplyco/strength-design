
import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { triggerConfetti } from "@/utils/confetti";
import type { WeeklyWorkouts } from "@/types/fitness";
import { useNavigate } from "react-router-dom";
import { useWorkoutGeneration } from "@/hooks/useWorkoutGeneration";
import { Skeleton } from "@/components/ui/skeleton";
import { PresetSelector, WORKOUT_PRESETS } from "@/components/workout-generator/PresetSelector";
import { RecentWorkouts } from "@/components/workout-generator/RecentWorkouts";

// Lazy-loaded components
const GeneratorSection = lazy(() => import("@/components/landing/GeneratorSection"));
const WorkoutDisplay = lazy(() => import("@/components/landing/WorkoutDisplay"));

const DEFAULT_DAYS = 7;
const MIN_DAYS = 1;
const MAX_DAYS = 14;

const WorkoutGenerator = () => {
  // Main state management
  const [workouts, setWorkouts] = useState<WeeklyWorkouts | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const [numberOfDays, setNumberOfDays] = useState(DEFAULT_DAYS);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [recentWorkouts, setRecentWorkouts] = useState<Array<{id: string, name: string, date: string}>>(() => {
    try {
      const saved = localStorage.getItem('recentWorkouts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // API integration
  const { isGenerating, generateWorkout, error: generationError } = useWorkoutGeneration();
  const navigate = useNavigate();

  // Memoize error message to prevent unnecessary re-renders
  const errorMessage = useMemo(() => {
    if (generationError) {
      return `Error: ${generationError}`;
    }
    return Object.values(formErrors).join(", ");
  }, [generationError, formErrors]);

  // Reset function with additional cleanup
  const resetWorkouts = useCallback(() => {
    setWorkouts(null);
    setShowGenerateInput(true);
    setSelectedPreset(null);
    setFormErrors({});
  }, []);

  // Apply a preset configuration
  const applyPreset = useCallback((preset: typeof WORKOUT_PRESETS[0]) => {
    setNumberOfDays(preset.days);
    setGeneratePrompt(preset.prompt);
    setSelectedPreset(preset.name);
  }, []);

  // Form validation
  const validateForm = useCallback((params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: any[];
    fitnessLevel: string;
  }) => {
    const errors: Record<string, string> = {};
    
    if (!params.prompt && !selectedPreset) {
      errors.prompt = "Please enter workout requirements or select a preset";
    }
    
    if (!params.fitnessLevel) {
      errors.fitnessLevel = "Please select a fitness level";
    }
    
    if (numberOfDays < MIN_DAYS || numberOfDays > MAX_DAYS) {
      errors.days = `Number of days must be between ${MIN_DAYS} and ${MAX_DAYS}`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [numberOfDays, selectedPreset]);

  // Save workout to history
  const saveToHistory = useCallback((workout: WeeklyWorkouts) => {
    const workoutId = `workout-${Date.now()}`;
    const newWorkout = {
      id: workoutId,
      name: workout.metadata?.goals?.[0] || "Custom Workout",
      date: new Date().toLocaleDateString()
    };
    
    const updatedWorkouts = [newWorkout, ...recentWorkouts].slice(0, 10);
    setRecentWorkouts(updatedWorkouts);
    
    try {
      localStorage.setItem('recentWorkouts', JSON.stringify(updatedWorkouts));
      localStorage.setItem(workoutId, JSON.stringify(workout));
    } catch (e) {
      console.error("Failed to save workout to history", e);
    }
  }, [recentWorkouts]);

  // Handle workout generation
  const handleGenerateWorkout = async (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: any[];
    fitnessLevel: string;
    prescribedExercises: string;
  }) => {
    if (!validateForm(params)) {
      return;
    }
    
    try {
      const data = await generateWorkout({
        ...params,
        numberOfDays
      });
      
      if (data) {
        setWorkouts(data);
        setShowGenerateInput(false);
        saveToHistory(data);
        triggerConfetti();
      }
    } catch (err) {
      console.error("Failed to generate workout", err);
    }
  };

  // Loading fallback component
  const LoadingFallback = () => (
    <div className="p-8 w-full">
      <Skeleton className="h-12 w-3/4 mb-4" />
      <Skeleton className="h-32 w-full mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );

  // Main render logic with conditional component display
  if (workouts) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <WorkoutDisplay
          workouts={workouts}
          resetWorkouts={resetWorkouts}
          isExporting={isExporting}
          setIsExporting={setIsExporting}
        />
      </Suspense>
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
          <div className="container mx-auto px-4 max-w-[1200px] pt-16 md:pt-24">
            <div className="text-center mb-8 md:mb-16 max-w-full overflow-hidden px-2">
              <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-2 sm:px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-6 max-w-full break-words">
                generate.workout
              </h1>
              <p className="text-xl text-white/80 max-w-3xl mx-auto px-2">
                Create personalized workout programs tailored to your needs. Our AI considers your fitness level, available equipment, and specific requirements.
              </p>
            </div>
            
            {/* Preset selection */}
            <PresetSelector
              selectedPreset={selectedPreset}
              onPresetSelect={applyPreset}
            />

            {/* Recent workouts section */}
            <RecentWorkouts
              recentWorkouts={recentWorkouts}
              onWorkoutSelect={(workout) => {
                setWorkouts(workout);
                setShowGenerateInput(false);
              }}
            />
            
            {/* Error display */}
            {errorMessage && (
              <div className="mb-6 p-3 bg-red-500/20 border border-red-500 rounded-lg text-white">
                {errorMessage}
              </div>
            )}
            
            {/* Main generator section */}
            <Suspense fallback={<LoadingFallback />}>
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
                selectedPreset={selectedPreset}
                formErrors={formErrors}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutGenerator;
