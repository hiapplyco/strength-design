
import React from 'react';
import { WorkoutGenerating } from '@/components/ui/loading-states/WorkoutGenerating';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkoutGenerationOverlayProps {
  isVisible: boolean;
}

export const WorkoutGenerationOverlay: React.FC<WorkoutGenerationOverlayProps> = ({
  isVisible
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-background border rounded-lg p-8 shadow-xl max-w-md w-full mx-4"
          >
            <WorkoutGenerating />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
