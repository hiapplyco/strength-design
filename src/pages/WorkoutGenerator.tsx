
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { ModernWorkoutGenerator } from "@/components/workout-generator/modern/ModernWorkoutGenerator";
import { WorkoutChatLayout } from "@/components/workout-generator/chat/WorkoutChatLayout";
import { WorkoutGeneratorLoading } from "@/components/workout-generator/WorkoutGeneratorLoading";
import { WorkoutConfigProvider } from "@/contexts/WorkoutConfigContext";
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type GeneratorMode = 'chat' | 'form';

const WorkoutGenerator = () => {
  const [pageLoaded, setPageLoaded] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [mode, setMode] = useState<GeneratorMode>('chat');
  
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
    <WorkoutConfigProvider>
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
            {/* Mode Toggle */}
            <div className="container mx-auto px-4 py-4">
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                  <Button
                    variant={mode === 'chat' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMode('chat')}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    AI Chat
                  </Button>
                  <Button
                    variant={mode === 'form' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMode('form')}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Form Builder
                  </Button>
                </div>
              </div>

              {/* Content based on mode */}
              <AnimatePresence mode="wait">
                {mode === 'chat' ? (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <WorkoutChatLayout />
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ModernWorkoutGenerator />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </WorkoutConfigProvider>
  );
};

export default WorkoutGenerator;
