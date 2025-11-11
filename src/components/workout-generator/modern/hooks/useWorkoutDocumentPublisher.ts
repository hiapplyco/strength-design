import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSmartToast } from '@/hooks/useSmartToast';
import type { WeeklyWorkouts, WorkoutDay, WorkoutCycle } from '@/types/fitness';
import { isWorkoutCycle, isWorkoutDay } from '@/types/fitness';

export const useWorkoutDocumentPublisher = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  const navigate = useNavigate();
  const { success, error } = useSmartToast();

  const formatWorkoutToDocument = (workouts: WeeklyWorkouts): string => {
    let documentContent = '';
    
    // Add title
    const workoutTitle = workouts._meta?.title || 'Your Custom Workout Plan';
    documentContent += `<h1>${workoutTitle}</h1>\n\n`;
    
    // Add summary if available
    if (workouts._meta?.summary) {
      documentContent += `<p class="lead">${workouts._meta.summary}</p>\n\n`;
    }
    
    // Process workout data
    Object.entries(workouts)
      .filter(([key]) => key !== '_meta')
      .forEach(([key, value]) => {
        if (isWorkoutCycle(value)) {
          // Handle cycle structure
          const cycleTitle = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          documentContent += `<h2>🔄 ${cycleTitle}</h2>\n\n`;
          
          // Process days within cycle
          Object.entries(value as WorkoutCycle)
            .filter(([dayKey, dayValue]) => isWorkoutDay(dayValue))
            .forEach(([dayKey, dayValue]) => {
              documentContent += formatWorkoutDay(dayKey, dayValue as WorkoutDay);
            });
        } else if (isWorkoutDay(value)) {
          // Handle direct workout days
          documentContent += formatWorkoutDay(key, value as WorkoutDay);
        }
      });
    
    return documentContent;
  };

  const formatWorkoutDay = (dayKey: string, workout: WorkoutDay): string => {
    const formattedDay = dayKey.replace(/day(\d+)/, 'Day $1').replace(/([A-Z])/g, ' $1').trim();
    let dayContent = `<h3>📅 ${formattedDay}</h3>\n`;
    
    if (workout.description) {
      dayContent += `<div class="workout-focus">\n<h4>🎯 Focus</h4>\n<p>${workout.description}</p>\n</div>\n\n`;
    }
    
    if (workout.warmup) {
      dayContent += `<div class="workout-section">\n<h4>🏃‍♂️ Warmup</h4>\n<div class="exercise-content">${formatExerciseContent(workout.warmup)}</div>\n</div>\n\n`;
    }
    
    if (workout.strength) {
      dayContent += `<div class="workout-section">\n<h4>💪 Strength Training</h4>\n<div class="exercise-content">${formatExerciseContent(workout.strength)}</div>\n</div>\n\n`;
    }
    
    if (workout.workout) {
      dayContent += `<div class="workout-section">\n<h4>🏋️‍♂️ Main Workout</h4>\n<div class="exercise-content">${formatExerciseContent(workout.workout)}</div>\n</div>\n\n`;
    }
    
    if (workout.notes) {
      dayContent += `<div class="workout-notes">\n<h4>📝 Notes</h4>\n<p>${workout.notes}</p>\n</div>\n\n`;
    }
    
    dayContent += '<hr class="workout-divider"/>\n\n';
    
    return dayContent;
  };

  const formatExerciseContent = (content: string): string => {
    // Convert bullet points and structure the content better
    return content
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return `<li>${trimmed.substring(2)}</li>`;
        } else if (trimmed.includes(':') && !trimmed.includes('minutes')) {
          return `<strong>${trimmed}</strong>`;
        }
        return trimmed ? `<p>${trimmed}</p>` : '';
      })
      .filter(line => line)
      .join('\n');
  };

  const publishToDocument = async (workouts: WeeklyWorkouts) => {
    setIsPublishing(true);
    
    try {
      // Format the workout data
      const documentContent = formatWorkoutToDocument(workouts);
      
      // Navigate to document editor with the formatted content
      navigate('/document-editor', {
        state: {
          content: documentContent
        }
      });
      
      success('Workout published to document editor!');
    } catch (err) {
      console.error('Error publishing workout:', err);
      error(err as Error, 'Document Publishing');
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    publishToDocument,
    isPublishing
  };
};
