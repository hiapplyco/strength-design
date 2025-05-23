
import { useState, useEffect } from "react";
import { GeneratorSection } from "@/components/landing/GeneratorSection";
import { triggerConfetti } from "@/utils/confetti";
import { useNavigate } from "react-router-dom";
import { useWorkoutGeneration } from "@/hooks/useWorkoutGeneration";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { WorkoutGeneratorHeader } from "@/components/workout-generator/WorkoutGeneratorHeader";
import { DebugInfoDisplay } from "@/components/workout-generator/DebugInfoDisplay";
import { WorkoutGeneratorLoading } from "@/components/workout-generator/WorkoutGeneratorLoading";
import { containerVariants } from "@/components/workout-generator/animations";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const DEFAULT_DAYS = 7;
const DEFAULT_CYCLES = 1;
const WORKOUT_STORAGE_KEY = "strength_design_current_workout";

const WorkoutGenerator = () => {
  // State management
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const [numberOfDays, setNumberOfDays] = useState(DEFAULT_DAYS);
  const [numberOfCycles, setNumberOfCycles] = useState(DEFAULT_CYCLES);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);
  
  // Hooks
  const { isGenerating, generateWorkout, debugInfo } = useWorkoutGeneration();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    // Mark page as loaded for animations
    setPageLoaded(true);
    
    // Set a small timeout to ensure all components are ready to render
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
      // Add a short delay before showing content to prevent flickering
      setTimeout(() => {
        setShowContent(true);
      }, 50);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handler for workout generation
  const handleGenerateWorkout = async (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: any[];
    fitnessLevel: string;
    prescribedExercises: string;
    injuries?: string;
  }) => {
    try {
      console.log("Sending all inputs to generate workout:", params);
      
      const data = await generateWorkout({
        ...params,
        numberOfDays,
        numberOfCycles
      });

      if (data) {
        // Visual feedback for successful generation
        triggerConfetti();
        
        // Save workout to localStorage with user-specific key if available
        const storageKey = session?.user?.id 
          ? `${WORKOUT_STORAGE_KEY}_${session.user.id}` 
          : WORKOUT_STORAGE_KEY;
          
        localStorage.setItem(storageKey, JSON.stringify(data));
        
        // Navigate to results page with workout data
        navigate("/workout-results", { state: { workouts: data } });
        
        // Log the input data that was sent to generate the workout
        if (data._meta?.inputs) {
          console.log("Inputs used for workout generation:", data._meta.inputs);
        }
      }
    } catch (error) {
      console.error("Error generating workout:", error);
    }
  };

  if (!initialLoadComplete) {
    return <WorkoutGeneratorLoading />;
  }

  return (
    <AnimatePresence mode="wait">
      {showContent && (
        <motion.div 
          className={cn("min-h-screen bg-background", {
            "bg-gradient-to-br from-background via-background to-secondary/10": theme === "light"
          })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >            
            <div className="relative">
              <motion.div 
                className="container mx-auto px-4 max-w-[1200px] pt-24 pb-12"
                variants={containerVariants}
                initial="hidden"
                animate={pageLoaded ? "visible" : "hidden"}
              >
                {/* Page header section */}
                <WorkoutGeneratorHeader />
                
                {/* Generator form section */}
                <motion.div variants={containerVariants}>
                  <GeneratorSection
                    generatePrompt={generatePrompt}
                    setGeneratePrompt={setGeneratePrompt}
                    handleGenerateWorkout={handleGenerateWorkout}
                    isGenerating={isGenerating}
                    showGenerateInput={showGenerateInput}
                    setShowGenerateInput={setShowGenerateInput}
                    numberOfDays={numberOfDays}
                    setNumberOfDays={setNumberOfDays}
                    numberOfCycles={numberOfCycles}
                    setNumberOfCycles={setNumberOfCycles}
                  />
                </motion.div>
              
                {/* Optional debug info display for development/testing */}
                <DebugInfoDisplay debugInfo={debugInfo} />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkoutGenerator;
