
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { ModernWorkoutGenerator } from "@/components/workout-generator/modern/ModernWorkoutGenerator";
import { WorkoutGeneratorLoading } from "@/components/workout-generator/WorkoutGeneratorLoading";
import { cn } from "@/lib/utils";

const WorkoutGenerator = () => {
  const [pageLoaded, setPageLoaded] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);
  
  const navigate = useNavigate();
  const { session } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    // Mark page as loaded for animations
    setPageLoaded(true);
    
    // Set a small timeout to ensure all components are ready to render
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
      // Add a short delay before showing content to prevent flickering
      setTimeout(() => {
        setShowContent(true);
      }, 50);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!initialLoadComplete) {
    return <WorkoutGeneratorLoading />;
  }

  return (
    <AnimatePresence mode="wait">
      {showContent && (
        <motion.div 
          className={cn("min-h-screen", {
            "bg-gradient-to-br from-background via-background to-secondary/10": theme === "light"
          })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ModernWorkoutGenerator />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkoutGenerator;
