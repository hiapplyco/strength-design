#!/usr/bin/env node

/**
 * Migration script to import workout-cool exercise data into Firebase
 * Transforms CSV data to match our Firebase structure with video support
 */

const fs = require('fs');
const csv = require('csv-parser');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
// Use default credentials in production or local emulator
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('🔧 Using Firestore Emulator');
  admin.initializeApp({
    projectId: 'strength-design'
  });
} else {
  // For production, you'll need to set up service account
  try {
    const serviceAccount = require('../firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'strength-design'
    });
  } catch (error) {
    console.log('🔧 Using Application Default Credentials');
    admin.initializeApp({
      projectId: 'strength-design'
    });
  }
}

const db = admin.firestore();

// Data structure mapping
const exerciseMap = new Map();

async function parseCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(path.join(__dirname, '../workout-cool/data/sample-exercises.csv'))
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
        if (!exercise.type.includes(row.attribute_value)) {
          exercise.type.push(row.attribute_value.toLowerCase());
        }
        break;
      case 'PRIMARY_MUSCLE':
        if (!exercise.primary_muscles.includes(row.attribute_value)) {
          exercise.primary_muscles.push(row.attribute_value.toLowerCase());
        }
        break;
      case 'SECONDARY_MUSCLE':
        if (!exercise.secondary_muscles.includes(row.attribute_value)) {
          exercise.secondary_muscles.push(row.attribute_value.toLowerCase());
        }
        break;
      case 'EQUIPMENT':
        if (!exercise.equipment.includes(row.attribute_value)) {
          exercise.equipment.push(row.attribute_value.toLowerCase());
        }
        break;
      case 'LEVEL':
        exercise.level = row.attribute_value.toLowerCase();
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
  
  return instructions;
}

async function uploadToFirebase(exercises) {
  const batch = db.batch();
  let count = 0;
  
  for (const exercise of exercises) {
    const docRef = db.collection('workout_cool_exercises').doc(exercise.id.toString());
    batch.set(docRef, {
      ...exercise,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    count++;
    
    // Commit batch every 500 documents (Firestore limit)
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Uploaded ${count} exercises...`);
    }
  }
  
  // Commit remaining documents
  await batch.commit();
  console.log(`✅ Successfully uploaded ${count} exercises to Firebase!`);
}

async function migrate() {
  try {
    console.log('📖 Reading CSV data...');
    const csvData = await parseCSV();
    console.log(`Found ${csvData.length} rows`);
    
    console.log('🔄 Transforming data...');
    const exercises = transformData(csvData);
    console.log(`Transformed into ${exercises.length} unique exercises`);
    
    // Log sample exercise for verification
    console.log('\n📋 Sample exercise:');
    console.log(JSON.stringify(exercises[0], null, 2));
    
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