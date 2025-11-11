import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Request, Response } from "express";

// Initialize admin if not already
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface UserExercise {
  exerciseId: string;
  name: string;
  category?: string;
  equipment?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  images?: string[];
  notes?: string;
  customSets?: number;
  customReps?: string;
  customRest?: string;
  isFavorite: boolean;
  savedAt: FirebaseFirestore.Timestamp;
}

export const saveUserExercise = onRequest({
  cors: true,
  memory: "256MiB",
}, async (req: Request, res: Response) => {
  
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Get user ID from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { exercise, action = 'save' } = req.body;
    
    if (!exercise || !exercise.exerciseId) {
      res.status(400).json({ error: 'Exercise data is required' });
      return;
    }

    const userExerciseRef = db
      .collection('users')
      .doc(userId)
      .collection('savedExercises')
      .doc(exercise.exerciseId);

    if (action === 'remove') {
      // Remove exercise from user's saved list
      await userExerciseRef.delete();
      
      res.status(200).json({ 
        success: true,
        message: 'Exercise removed from saved list'
      });
    } else {
      // Save or update exercise
      const exerciseData: UserExercise = {
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        category: exercise.category,
        equipment: exercise.equipment,
        primaryMuscles: exercise.primaryMuscles || [],
        secondaryMuscles: exercise.secondaryMuscles || [],
        images: exercise.images || [],
        notes: exercise.notes || '',
        customSets: exercise.customSets,
        customReps: exercise.customReps,
        customRest: exercise.customRest,
        isFavorite: exercise.isFavorite !== undefined ? exercise.isFavorite : true,
        savedAt: admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      };

      await userExerciseRef.set(exerciseData, { merge: true });
      
      res.status(200).json({ 
        success: true,
        message: 'Exercise saved successfully',
        exercise: exerciseData
      });
    }

  } catch (error: any) {
    console.error('Error saving user exercise:', error);
    res.status(500).json({ 
      error: 'Failed to save exercise',
      details: error.message
    });
  }
});

export const getUserExercises = onRequest({
  cors: true,
  memory: "256MiB",
}, async (req: Request, res: Response) => {
  
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Get user ID from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get query parameters
    const { category, muscle, favorites } = req.query;

    // Build query
    let query = db
      .collection('users')
      .doc(userId)
      .collection('savedExercises')
      .orderBy('savedAt', 'desc');

    // Apply filters
    if (favorites === 'true') {
      query = query.where('isFavorite', '==', true);
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    // Execute query
    const snapshot = await query.get();
    const exercises: UserExercise[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      exercises.push({
        ...data,
        exerciseId: doc.id,
      } as UserExercise);
    });

    // Filter by muscle if specified (can't use where clause for array contains)
    let filteredExercises = exercises;
    if (muscle) {
      const muscleLower = (muscle as string).toLowerCase();
      filteredExercises = exercises.filter(exercise => 
        exercise.primaryMuscles?.some(m => m.toLowerCase().includes(muscleLower)) ||
        exercise.secondaryMuscles?.some(m => m.toLowerCase().includes(muscleLower))
      );
    }

    res.status(200).json({
      exercises: filteredExercises,
      total: filteredExercises.length
    });

  } catch (error: any) {
    console.error('Error getting user exercises:', error);
    res.status(500).json({ 
      error: 'Failed to get exercises',
      details: error.message
    });
  }
});