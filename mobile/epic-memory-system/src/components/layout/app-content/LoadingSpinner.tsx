
import { motion } from "framer-motion";

export const LoadingSpinner = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center"
    >
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="rounded-full h-16 w-16 border-b-2 border-t-2 border-primary"
      />
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-white/80 text-sm"
      >
        Loading application...
      </motion.p>
    </motion.div>
  </div>
);
