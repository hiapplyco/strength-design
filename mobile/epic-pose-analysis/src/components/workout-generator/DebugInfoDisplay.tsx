
import { motion } from "framer-motion";
import { itemVariants } from "./animations";

interface DebugInfoDisplayProps {
  debugInfo: any;
}

export function DebugInfoDisplay({ debugInfo }: DebugInfoDisplayProps) {
  if (!debugInfo) return null;
  
  return (
    <motion.div 
      variants={itemVariants}
      className="container mx-auto mt-4 p-4 bg-black/50 border border-primary/20 rounded-md"
    >
      <h3 className="text-white/80 text-sm font-mono">Workout Generation Debug Info:</h3>
      <pre className="text-white/60 text-xs mt-2 bg-black/50 p-3 rounded overflow-auto max-h-[200px]">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </motion.div>
  );
}
