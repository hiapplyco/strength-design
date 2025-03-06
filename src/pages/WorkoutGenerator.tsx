import { useState, useEffect } from "react";
import { GeneratorSection } from "@/components/landing/GeneratorSection";
import { triggerConfetti } from "@/utils/confetti";
import { useNavigate, Link } from "react-router-dom";
import { useWorkoutGeneration } from "@/hooks/useWorkoutGeneration";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const DEFAULT_DAYS = 7;
const WORKOUT_STORAGE_KEY = "strength_design_current_workout";

const WorkoutGenerator = () => {
  // State management
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [showGenerateInput, setShowGenerateInput] = useState(true);
  const [numberOfDays, setNumberOfDays] = useState(DEFAULT_DAYS);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);
  
  // Hooks
  const { isGenerating, generateWorkout } = useWorkoutGeneration();
  const navigate = useNavigate();
  const { session } = useAuth();

  // Animation variants for elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.5
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

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
  }) => {
    try {
      const data = await generateWorkout({
        ...params,
        numberOfDays
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
      }
    } catch (error) {
      console.error("Error generating workout:", error);
    }
  };

  if (!initialLoadComplete) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingIndicator>
          <span className="text-white/80">Loading workout generator...</span>
        </LoadingIndicator>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {showContent && (
        <motion.div 
          className="min-h-screen bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="relative bg-cover bg-center bg-fixed"
            style={{
              backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            
            <div className="relative">
              <motion.div 
                className="container mx-auto px-4 max-w-[1200px] pt-24 pb-12"
                variants={containerVariants}
                initial="hidden"
                animate={pageLoaded ? "visible" : "hidden"}
              >
                {/* Page header section */}
                <motion.div 
                  className="text-center mb-12 max-w-full overflow-hidden px-2"
                  variants={itemVariants}
                >
                  <div className="flex items-center justify-center mb-6">
                    <Dumbbell className="h-10 w-10 text-destructive mr-3 animate-pulse" />
                    <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-md px-2 sm:px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-0 max-w-full break-words">
                      generate.workout
                    </h1>
                  </div>
                  
                  <motion.p 
                    className="text-xl text-white/80 max-w-3xl mx-auto px-2"
                    variants={itemVariants}
                  >
                    Create personalized workout programs tailored to your needs. Our machine learned models considers your fitness level, available equipment, and specific requirements.
                  </motion.p>
                  
                  <motion.div 
                    className="flex items-center justify-center mt-6 text-white/60 text-sm"
                    variants={itemVariants}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center cursor-help">
                            <Info className="h-4 w-4 mr-2" />
                            <span>Program generation typically takes about 30 seconds</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Our AI generates detailed, personalized workout plans based on your inputs. The process involves complex calculations to ensure optimal training balance.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                </motion.div>
                
                {/* Generator form section */}
                <motion.div variants={itemVariants}>
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
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkoutGenerator;
