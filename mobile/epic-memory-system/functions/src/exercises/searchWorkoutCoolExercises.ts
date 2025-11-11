import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Request, Response } from "express";

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface WorkoutCoolExercise {
  id: string;
  name: string;
  description?: string;
  introduction?: string;
  slug?: string;
  type?: string[];
  primary_muscles?: string[];
  secondary_muscles?: string[];
  equipment?: string[];
  level?: string;
  video_url?: string;
  video_thumbnail?: string;
  images?: string[];
  instructions?: string[];
}

export const searchWorkoutCoolExercises = onRequest({
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
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Get search parameters
    const { 
      query = '', 
      type = '', 
      equipment = '',
      muscle = '',
      level = '',
      limit = 50,
      offset = 0 
    } = req.body;

    // Build the query filters
    const exercises: WorkoutCoolExercise[] = [];
    
    // Fetch all exercises and filter in memory (Firestore doesn't support array-contains-any with multiple conditions)
    const snapshot = await db.collection('workout_cool_exercises').get();
    
    snapshot.forEach((doc) => {
      const data = doc.data() as WorkoutCoolExercise;
      data.id = doc.id;
      
      let match = true;
      
      // Search by query (name, description)
      if (query) {
        const searchTerm = query.toLowerCase();
        match = match && (
          (data.name?.toLowerCase().includes(searchTerm) ?? false) ||
          (data.description?.toLowerCase().includes(searchTerm) ?? false) ||
          (data.introduction?.toLowerCase().includes(searchTerm) ?? false) ||
          (data.primary_muscles?.some(m => m.toLowerCase().includes(searchTerm)) ?? false) ||
          (data.secondary_muscles?.some(m => m.toLowerCase().includes(searchTerm)) ?? false) ||
          (data.equipment?.some(e => e.toLowerCase().includes(searchTerm)) ?? false)
        );
      }
      
      // Filter by type
      if (type && match) {
        match = match && (data.type?.some(t => t.toLowerCase() === type.toLowerCase()) ?? false);
      }
      
      // Filter by equipment
      if (equipment && match) {
        match = match && (data.equipment?.some(e => e.toLowerCase() === equipment.toLowerCase()) ?? false);
      }
      
      // Filter by muscle
      if (muscle && match) {
        const muscleLower = muscle.toLowerCase();
        match = match && (
          (data.primary_muscles?.some(m => m.toLowerCase().includes(muscleLower)) ?? false) ||
          (data.secondary_muscles?.some(m => m.toLowerCase().includes(muscleLower)) ?? false)
        );
      }
      
      // Filter by level
      if (level && match) {
        match = match && (data.level?.toLowerCase() === level.toLowerCase());
      }
      
      if (match) {
        exercises.push(data);
      }
    });
    
    // Apply pagination
    const paginatedExercises = exercises.slice(offset, offset + limit);
    
    // Format response
    res.status(200).json({
      exercises: paginatedExercises,
      total: exercises.length,
      hasMore: exercises.length > offset + limit
    });
    
  } catch (error) {
    console.error('Error searching workout-cool exercises:', error);
    res.status(500).json({ 
      error: 'Failed to search exercises',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});