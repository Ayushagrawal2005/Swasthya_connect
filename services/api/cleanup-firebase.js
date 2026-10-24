/**
 * Cleanup script — DELETE ALL DATA from Firebase Firestore
 * ⚠️ WARNING: This will delete ALL data in ALL collections!
 * Use this to reset the database before running comprehensive-seed.js
 * 
 * Run: node cleanup-firebase.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function deleteCollection(collectionName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`   ⏭️  ${collectionName}: Already empty`);
    return;
  }
  
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`   ✅ ${collectionName}: Deleted ${snapshot.size} documents`);
}

async function main() {
  console.log('🗑️  FIREBASE CLEANUP STARTING...');
  console.log('⚠️  WARNING: This will DELETE ALL data from Firebase!');
  console.log('');
  
  const collections = [
    'users',
    'patients',
    'appointments',
    'followups',
    'referrals',
    'inventory',
    'diagnostics',
    'family_members',
    'menstrual_cycles',
    'pregnancy_trackers',
    'vaccinations',
    'chronic_patients',
    'visits',
    'triage_sessions',
    'consultations',
    'medical_records',
    'escalations',
    'notifications',
    'kiosk_queue',
    'facilities',
    'ivr_cases'
  ];
  
  console.log('🧹 Deleting all collections...');
  for (const collection of collections) {
    await deleteCollection(collection);
  }
  
  console.log('');
  console.log('✅ CLEANUP COMPLETE!');
  console.log('');
  console.log('🌱 Now run: node comprehensive-seed.js');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
