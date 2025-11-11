import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { Request, Response } from "express";


const db = getFirestore();

interface Exercise {
  category?: string;
  equipment?: string;
  primary_muscles?: string[];
  difficulty?: string;
}

export const getExerciseCategories = onRequest({
  cors: true,
  memory: "256MiB",
}, async (req: Request, res: Response) => {
  
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const exercisesSnapshot = await db.collection('exercises').get();
    const exercises: Exercise[] = exercisesSnapshot.docs.map(doc => doc.data() as Exercise);

    // Extract unique values for each filter category
    const categories = new Set<string>();
    const equipment = new Set<string>();
    const muscles = new Set<string>();
    const levels = new Set<string>();

    exercises.forEach(exercise => {
      if (exercise.category) categories.add(exercise.category);
      if (exercise.equipment) {
        if (Array.isArray(exercise.equipment)) {
          exercise.equipment.forEach(e => equipment.add(e));
        } else {
          equipment.add(exercise.equipment);
        }
      }
      if (exercise.difficulty) levels.add(exercise.difficulty);
      if (exercise.primary_muscles) {
        exercise.primary_muscles.forEach(muscle => muscles.add(muscle));
      }
    });

    // Sort and return as arrays
    res.status(200).json({
      categories: Array.from(categories).sort(),
      equipment: Array.from(equipment).sort(),
      muscles: Array.from(muscles).sort(),
      levels: Array.from(levels).sort()
    });
    
  } catch (error) {
    console.error('Error fetching exercise categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch exercise categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
