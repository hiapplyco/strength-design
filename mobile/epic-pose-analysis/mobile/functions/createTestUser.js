// Create test user script
const admin = require('firebase-admin');

process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({
  projectId: 'demo-strength-design',
});

async function createTestUser() {
  try {
    const userRecord = await admin.auth().createUser({
      email: 'test@test.com',
      password: 'test123',
      displayName: 'Test User',
      emailVerified: true,
    });
    
    console.log('✅ Created test user:');
    console.log('   Email: test@test.com');
    console.log('   Password: test123');
    
    // Also create Firestore document
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: 'test@test.com',
      displayName: 'Test User',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ Firestore document created');
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('ℹ️ Test user already exists');
      console.log('   Email: test@test.com');
      console.log('   Password: test123');
    } else {
      console.error('Error:', error);
    }
  } finally {
    process.exit(0);
  }
}

createTestUser();