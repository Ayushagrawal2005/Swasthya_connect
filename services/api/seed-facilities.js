/**
 * Seed Facilities and Doctors for Swasthya Connect
 * Run: node seed-facilities.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedFacilitiesAndDoctors() {
  console.log('🏥 Seeding facilities and doctors...\n');

  try {
    // ═══════════════════════════════════════════════════════════════
    // FACILITIES
    // ═══════════════════════════════════════════════════════════════
    
    const facilities = [
      {
        id: 'F001',
        name: 'Sub-centre Mandav',
        tier: 'sub-centre',
        distance: '0 km',
        phone: '02164-221001',
        address: 'Mandav Village, Solapur'
      },
      {
        id: 'F002',
        name: 'PHC Beed',
        tier: 'phc',
        distance: '12 km',
        phone: '02446-222100',
        address: 'Beed Naka, Beed District'
      },
      {
        id: 'F003',
        name: 'Rural Hospital Osmanabad',
        tier: 'rural-hospital',
        distance: '28 km',
        phone: '02472-224500',
        address: 'Civil Lines, Osmanabad'
      },
      {
        id: 'F004',
        name: 'District Hospital Solapur',
        tier: 'district',
        distance: '55 km',
        phone: '0217-274000',
        address: 'Railway Lines, Solapur'
      }
    ];

    console.log('Creating facilities...');
    for (const facility of facilities) {
      await db.collection('facilities').doc(facility.id).set(facility);
      console.log(`  ✅ ${facility.name}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // DOCTORS
    // ═══════════════════════════════════════════════════════════════
    
    const doctors = [
      {
        id: 'D001',
        facilityId: 'F002',
        name: 'Dr. Ramesh Patil',
        specialty: 'General Medicine',
        available: true,
        slotsToday: 8
      },
      {
        id: 'D002',
        facilityId: 'F002',
        name: 'Dr. Sunita Kale',
        specialty: 'Gynaecology',
        available: true,
        slotsToday: 5
      },
      {
        id: 'D003',
        facilityId: 'F003',
        name: 'Dr. Anil Shinde',
        specialty: 'General Surgery',
        available: false,
        slotsToday: 0
      },
      {
        id: 'D004',
        facilityId: 'F004',
        name: 'Dr. Priya Deshmukh',
        specialty: 'Cardiology',
        available: true,
        slotsToday: 3
      },
      {
        id: 'D005',
        facilityId: 'F004',
        name: 'Dr. Vikas Jadhav',
        specialty: 'Paediatrics',
        available: true,
        slotsToday: 6
      },
      {
        id: 'D006',
        facilityId: 'F001',
        name: 'ANM Kavita Shinde',
        specialty: 'Community Health',
        available: true,
        slotsToday: 10
      }
    ];

    console.log('\nCreating doctors...');
    for (const doctor of doctors) {
      await db.collection('doctors').doc(doctor.id).set(doctor);
      console.log(`  ✅ ${doctor.name} (${doctor.specialty}) at ${facilities.find(f => f.id === doctor.facilityId)?.name}`);
    }

    console.log('\n✅ Successfully seeded facilities and doctors!');
    console.log('   4 facilities created');
    console.log('   6 doctors created');
    console.log('\nYou can now book appointments at these facilities.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedFacilitiesAndDoctors();
