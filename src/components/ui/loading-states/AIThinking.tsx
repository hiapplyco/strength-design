import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

interface AIThinkingProps {
  message?: string;
  className?: string;
}

export function AIThinking({ message = "AI is thinking...", className }: AIThinkingProps) {
  return (
    <div className={className}>
      <div className="flex items-center space-x-3">
        {/* Bot icon with glow effect */}
        <div className="relative">
          <motion.div
            className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <Bot className="relative w-8 h-8 text-primary" />
        </div>

        {/* Message with typing animation */}
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground">{message}</span>
          
          {/* Animated dots */}
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-1.5 h-1.5 bg-primary rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>

        {/* Sparkles animation */}
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Sparkles className="w-5 h-5 text-primary/60" />
        </motion.div>
      </div>
    </div>
  );
}