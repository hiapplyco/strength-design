#!/usr/bin/env node

/**
 * Migration script to import exercemus exercise database into Firebase
 * Fetches data from: https://raw.githubusercontent.com/exercemus/exercises/minified/minified-exercises.json
 * Transforms 2500+ exercises with proper structure and imagery
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBg7NlLN12ERe3mQ_rXXXsuaYEDpWrjxIM",
  authDomain: "strength-design.firebaseapp.com",
  projectId: "strength-design",
  storageBucket: "strength-design.firebasestorage.app",
  messagingSenderId: "269493681863",
  appId: "1:269493681863:web:19798fa3c039e1b2f44c78"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const EXERCEMUS_URL = 'https://raw.githubusercontent.com/exercemus/exercises/minified/minified-exercises.json';

async function fetchExerciseData() {
  console.log('📡 Fetching exercise data from exercemus...');
  
  try {
    const response = await fetch(EXERCEMUS_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.exercises?.length || 0} exercises from exercemus`);
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch exercise data:', error);
    throw error;
  }
}

function transformExerciseData(exerciseData) {
  const { exercises, categories, equipment, muscles, muscle_groups } = exerciseData;
  
  console.log('🔄 Transforming exercise data...');
  console.log(`📊 Found: ${exercises.length} exercises, ${categories.length} categories, ${equipment.length} equipment types`);
  
  // Map category to our type system
  const typeMapping = {
    'strength': 'strength',
    'cardio': 'cardio',
    'stretching': 'stretching',
    'plyometrics': 'plyometrics',
    'strongman': 'strength',
    'olympic weightlifting': 'strength',
    'crossfit': 'strength',
    'calisthenics': 'strength'
  };
  
  const transformedExercises = exercises.map((exercise, index) => {
    // Generate consistent ID based on exercise name
    const id = `exercemus_${index + 1}`;
    const slug = exercise.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .replace(/-+/g, '-')          // Remove multiple consecutive hyphens
      .trim();
    
    // Generate placeholder images based on exercise type and muscle groups
    const generateImageUrls = (exerciseName, category) => {
      const baseImageUrl = 'https://via.placeholder.com/400x300/FF6B35/FFFFFF?text=';
      const encodedName = encodeURIComponent(exerciseName.replace(/\s+/g, '+'));
      return [
        `${baseImageUrl}${encodedName}`,
        `${baseImageUrl}${encodedName}+Demo`
      ];
    };
    
    // Transform to our Firebase structure
    return {
      id,
      name: exercise.name || 'Unknown Exercise',
      description: exercise.description || `${exercise.name} exercise`,
      introduction: exercise.description || `Learn how to perform ${exercise.name}`,
      instructions: Array.isArray(exercise.instructions) ? exercise.instructions : [],
      slug,
      slug_en: slug,
      
      // Categories and types
      type: exercise.category ? [typeMapping[exercise.category] || 'strength'] : ['strength'],
      category: exercise.category || 'strength',
      
      // Muscle groups
      primary_muscles: Array.isArray(exercise.primary_muscles) ? 
        exercise.primary_muscles.map(m => m.toLowerCase()) : [],
      secondary_muscles: Array.isArray(exercise.secondary_muscles) ? 
        exercise.secondary_muscles.map(m => m.toLowerCase()) : [],
      
      // Equipment
      equipment: Array.isArray(exercise.equipment) ? 
        exercise.equipment.map(e => e.toLowerCase().replace(/\s+/g, '_')) : ['bodyweight'],
      
      // Media
      video_url: exercise.video || null,
      video_thumbnail: exercise.video ? 
        exercise.video.replace('youtube.com/watch?v=', 'img.youtube.com/vi/').replace('/embed/', '/vi/') + '/maxresdefault.jpg' : 
        null,
      images: exercise.images && exercise.images.length > 0 ? 
        exercise.images : 
        generateImageUrls(exercise.name, exercise.category),
      
      // Additional metadata
      difficulty: exercise.difficulty || 'intermediate',
      mechanics_type: exercise.primary_muscles && exercise.primary_muscles.length > 1 ? 'compound' : 'isolation',
      variations_on: exercise.variations_on || [],
      
      // Source attribution
      source: 'exercemus',
      source_url: 'https://github.com/exercemus/exercises',
      attribution: 'Exercise data from exercemus open-source database'
    };
  });
  
  // Also prepare metadata collections
  const metadata = {
    categories: categories.map(cat => ({
      id: cat.replace(/\s+/g, '_').toLowerCase(),
      name: cat,
      display_name: cat.charAt(0).toUpperCase() + cat.slice(1),
      type: typeMapping[cat] || 'strength'
    })),
    
    equipment: equipment.map((eq, index) => ({
      id: eq.replace(/\s+/g, '_').toLowerCase(),
      name: eq,
      display_name: eq.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    })),
    
    muscles: muscles ? muscles.map((muscle, index) => ({
      id: muscle.replace(/\s+/g, '_').toLowerCase(),
      name: muscle,
      display_name: muscle.charAt(0).toUpperCase() + muscle.slice(1),
      group: findMuscleGroup(muscle, muscle_groups)
    })) : []
  };
  
  console.log(`✅ Transformed ${transformedExercises.length} exercises with full metadata`);
  return { exercises: transformedExercises, metadata };
}

function findMuscleGroup(muscle, muscleGroups) {
  if (!muscleGroups) return 'other';
  
  for (const [group, muscles] of Object.entries(muscleGroups)) {
    if (muscles.includes(muscle)) {
      return group;
    }
  }
  return 'other';
}

async function uploadToFirebase(transformedData) {
  const { exercises, metadata } = transformedData;
  
  console.log('☁️  Uploading to Firebase...');
  console.log(`📤 Uploading ${exercises.length} exercises...`);
  
  // Upload exercises in batches
  let uploadedCount = 0;
  const batchSize = 500; // Firestore batch limit
  
  for (let i = 0; i < exercises.length; i += batchSize) {
    const batch = writeBatch(db);
    const batchExercises = exercises.slice(i, i + batchSize);
    
    for (const exercise of batchExercises) {
      const docRef = doc(db, 'exercemus_exercises', exercise.id);
      batch.set(docRef, {
        ...exercise,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    try {
      await batch.commit();
      uploadedCount += batchExercises.length;
      console.log(`✅ Uploaded batch: ${uploadedCount}/${exercises.length} exercises`);
    } catch (error) {
      console.error(`❌ Failed to upload batch starting at ${i}:`, error);
      
      // Try individual uploads for failed batch
      for (const exercise of batchExercises) {
        try {
          const docRef = doc(db, 'exercemus_exercises', exercise.id);
          await setDoc(docRef, {
            ...exercise,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          uploadedCount++;
          console.log(`✓ Individual upload: ${exercise.name}`);
        } catch (individualError) {
          console.error(`✗ Failed to upload ${exercise.name}:`, individualError.message);
        }
      }
    }
  }
  
  // Upload metadata collections
  console.log('📤 Uploading metadata...');
  
  try {
    // Upload categories
    for (const category of metadata.categories) {
      const docRef = doc(db, 'exercise_categories', category.id);
      await setDoc(docRef, {
        ...category,
        createdAt: serverTimestamp()
      });
    }
    
    // Upload equipment
    for (const eq of metadata.equipment) {
      const docRef = doc(db, 'exercise_equipment', eq.id);
      await setDoc(docRef, {
        ...eq,
        createdAt: serverTimestamp()
      });
    }
    
    // Upload muscles
    for (const muscle of metadata.muscles) {
      const docRef = doc(db, 'exercise_muscles', muscle.id);
      await setDoc(docRef, {
        ...muscle,
        createdAt: serverTimestamp()
      });
    }
    
    console.log('✅ Metadata uploaded successfully');
  } catch (error) {
    console.error('❌ Failed to upload metadata:', error);
  }
  
  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 Final Stats:`);
  console.log(`   • Exercises: ${uploadedCount}/${exercises.length}`);
  console.log(`   • Categories: ${metadata.categories.length}`);
  console.log(`   • Equipment: ${metadata.equipment.length}`);
  console.log(`   • Muscles: ${metadata.muscles.length}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   • Update mobile app to query 'exercemus_exercises' collection`);
  console.log(`   • Deploy updated Firebase functions`);
  console.log(`   • Test exercise search and filtering`);
}

async function migrate() {
  try {
    console.log('🚀 Starting exercemus database migration to Firebase...');
    console.log('🔧 Using Firebase Web SDK with project: strength-design');
    console.log(`📡 Source: ${EXERCEMUS_URL}\n`);
    
    // Fetch data
    const exerciseData = await fetchExerciseData();
    
    // Transform data
    const transformedData = transformExerciseData(exerciseData);
    
    // Upload to Firebase
    await uploadToFirebase(transformedData);
    
    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();