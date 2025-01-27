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
  const { setShowGenerateInput } = props;

  return (
    <AnimatePresence>
      {!props.isGenerating && (
        <div className="relative w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Button
              onClick={() => setShowGenerateInput(true)}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-64 h-64 bg-destructive hover:bg-destructive/90 border-4 border-black text-black hover:text-black font-bold text-2xl z-10"
            >
              Click Here!
            </Button>
            <div className={`transition-all duration-300 ${props.isGenerating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <InputContainer {...props} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}