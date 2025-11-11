// Test login script for Firebase Auth emulator
const admin = require('firebase-admin');

// Initialize admin with emulator settings
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({
  projectId: 'demo-strength-design',
});

async function listUsers() {
  try {
    const listUsersResult = await admin.auth().listUsers(100);
    
    console.log('📋 Users in Firebase Auth Emulator:\n');
    
    if (listUsersResult.users.length === 0) {
      console.log('No users found. Creating demo user...');
      
      // Create a simple demo user
      const userRecord = await admin.auth().createUser({
        email: 'test@test.com',
        password: 'test123',
        displayName: 'Test User',
        emailVerified: true,
      });
      
      console.log('✅ Created test user:');
      console.log('   Email: test@test.com');
      console.log('   Password: test123');
      
    } else {
      listUsersResult.users.forEach((user) => {
        console.log(`✅ User: ${user.email || 'No email'}`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Display Name: ${user.displayName || 'Not set'}`);
        console.log('   ---');
      });
      
      console.log('\n💡 Login credentials:');
      console.log('   Email: demo@example.com');
      console.log('   Password: demo123456');
      console.log('\n   OR');
      console.log('   Email: test@test.com');
      console.log('   Password: test123');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

listUsers();