
import { useState, useCallback } from 'react';
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

  const onWorkoutComplete = useCallback(() => {
    // Get a random message different from the last one
    let messageIndex = Math.floor(Math.random() * motivationalMessages.length);
    while (messageIndex === lastMessageIndex && motivationalMessages.length > 1) {
      messageIndex = Math.floor(Math.random() * motivationalMessages.length);
    }
    
    setLastMessageIndex(messageIndex);
    
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
