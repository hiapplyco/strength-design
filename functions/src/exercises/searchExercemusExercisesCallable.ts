import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

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

// Callable function for searching exercemus exercises
export const searchExercemusExercisesCallable = onCall({
  cors: true,
  maxInstances: 10,
}, async (request) => {
  
  try {
    // Get search parameters from request data
    const { 
      query = '', 
      category = '', 
      equipment = '',
      muscle = '',
      difficulty = '',
      type = '',
      limit = 50,
      offset = 0 
    } = request.data;

    console.log('🔍 Search request:', { query, category, equipment, muscle, difficulty, type, limit });

    // Build Firestore query - we'll fetch all and filter in memory for flexibility
    const baseCollection = db.collection('exercises');
    
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
        // Ensure arrays are actually arrays
        const primaryMuscles = Array.isArray(data.primary_muscles) ? data.primary_muscles : 
          (typeof data.primary_muscles === 'string' && data.primary_muscles ? [data.primary_muscles] : []);
        const secondaryMuscles = Array.isArray(data.secondary_muscles) ? data.secondary_muscles :
          (typeof data.secondary_muscles === 'string' && data.secondary_muscles ? [data.secondary_muscles] : []);
        const equipmentList = Array.isArray(data.equipment) ? data.equipment :
          (typeof data.equipment === 'string' && data.equipment ? [data.equipment] : []);
        const instructionsList = Array.isArray(data.instructions) ? data.instructions :
          (typeof data.instructions === 'string' && data.instructions ? [data.instructions] : []);
        
        match = match && (
          (data.name?.toLowerCase().includes(searchTerm) ?? false) ||
          (data.description?.toLowerCase().includes(searchTerm) ?? false) ||
          (data.introduction?.toLowerCase().includes(searchTerm) ?? false) ||
          (primaryMuscles.some(m => m.toLowerCase().includes(searchTerm))) ||
          (secondaryMuscles.some(m => m.toLowerCase().includes(searchTerm))) ||
          (equipmentList.some(e => e.toLowerCase().includes(searchTerm))) ||
          (instructionsList.some(i => i.toLowerCase().includes(searchTerm)))
        );
      }
      
      // Category filter
      if (category && match) {
        match = match && (data.category?.toLowerCase() === category.toLowerCase());
      }
      
      // Type filter
      if (type && match) {
        const typeList = Array.isArray(data.type) ? data.type :
          (typeof data.type === 'string' && data.type ? [data.type] : []);
        match = match && (typeList.some(t => t.toLowerCase() === type.toLowerCase()));
      }
      
      // Difficulty filter
      if (difficulty && match) {
        match = match && (data.difficulty?.toLowerCase() === difficulty.toLowerCase());
      }
      
      // Equipment filter
      if (equipment && match) {
        const equipmentList = Array.isArray(data.equipment) ? data.equipment :
          (typeof data.equipment === 'string' && data.equipment ? [data.equipment] : []);
        match = match && (equipmentList.some(e => e.toLowerCase().includes(equipment.toLowerCase())));
      }
      
      // Muscle filter (both primary and secondary)
      if (muscle && match) {
        const muscleLower = muscle.toLowerCase();
        const primaryMuscles = Array.isArray(data.primary_muscles) ? data.primary_muscles :
          (typeof data.primary_muscles === 'string' && data.primary_muscles ? [data.primary_muscles] : []);
        const secondaryMuscles = Array.isArray(data.secondary_muscles) ? data.secondary_muscles :
          (typeof data.secondary_muscles === 'string' && data.secondary_muscles ? [data.secondary_muscles] : []);
        match = match && (
          (primaryMuscles.some(m => m.toLowerCase().includes(muscleLower))) ||
          (secondaryMuscles.some(m => m.toLowerCase().includes(muscleLower)))
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
    
    // Clean up image URLs - remove placeholder.com URLs which cause DNS errors
    const cleanedExercises = paginatedExercises.map(exercise => {
      // Check if images exist and filter out problematic URLs
      const hasValidImages = exercise.images && 
        exercise.images.length > 0 && 
        !exercise.images[0].includes('placeholder.com') &&
        !exercise.images[0].includes('example.com');
      
      return {
        ...exercise,
        // Remove images if they're placeholder URLs
        images: hasValidImages ? exercise.images : []
      };
    });
    
    // Return response in the format expected by callable functions
    // The data property is automatically added by Firebase Functions v2
    return {
      exercises: cleanedExercises,
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
    
  } catch (error) {
    console.error('❌ Error searching exercemus exercises:', error);
    // For callable functions, throw an error to be caught by the client
    throw new Error(`Failed to search exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});