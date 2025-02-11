
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface FileUploadAnimationProps {
  isLoading: boolean;
  fileName: string;
}

export const FileUploadAnimation = ({ isLoading, fileName }: FileUploadAnimationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg max-w-xs"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-primary">Uploading</span>
            <span className="text-xs text-primary/70 truncate">{fileName}</span>
          </div>
        </>
      ) : (
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-3"
        >
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-green-500">Upload Complete</span>
            <span className="text-xs text-green-500/70 truncate">{fileName}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
