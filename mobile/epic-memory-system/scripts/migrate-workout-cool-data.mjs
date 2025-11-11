#!/usr/bin/env node

/**
 * Migration script to import workout-cool exercise data into Firebase
 * Transforms CSV data to match our Firebase structure with video support
 */

import fs from 'fs';
import { existsSync, readFileSync, createReadStream } from 'fs';
import csv from 'csv-parser';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
let db;

if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('🔧 Using Firestore Emulator at:', process.env.FIRESTORE_EMULATOR_HOST);
  initializeApp({
    projectId: 'strength-design'
  });
  db = getFirestore();
} else {
  // For production, try to use service account or default credentials
  try {
    // First try to load service account if available
    const serviceAccountPath = join(__dirname, '../firebase-service-account.json');
    if (existsSync(serviceAccountPath)) {
      console.log('🔧 Using Service Account credentials');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount),
        projectId: 'strength-design'
      });
    } else {
      console.log('🔧 Using default Firebase configuration');
      // This will use the Firebase CLI authentication
      initializeApp({
        projectId: 'strength-design',
        databaseURL: 'https://strength-design.firebaseio.com'
      });
    }
    db = getFirestore();
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    process.exit(1);
  }
}

// Data structure mapping
const exerciseMap = new Map();

async function parseCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    
    const csvPath = join(__dirname, '../workout-cool/data/sample-exercises.csv');
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
  const batch = db.batch();
  let count = 0;
  let batchCount = 0;
  
  for (const exercise of exercises) {
    const docRef = db.collection('workout_cool_exercises').doc(exercise.id.toString());
    batch.set(docRef, {
      ...exercise,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    count++;
    batchCount++;
    
    // Commit batch every 500 documents (Firestore limit)
    if (batchCount === 500) {
      await batch.commit();
      console.log(`Uploaded ${count} exercises...`);
      batchCount = 0;
    }
  }
  
  // Commit remaining documents
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`✅ Successfully uploaded ${count} exercises to Firebase!`);
}

async function migrate() {
  try {
    console.log('🚀 Starting workout-cool data migration to Firebase...');
    
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
    
    // Ask for confirmation
    console.log('\n⚠️  About to upload to Firebase...');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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