import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { Request, Response } from "express";

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface ExercemusExercise {
  id: string;
  name: string;
  description?: string;
  introduction?: string;
  instructions?: string[];
  slug?: string;
  type?: string[];
  category?: string;
  primary_muscles?: string[];
  secondary_muscles?: string[];
  equipment?: string[];
  difficulty?: string;
  mechanics_type?: string;
  video_url?: string;
  video_thumbnail?: string;
  images?: string[];
  variations_on?: string[];
  source?: string;
  attribution?: string;
}

export const searchExercemusExercises = onRequest({
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 30,
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
      category = '', 
      equipment = '',
      muscle = '',
      difficulty = '',
      type = '',
      limit = 50,
      offset = 0 
    } = req.body;

    console.log('🔍 Search request:', { query, category, equipment, muscle, difficulty, type, limit });

    // Build Firestore query - we'll fetch all and filter in memory for flexibility
    const baseCollection = db.collection('exercemus_exercises');
    
    // For now, fetch all exercises and filter in memory since we need complex filtering
    const snapshot = await baseCollection.get();
    
    let exercises: ExercemusExercise[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data() as ExercemusExercise;
      data.id = doc.id;
      
      let match = true;
      
      // Text search across multiple fields
      if (query) {
        const searchTerm = query.toLowerCase();
        match = match && (
          (data.name?.toLowerCase().includes(searchTerm) ?? false) ||
          (data.description?.toLowerCase().includes(searchTerm) ?? false) ||
          (data.introduction?.toLowerCase().includes(searchTerm) ?? false) ||
          (data.primary_muscles?.some(m => m.toLowerCase().includes(searchTerm)) ?? false) ||
          (data.secondary_muscles?.some(m => m.toLowerCase().includes(searchTerm)) ?? false) ||
          (data.equipment?.some(e => e.toLowerCase().includes(searchTerm)) ?? false) ||
          (data.instructions?.some(i => i.toLowerCase().includes(searchTerm)) ?? false)
        );
      }
      
      // Category filter
      if (category && match) {
        match = match && (data.category?.toLowerCase() === category.toLowerCase());
      }
      
      // Type filter
      if (type && match) {
        match = match && (data.type?.some(t => t.toLowerCase() === type.toLowerCase()) ?? false);
      }
      
      // Difficulty filter
      if (difficulty && match) {
        match = match && (data.difficulty?.toLowerCase() === difficulty.toLowerCase());
      }
      
      // Equipment filter
      if (equipment && match) {
        match = match && (data.equipment?.some(e => e.toLowerCase().includes(equipment.toLowerCase())) ?? false);
      }
      
      // Muscle filter (both primary and secondary)
      if (muscle && match) {
        const muscleLower = muscle.toLowerCase();
        match = match && (
          (data.primary_muscles?.some(m => m.toLowerCase().includes(muscleLower)) ?? false) ||
          (data.secondary_muscles?.some(m => m.toLowerCase().includes(muscleLower)) ?? false)
        );
      }
      
      if (match) {
        exercises.push(data);
      }
    });
    
    // Sort by relevance (name matches first, then description matches)
    if (query) {
      const searchTerm = query.toLowerCase();
      exercises.sort((a, b) => {
        const aNameMatch = a.name?.toLowerCase().includes(searchTerm) ? 1 : 0;
        const bNameMatch = b.name?.toLowerCase().includes(searchTerm) ? 1 : 0;
        
        if (aNameMatch !== bNameMatch) {
          return bNameMatch - aNameMatch; // Name matches first
        }
        
        // Then sort alphabetically
        return (a.name || '').localeCompare(b.name || '');
      });
    } else {
      // Sort alphabetically if no search query
      exercises.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    
    // Apply pagination
    const paginatedExercises = exercises.slice(offset, offset + limit);
    
    // Prepare response with metadata
    const response = {
      exercises: paginatedExercises,
      total: exercises.length,
      limit,
      offset,
      hasMore: exercises.length > offset + limit,
      searchParams: {
        query: query || null,
        category: category || null,
        equipment: equipment || null,
        muscle: muscle || null,
        difficulty: difficulty || null,
        type: type || null
      }
    };
    
    console.log(`✅ Search completed: ${paginatedExercises.length}/${exercises.length} exercises returned`);
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error searching exercemus exercises:', error);
    res.status(500).json({ 
      error: 'Failed to search exercises',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});