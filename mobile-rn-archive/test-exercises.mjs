// Quick test to verify exercises exist in Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDTyxs6cZKUbN7ejmYk_rLVxNg5wVKoSlQ",
  authDomain: "strength-design.firebaseapp.com",
  projectId: "strength-design",
  storageBucket: "strength-design.firebasestorage.app",
  messagingSenderId: "739613827248",
  appId: "1:739613827248:web:2ae23e6e858a582275a0d8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testExercises() {
  console.log('🔍 Testing Firestore exercise database...\n');
  
  try {
    // Test 1: Count all exercises
    const exercisesRef = collection(db, 'exercemus_exercises');
    const allSnapshot = await getDocs(exercisesRef);
    console.log(`✅ Total exercises in database: ${allSnapshot.size}`);
    
    // Test 2: Search for "bench" exercises
    console.log('\n🔍 Searching for "bench" exercises...');
    const benchExercises = [];
    allSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.name && data.name.toLowerCase().includes('bench')) {
        benchExercises.push(data.name);
      }
    });
    
    console.log(`✅ Found ${benchExercises.length} bench exercises:`);
    benchExercises.slice(0, 10).forEach(name => {
      console.log(`   - ${name}`);
    });
    if (benchExercises.length > 10) {
      console.log(`   ... and ${benchExercises.length - 10} more`);
    }
    
    // Test 3: Check data structure
    console.log('\n📊 Sample exercise structure:');
    const firstExercise = allSnapshot.docs[0]?.data();
    if (firstExercise) {
      console.log('Fields available:', Object.keys(firstExercise).join(', '));
      console.log('\nExample exercise:');
      console.log(JSON.stringify({
        name: firstExercise.name,
        category: firstExercise.category,
        equipment: firstExercise.equipment,
        primary_muscles: firstExercise.primary_muscles,
        difficulty: firstExercise.difficulty
      }, null, 2));
    }
    
    // Test 4: Check categories
    const categories = new Set();
    allSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.category) categories.add(data.category);
    });
    console.log('\n📁 Categories found:', Array.from(categories).join(', '));
    
  } catch (error) {
    console.error('❌ Error testing exercises:', error);
  }
  
  process.exit(0);
}

testExercises();