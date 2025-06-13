
import type { WeeklyWorkouts } from "@/types/fitness";
import type { GenerateWorkoutParams } from "./types";
import { safelyGetWorkoutProperty } from "@/utils/workout-helpers";

export const generateWorkoutSummary = (workoutData: WeeklyWorkouts, params: GenerateWorkoutParams): string => {
  const cycleCount = params.numberOfCycles;
  const dayCount = params.numberOfDays;
  const focusAreas = new Set<string>();
  
  // Extract workout focus areas from the data
  Object.entries(workoutData).forEach(([key, value]) => {
    if (key === '_meta') return;
    
    if (key.startsWith('cycle')) {
      // Handle new format with cycles
      Object.values(value).forEach(day => {
        const allText = [
          safelyGetWorkoutProperty(day, 'description'), 
          safelyGetWorkoutProperty(day, 'strength'), 
          safelyGetWorkoutProperty(day, 'workout')
        ].join(' ').toLowerCase();
        
        extractFocusAreas(allText, focusAreas);
      });
    } else {
      // Handle legacy format (direct days)
      const allText = [
        safelyGetWorkoutProperty(value, 'description'), 
        safelyGetWorkoutProperty(value, 'strength'), 
        safelyGetWorkoutProperty(value, 'workout')
      ].join(' ').toLowerCase();
      
      extractFocusAreas(allText, focusAreas);
    }
  });
  
  const focusString = Array.from(focusAreas).join(', ');
  
  return `This ${cycleCount}-cycle, ${dayCount}-day ${params.fitnessLevel || ''} workout program focuses on ${focusString || 'overall fitness'} training.`;
};

const extractFocusAreas = (text: string, focusAreas: Set<string>) => {
  if (text.includes('cardio') || text.includes('endurance')) focusAreas.add('cardio');
  if (text.includes('strength') || text.includes('weight')) focusAreas.add('strength');
  if (text.includes('hiit') || text.includes('interval')) focusAreas.add('HIIT');
  if (text.includes('mobility') || text.includes('flexibility')) focusAreas.add('mobility');
  if (text.includes('core') || text.includes('abs')) focusAreas.add('core');
};
