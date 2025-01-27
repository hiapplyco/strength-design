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
  setShowGenerateInput: (value: boolean) => void;
  numberOfDays: number;
  setNumberOfDays: (value: number) => void;
}

export function GenerateWorkoutInput(props: GenerateWorkoutInputProps) {
  const { setShowGenerateInput, showGenerateInput } = props;

  return (
    <AnimatePresence>
      <div className="relative w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {!props.isGenerating && !showGenerateInput && (
            <Button
              onClick={() => setShowGenerateInput(true)}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald font-bold text-destructive dark:text-white -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_rgba(255,0,0,1),8px_8px_0px_0px_#C4A052] transition-all duration-200 bg-black hover:bg-black/90 min-w-[300px]"
            >
              Click here
            </Button>
          )}
          {(showGenerateInput || props.isGenerating) && (
            <div className="transition-all duration-300">
              <InputContainer {...props} />
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}