#!/usr/bin/env node

/**
 * Migration script using Firebase Web SDK
 * This approach works with Firebase CLI authentication
 */

import { readFileSync, createReadStream } from 'fs';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase configuration - same as your web app
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

// Data structure mapping
const exerciseMap = new Map();

async function parseCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    
    const csvPath = join(__dirname, '../comprehensive-exercises.csv');
    console.log('📖 Reading CSV from:', csvPath);
    
    createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', reject);
  });
}

function transformData(csvData) {
  // Group data by exercise ID
  csvData.forEach(row => {
    const exerciseId = row.id;
    
    if (!exerciseMap.has(exerciseId)) {
      exerciseMap.set(exerciseId, {
        id: exerciseId,
        name: row.name_en || row.name,
        description: cleanHTML(row.description_en || row.description),
        instructions: parseInstructions(row.description_en || row.description),
        video_url: row.full_video_url,
        video_thumbnail: row.full_video_image_url,
        introduction: cleanHTML(row.introduction_en || row.introduction),
        slug: row.slug_en || row.slug,
        type: [],
        primary_muscles: [],
        secondary_muscles: [],
        equipment: [],
        level: null,
        images: []
      });
    }
    
    const exercise = exerciseMap.get(exerciseId);
    
    // Add attributes based on attribute_name
    switch(row.attribute_name) {
      case 'TYPE':
        if (row.attribute_value && !exercise.type.includes(row.attribute_value)) {
          exercise.type.push(row.attribute_value.toLowerCase());
        }
        break;
      case 'PRIMARY_MUSCLE':
        if (row.attribute_value && !exercise.primary_muscles.includes(row.attribute_value)) {
          exercise.primary_muscles.push(row.attribute_value.toLowerCase());
        }
        break;
      case 'SECONDARY_MUSCLE':
        if (row.attribute_value && !exercise.secondary_muscles.includes(row.attribute_value)) {
          exercise.secondary_muscles.push(row.attribute_value.toLowerCase());
        }
        break;
      case 'EQUIPMENT':
        if (row.attribute_value && !exercise.equipment.includes(row.attribute_value)) {
          exercise.equipment.push(row.attribute_value.toLowerCase());
        }
        break;
      case 'LEVEL':
        if (row.attribute_value) {
          exercise.level = row.attribute_value.toLowerCase();
        }
        break;
    }
    
    // Add video thumbnail as an image
    if (row.full_video_image_url && !exercise.images.includes(row.full_video_image_url)) {
      exercise.images.push(row.full_video_image_url);
    }
  });
  
  return Array.from(exerciseMap.values());
}

function cleanHTML(html) {
  if (!html) return '';
  // Remove HTML tags but keep the text
  return html.replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseInstructions(html) {
  if (!html) return [];
  // Extract text from <p> tags as separate instructions
  const instructions = [];
  const regex = /<p>(.*?)<\/p>/g;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    const instruction = match[1].replace(/<[^>]*>/g, '').trim();
    if (instruction) {
      instructions.push(instruction);
    }
  }
  
  // If no <p> tags found, try to split by periods
  if (instructions.length === 0 && html) {
    const cleanText = cleanHTML(html);
    if (cleanText) {
      const sentences = cleanText.split(/\.\s+/).filter(s => s.trim());
      sentences.forEach(sentence => {
        if (sentence.trim()) {
          instructions.push(sentence.trim() + '.');
        }
      });
    }
  }
  
  return instructions;
}

async function uploadToFirebase(exercises) {
  const batch = writeBatch(db);
  let count = 0;
  let batchCount = 0;
  const batches = [];
  
  for (const exercise of exercises) {
    const docRef = doc(db, 'workout_cool_exercises', exercise.id.toString());
    batch.set(docRef, {
      ...exercise,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    count++;
    batchCount++;
    
    // Create new batch every 500 documents (Firestore limit)
    if (batchCount === 500) {
      batches.push(batch);
      batchCount = 0;
    }
  }
  
  // Commit all batches
  try {
    await batch.commit();
    console.log(`✅ Successfully uploaded ${count} exercises to Firebase!`);
  } catch (error) {
    // If batch fails, try individual uploads
    console.log('Batch upload failed, trying individual uploads...');
    
    for (const exercise of exercises) {
      try {
        const docRef = doc(db, 'workout_cool_exercises', exercise.id.toString());
        await setDoc(docRef, {
          ...exercise,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log(`✓ Uploaded: ${exercise.name}`);
      } catch (err) {
        console.error(`✗ Failed to upload ${exercise.name}:`, err.message);
      }
    }
  }
}

async function migrate() {
  try {
    console.log('🚀 Starting workout-cool data migration to Firebase...');
    console.log('🔧 Using Firebase Web SDK with project: strength-design');
    
    console.log('📖 Reading CSV data...');
    const csvData = await parseCSV();
    console.log(`Found ${csvData.length} rows`);
    
    console.log('🔄 Transforming data...');
    const exercises = transformData(csvData);
    console.log(`Transformed into ${exercises.length} unique exercises`);
    
    // Log sample exercise for verification
    if (exercises.length > 0) {
      console.log('\n📋 Sample exercise:');
      const sample = exercises[0];
      console.log(JSON.stringify({
        id: sample.id,
        name: sample.name,
        type: sample.type,
        primary_muscles: sample.primary_muscles,
        equipment: sample.equipment,
        video_url: sample.video_url ? '✓ Has video' : '✗ No video',
        video_thumbnail: sample.video_thumbnail ? '✓ Has thumbnail' : '✗ No thumbnail',
        instructions: sample.instructions.length + ' instructions'
      }, null, 2));
    }
    
    console.log('\n☁️  Uploading to Firebase...');
    await uploadToFirebase(exercises);
    
    console.log('\n✨ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();