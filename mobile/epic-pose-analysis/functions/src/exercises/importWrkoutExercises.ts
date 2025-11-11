import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Categories mapping
const categoryMapping: Record<string, string> = {
  'strength': 'strength',
  'cardio': 'cardio',
  'stretching': 'stretching',
  'plyometrics': 'plyometrics',
  'powerlifting': 'powerlifting',
  'olympic_weightlifting': 'olympic',
  'strongman': 'strongman',
  'calisthenics': 'calisthenics'
};

// Equipment mapping
const equipmentMapping: Record<string, string> = {
  'body only': 'bodyweight',
  'machine': 'machine',
  'barbell': 'barbell',
  'dumbbell': 'dumbbell',
  'kettlebells': 'kettlebell',
  'cable': 'cable',
  'bands': 'resistance_band',
  'medicine ball': 'medicine_ball',
  'exercise ball': 'stability_ball',
  'e-z curl bar': 'ez_bar',
  'foam roll': 'foam_roller',
  'other': 'other',
  'none': 'none'
};

// Difficulty mapping based on level
const difficultyMapping: Record<string, string> = {
  'beginner': 'beginner',
  'intermediate': 'intermediate',
  'expert': 'advanced'
};

// Sample exercises data (since we can't access local files in Firebase Functions)
// In production, this would be fetched from a storage bucket or API
const sampleExercises = [
  {
    name: "Barbell Bench Press",
    force: "push",
    level: "intermediate",
    mechanic: "compound",
    equipment: "barbell",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders", "triceps"],
    instructions: [
      "Lie flat on your back on a bench",
      "Grip the bar with hands just wider than shoulder-width apart",
      "Lower the bar slowly until it touches your chest",
      "Push the bar back up to the starting position"
    ],
    category: "strength",
    images: []
  },
  {
    name: "Squat",
    force: "push",
    level: "intermediate", 
    mechanic: "compound",
    equipment: "barbell",
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: ["glutes", "hamstrings", "calves"],
    instructions: [
      "Stand with feet shoulder-width apart",
      "Lower your body by bending at the knees and hips",
      "Keep your back straight and chest up",
      "Push through your heels to return to starting position"
    ],
    category: "strength",
    images: []
  },
  {
    name: "Deadlift",
    force: "pull",
    level: "intermediate",
    mechanic: "compound", 
    equipment: "barbell",
    primaryMuscles: ["hamstrings", "glutes"],
    secondaryMuscles: ["lower back", "traps", "forearms"],
    instructions: [
      "Stand with feet hip-width apart",
      "Bend at the hips and knees to grip the bar",
      "Keep your back straight and lift by extending your hips and knees",
      "Stand tall with shoulders back at the top"
    ],
    category: "strength",
    images: []
  },
  {
    name: "Pull-up",
    force: "pull",
    level: "intermediate",
    mechanic: "compound",
    equipment: "body only",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "middle back"],
    instructions: [
      "Hang from a pull-up bar with hands shoulder-width apart",
      "Pull your body up until your chin is over the bar",
      "Lower yourself back down with control"
    ],
    category: "strength",
    images: []
  },
  {
    name: "Push-up",
    force: "push",
    level: "beginner",
    mechanic: "compound",
    equipment: "body only",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["shoulders", "triceps"],
    instructions: [
      "Start in a plank position",
      "Lower your body until your chest nearly touches the floor",
      "Push yourself back up to the starting position"
    ],
    category: "strength",
    images: []
  }
];

export const importWrkoutExercises = onRequest({
  cors: true,
  maxInstances: 10,
}, async (request, response) => {
  
  try {
    // Check for auth or some security mechanism
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }
    
    console.log('🚀 Starting exercise import...');
    
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    
    // Import sample exercises
    for (const exerciseData of sampleExercises) {
      try {
        const exerciseId = exerciseData.name.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        const mappedExercise = {
          id: exerciseId,
          name: exerciseData.name,
          category: categoryMapping[exerciseData.category] || 'strength',
          equipment: equipmentMapping[exerciseData.equipment] || 'other',
          primaryMuscles: exerciseData.primaryMuscles || [],
          secondaryMuscles: exerciseData.secondaryMuscles || [],
          difficulty: difficultyMapping[exerciseData.level] || 'intermediate',
          force: exerciseData.force || null,
          mechanic: exerciseData.mechanic || null,
          instructions: exerciseData.instructions || [],
          images: exerciseData.images || [],
          source: 'wrkout',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('exercises').doc(exerciseId).set(mappedExercise);
        console.log(`✅ Imported: ${exerciseData.name}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to import ${exerciseData.name}:`, error);
        errors.push(`${exerciseData.name}: ${error}`);
        failCount++;
      }
    }
    
    const result = {
      success: true,
      message: 'Import complete',
      stats: {
        total: sampleExercises.length,
        imported: successCount,
        failed: failCount
      },
      errors: errors.length > 0 ? errors : undefined
    };
    
    console.log('📊 Import Complete!', result);
    response.status(200).json(result);
    
  } catch (error) {
    console.error('Fatal error during import:', error);
    response.status(500).json({ 
      success: false,
      error: 'Import failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});