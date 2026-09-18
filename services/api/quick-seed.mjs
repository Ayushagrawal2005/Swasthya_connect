/**
 * Quick seed - adds demo users to Firebase
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://swasthyaconnect-4bfa1-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

async function quickSeed() {
  console.log('🌱 Quick seeding Firebase with demo users...\n');

  const users = [
    { 
      username: 'asha@swasthya.in', 
      email: 'asha@swasthya.in',
      password: 'demo1234', 
      role: 'asha', 
      name: 'ANM Kavita Shinde',
      phone: '9876543210',
      village: 'Mandav'
    },
    { 
      username: 'doctor@swasthya.in', 
      email: 'doctor@swasthya.in',
      password: 'demo1234', 
      role: 'doctor', 
      name: 'Dr. Ramesh Patil',
      phone: '9876543220',
      specialty: 'General Medicine'
    },
    { 
      username: 'admin@swasthya.in', 
      email: 'admin@swasthya.in',
      password: 'demo1234', 
      role: 'admin', 
      name: 'Admin Ravi Bhosale',
      phone: '9876543230'
    },
    { 
      username: 'meena@swasthya.in', 
      email: 'meena@swasthya.in',
      password: 'demo1234', 
      role: 'patient', 
      name: 'Meena Patil',
      phone: '9876543240',
      patientId: 'P-MEENA-001'
    },
    { 
      username: 'priya@swasthya.in', 
      email: 'priya@swasthya.in',
      password: 'demo1234', 
      role: 'patient', 
      name: 'Priya Sharma',
      phone: '9876543241',
      patientId: 'P-PRIYA-002'
    }
  ];

  try {
    for (const user of users) {
      // Check if user already exists
      const existingUser = await db.collection('users')
        .where('email', '==', user.email)
        .limit(1)
        .get();

      if (!existingUser.empty) {
        console.log(`   ⏭️  User already exists: ${user.name} (${user.email})`);
        continue;
      }

      // Create user
      const docRef = await db.collection('users').add({
        ...user,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`   ✅ Created: ${user.name} (${user.email}) - Role: ${user.role}`);
    }

    console.log('\n🎉 Seeding complete!');
    console.log('\n📝 Demo Credentials (all passwords: demo1234):');
    console.log('   ASHA Worker: asha@swasthya.in');
    console.log('   Doctor: doctor@swasthya.in');
    console.log('   Admin: admin@swasthya.in');
    console.log('   Patient 1: meena@swasthya.in');
    console.log('   Patient 2: priya@swasthya.in');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    process.exit(0);
  }
}

quickSeed();
