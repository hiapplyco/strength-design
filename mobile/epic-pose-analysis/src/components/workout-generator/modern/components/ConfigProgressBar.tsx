
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
import { useWorkoutConfig } from '@/contexts/WorkoutConfigContext';
import { motion } from 'framer-motion';

export const ConfigProgressBar: React.FC = () => {
  const { getConfigCompleteness } = useWorkoutConfig();
  const { count, percentage } = getConfigCompleteness();

  return (
    <motion.div 
      className="space-y-3 p-4 bg-card/30 rounded-lg border border-border/30"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-foreground">
            Configuration Progress
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {count}/6 completed
        </span>
      </div>
      
      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Getting started</span>
          <span className="text-green-400 font-medium">{percentage}%</span>
          <span>Ready to generate</span>
        </div>
      </div>
    </motion.div>
  );
};
