#!/usr/bin/env node

/**
 * Script to create demo account in Firebase
 * Run: node scripts/createDemoAccount.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDTyxs6cZKUbN7ejmYk_rLVxNg5wVKoSlQ",
  authDomain: "strength-design.firebaseapp.com",
  projectId: "strength-design",
  storageBucket: "strength-design.firebasestorage.app",
  messagingSenderId: "739613827248",
  appId: "1:739613827248:web:2ae23e6e858a582275a0d8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createDemoAccount() {
  const email = 'demo@strength.design';
  const password = 'demo123';
  
  try {
    console.log('Creating demo account...');
    
    // Create the user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Demo account created:', user.email);
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: 'Demo User',
      createdAt: new Date().toISOString(),
      isDemo: true,
      preferences: {
        theme: 'light',
        notifications: true,
        units: 'imperial'
      }
    });
    
    console.log('✅ User profile created in Firestore');
    console.log('\n📱 You can now log in with:');
    console.log('   Email: demo@strength.design');
    console.log('   Password: demo123');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Demo account already exists');
      console.log('\n📱 You can log in with:');
      console.log('   Email: demo@strength.design');
      console.log('   Password: demo123');
    } else {
      console.error('❌ Error creating demo account:', error.message);
    }
    process.exit(1);
  }
}

createDemoAccount();