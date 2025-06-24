
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { animations, sizes, spacing, typography, radius } from '@/lib/design-tokens';

interface FileUploadAnimationProps {
  isLoading: boolean;
  fileName: string;
  className?: string;
}

export const FileUploadAnimation = ({ isLoading, fileName, className }: FileUploadAnimationProps) => {
  return (
    <motion.div
      initial={animations.slideUp.initial}
      animate={animations.slideUp.animate}
      exit={{ opacity: 0, y: -20 }}
      transition={animations.slideUp.transition}
      className={cn("max-w-xs", className)}
    >
      <Card 
        variant="ghost"
        className={cn(
          "flex items-center",
          spacing.gap.sm,
          spacing.component.sm,
          "bg-primary/10"
        )}
      >
        {isLoading ? (
          <>
            <LoadingIndicator size="medium" variant="primary" />
            <div className="flex flex-col">
              <span className={cn(typography.label, "text-primary")}>
                Uploading
              </span>
              <span className={cn(typography.caption, "text-primary/70 truncate")}>
                {fileName}
              </span>
            </div>
          </>
        ) : (
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={cn("flex items-center", spacing.gap.sm)}
          >
            <CheckCircle2 className={cn(sizes.icon.md, "text-success")} />
            <div className="flex flex-col">
              <span className={cn(typography.label, "text-success")}>
                Upload Complete
              </span>
              <span className={cn(typography.caption, "text-success/70 truncate")}>
                {fileName}
              </span>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};
