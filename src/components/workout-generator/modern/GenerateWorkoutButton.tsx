
import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';

interface GenerateWorkoutButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export const GenerateWorkoutButton: React.FC<GenerateWorkoutButtonProps> = ({
  onGenerate,
  isGenerating
}) => {
  const { getConfigCompleteness } = useWorkoutConfig();
  const { count } = getConfigCompleteness();
  
  // Only show if at least one configuration field is filled
  const shouldShow = count > 0;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="sticky bottom-6 z-10"
        >
          <div className="flex justify-center">
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              size="lg"
              className={`font-semibold px-8 py-3 rounded-full shadow-lg transition-all duration-200 ${
                isGenerating 
                  ? 'bg-primary/70 text-primary-foreground cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Your Workout...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Generate Workout
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
