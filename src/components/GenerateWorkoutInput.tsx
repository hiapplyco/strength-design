
import { InputContainer } from "./workout-generator/InputContainer";
import type { Exercise } from "./exercise-search/types";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface GenerateWorkoutInputProps {
  generatePrompt: string;
  setGeneratePrompt: (value: string) => void;
  handleGenerateWorkout: (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: Exercise[];
    fitnessLevel: string;
    prescribedExercises: string;
  }) => Promise<void>;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  showGenerateInput: boolean;
  setShowGenerateInput: (value: boolean) => void;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
}

export function GenerateWorkoutInput(props: GenerateWorkoutInputProps) {
  const { setShowGenerateInput, showGenerateInput } = props;

  return (
    <AnimatePresence mode="wait">
      <div className="relative w-full max-w-full mx-auto px-1 sm:px-2">
        {!props.isGenerating && !showGenerateInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center py-8 sm:py-12"
          >
            <Button
              onClick={() => setShowGenerateInput(true)}
              className="text-2xl sm:text-3xl md:text-4xl font-oswald font-bold text-black dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-primary rounded-md px-3 py-2 sm:px-4 sm:py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_#C4A052,12px_12px_0px_0px_#B8860B] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_#C4A052,8px_8px_0px_0px_#B8860B] transition-all duration-200 bg-gradient-to-r from-[#C4A052] to-[#DAA520] min-w-[220px] sm:min-w-[280px]"
            >
              Click here
            </Button>
          </motion.div>
        )}
        
        {(showGenerateInput || props.isGenerating) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <InputContainer {...props} />
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
