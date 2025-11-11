import { onRequest } from "firebase-functions/v2/https";
import { getFirestore, Query } from "firebase-admin/firestore";
import { Request, Response } from "express";

const db = getFirestore();

interface Exercise {
  id: string;
  name: string;
  category?: string;
  equipment?: string | string[];
  force?: string;
  level?: string;
  mechanic?: string;
  primary_muscles?: string[];
  secondary_muscles?: string[];
  instructions?: string[];
  images?: string[];
}

export const searchExercises = onRequest({
  cors: true,
  memory: "256MiB",
}, async (req: Request, res: Response) => {
  
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Get search parameters
    const { 
      query = '', 
      category = '', 
      equipment = '',
      muscle = '',
      limit = 50 
    } = req.body;

    let exercisesQuery: Query = db.collection('exercises');

    if (category) {
      exercisesQuery = exercisesQuery.where('category', '==', category);
    }
    if (equipment) {
      exercisesQuery = exercisesQuery.where('equipment', 'array-contains', equipment);
    }
    if (muscle) {
      exercisesQuery = exercisesQuery.where('primary_muscles', 'array-contains', muscle);
    }

    const snapshot = await exercisesQuery.limit(limit).get();
    let exercises = snapshot.docs.map(doc => doc.data() as Exercise);

    // Full-text search (if query is present)
    if (query) {
      const searchTerm = query.toLowerCase();
      exercises = exercises.filter(exercise => 
        exercise.name?.toLowerCase().includes(searchTerm)
      );
    }

    res.status(200).json({
      exercises: exercises,
      total: exercises.length
    });
    
  } catch (error) {
    console.error('Error searching exercises:', error);
    res.status(500).json({ 
      error: 'Failed to search exercises',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
