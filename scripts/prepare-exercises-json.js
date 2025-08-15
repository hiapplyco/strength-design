#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Categories mapping
const categoryMapping = {
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
const equipmentMapping = {
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
const difficultyMapping = {
  'beginner': 'beginner',
  'intermediate': 'intermediate',
  'expert': 'advanced'
};

function prepareExercises() {
  const exercisesDir = path.join(__dirname, '..', 'wrkout-exercises', 'exercises');
  
  if (!fs.existsSync(exercisesDir)) {
    console.error('Exercises directory not found:', exercisesDir);
    process.exit(1);
  }
  
  const exerciseFolders = fs.readdirSync(exercisesDir)
    .filter(folder => fs.statSync(path.join(exercisesDir, folder)).isDirectory());
  
  console.log(`Found ${exerciseFolders.length} exercise folders to process`);
  
  const exercises = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const folder of exerciseFolders) {
    try {
      const exercisePath = path.join(exercisesDir, folder, 'exercise.json');
      
      if (!fs.existsSync(exercisePath)) {
        console.log(`⚠️  No exercise.json in ${folder}`);
        failCount++;
        continue;
      }
      
      const exerciseData = JSON.parse(fs.readFileSync(exercisePath, 'utf8'));
      
      // Create a clean ID from the folder name
      const exerciseId = folder.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      // Check for images in the folder
      const images = [];
      const imagesDir = path.join(exercisesDir, folder, 'images');
      if (fs.existsSync(imagesDir)) {
        const imageFiles = fs.readdirSync(imagesDir)
          .filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.gif'));
        
        // Store relative paths
        images.push(...imageFiles.map(f => `/wrkout-exercises/exercises/${folder}/images/${f}`));
      }
      
      const mappedExercise = {
        id: exerciseId,
        name: exerciseData.name || folder.replace(/_/g, ' '),
        slug: exerciseId,
        description: exerciseData.description || '',
        introduction: exerciseData.introduction || '',
        instructions: Array.isArray(exerciseData.instructions) 
          ? exerciseData.instructions 
          : (exerciseData.instructions ? [exerciseData.instructions] : []),
        category: categoryMapping[exerciseData.category] || 'strength',
        type: exerciseData.type ? (Array.isArray(exerciseData.type) ? exerciseData.type : [exerciseData.type]) : ['strength'],
        equipment: Array.isArray(exerciseData.equipment) 
          ? exerciseData.equipment.map(e => equipmentMapping[e.toLowerCase()] || e)
          : [equipmentMapping[exerciseData.equipment?.toLowerCase()] || 'none'],
        primary_muscles: exerciseData.primaryMuscles || exerciseData.primary_muscles || [],
        secondary_muscles: exerciseData.secondaryMuscles || exerciseData.secondary_muscles || [],
        difficulty: difficultyMapping[exerciseData.level] || 'intermediate',
        mechanics_type: exerciseData.mechanic || exerciseData.mechanics || null,
        force: exerciseData.force || null,
        images: images,
        source: 'wrkout'
      };
      
      exercises.push(mappedExercise);
      successCount++;
      
      if (successCount % 100 === 0) {
        console.log(`Progress: ${successCount} exercises processed`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to process ${folder}:`, error.message);
      failCount++;
    }
  }
  
  // Write to JSON file
  const outputPath = path.join(__dirname, '..', 'public', 'wrkout-exercises-full.json');
  fs.writeFileSync(outputPath, JSON.stringify(exercises, null, 2));
  
  console.log('\n📊 Processing Complete!');
  console.log(`✅ Successfully processed: ${successCount} exercises`);
  console.log(`❌ Failed: ${failCount} exercises`);
  console.log(`📁 Output saved to: ${outputPath}`);
  console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
}

prepareExercises();