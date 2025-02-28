
import { motion } from "framer-motion";
import { Info } from "lucide-react";

export const InputDirections = () => {
  return (
    <motion.div 
      className="w-full max-w-3xl mx-auto mb-8 bg-black/60 border border-primary/30 rounded-lg p-4 text-white shadow-lg"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 text-primary">
          <Info className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-primary">How to Use the Generator</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-white/90">
            <li>Be specific about your goals and limitations</li>
            <li>Include any equipment you have available</li>
            <li>Mention your experience level for more tailored workouts</li>
            <li>Specify any injuries or areas to avoid</li>
          </ul>
          <p className="text-sm font-medium text-white mt-2">
            Program generation typically takes about 30 seconds to complete.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
