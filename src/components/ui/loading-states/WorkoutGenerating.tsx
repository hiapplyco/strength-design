import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Sparkles, Brain, Timer } from 'lucide-react';

const loadingMessages = [
  { icon: Brain, text: "Analyzing your fitness profile..." },
  { icon: Sparkles, text: "Crafting personalized exercises..." },
  { icon: Dumbbell, text: "Optimizing workout structure..." },
  { icon: Timer, text: "Calculating rest periods..." },
  { icon: Sparkles, text: "Adding final touches..." }
];

interface WorkoutGeneratingProps {
  className?: string;
}

export function WorkoutGenerating({ className }: WorkoutGeneratingProps) {
  const [messageIndex, setMessageIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const currentMessage = loadingMessages[messageIndex];
  const Icon = currentMessage.icon;

  return (
    <div className={className}>
      <div className="flex flex-col items-center space-y-8">
        {/* Main animation container */}
        <div className="relative w-32 h-32">
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary/20"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full" />
          </motion.div>

          {/* Inner pulsing circle */}
          <motion.div
            className="absolute inset-4 rounded-full bg-primary/10"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={messageIndex}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Icon className="w-12 h-12 text-primary" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Loading message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            className="text-center text-muted-foreground font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            {currentMessage.text}
          </motion.p>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex space-x-2">
          {loadingMessages.map((_, index) => (
            <motion.div
              key={index}
              className="w-2 h-2 rounded-full bg-primary/30"
              animate={{
                backgroundColor: index === messageIndex ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)",
                scale: index === messageIndex ? 1.5 : 1
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}