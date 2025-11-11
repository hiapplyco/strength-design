
import { useState, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

const motivationalMessages = [
  "Great workout generated! Time to get stronger! 💪",
  "Your personalized program is ready - let's crush those goals! 🔥",
  "New workout unlocked! Ready to level up your fitness? 🚀",
  "Training plan generated! Every rep counts towards your success! ⭐",
  "Your fitness journey continues! This workout will push you forward! 💯"
];

export const useMotivationalMessages = () => {
  const [lastMessageIndex, setLastMessageIndex] = useState(-1);
  const lastToastTime = useRef<number>(0);
  const COOLDOWN_PERIOD = 5000; // 5 seconds cooldown

  const onWorkoutComplete = useCallback(() => {
    const now = Date.now();
    
    // Prevent spam by checking cooldown period
    if (now - lastToastTime.current < COOLDOWN_PERIOD) {
      return;
    }
    
    // Get a random message different from the last one
    let messageIndex = Math.floor(Math.random() * motivationalMessages.length);
    while (messageIndex === lastMessageIndex && motivationalMessages.length > 1) {
      messageIndex = Math.floor(Math.random() * motivationalMessages.length);
    }
    
    setLastMessageIndex(messageIndex);
    lastToastTime.current = now;
    
    toast({
      title: "Workout Generated!",
      description: motivationalMessages[messageIndex],
      duration: 4000,
    });
  }, [lastMessageIndex]);

  return {
    onWorkoutComplete
  };
};
