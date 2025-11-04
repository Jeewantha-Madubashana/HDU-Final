import { sequelize } from '../config/mysqlDB.js';
import definePatient from '../models/patients/Patient.js';
import defineBedMySQL from '../models/BedMySQL.js';
import defineAdmission from '../models/patients/Admission.js';
import defineEmergencyContact from '../models/patients/EmergencyContact.js';
import defineMedicalRecord from '../models/patients/MedicalRecord.js';
import defineCriticalFactor from '../models/patients/CriticalFactor.js';

// Initialize models
const Patient = definePatient(sequelize);
const BedMySQL = defineBedMySQL(sequelize);
const Admission = defineAdmission(sequelize);
const EmergencyContact = defineEmergencyContact(sequelize);
const MedicalRecord = defineMedicalRecord(sequelize);
const CriticalFactor = defineCriticalFactor(sequelize);

// Helper function to generate dates
const generateAdmissionDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Helper function to generate multiple critical factor updates
const generateCriticalFactorUpdates = (patientId, admissionDaysAgo) => {
  const updates = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - admissionDaysAgo);
  
  // Generate updates every 8 hours for the duration of stay
  const totalUpdates = Math.min(admissionDaysAgo * 3, 15); // Max 15 updates
  
  for (let i = 0; i < totalUpdates; i++) {
    const updateDate = new Date(baseDate);
    updateDate.setHours(updateDate.getHours() + (i * 8));
    
    updates.push({
      patientId,
      heartRate: Math.floor(Math.random() * 40) + 60, // 60-100
      bloodPressure: `${Math.floor(Math.random() * 40) + 110}/${Math.floor(Math.random() * 30) + 70}`,
      temperature: (Math.random() * 3 + 36.5).toFixed(1), // 36.5-39.5
      spO2: Math.floor(Math.random() * 15) + 85, // 85-100
      respiratoryRate: Math.floor(Math.random() * 15) + 12, // 12-27
      gcs: Math.floor(Math.random() * 6) + 10, // 10-15
      painScale: Math.floor(Math.random() * 11), // 0-10
      bloodGlucose: Math.floor(Math.random() * 100) + 80, // 80-180
      urineOutput: Math.floor(Math.random() * 1000) + 500, // 500-1500ml
      recordedAt: updateDate
    });
  }
  
  return updates;
};

const realisticPatients = [
  {
    patientData: {
      patientNumber: "HDU-2025-001",
      fullName: "Amara Wickramasinghe",
      nicPassport: "198712345678",
      dateOfBirth: "1987-03-22",
      age: 38,
      gender: "Female",
      maritalStatus: "Married",
      contactNumber: "+94 71 234 5678",
      email: "amara.w@email.com",
      address: "45 Galle Road, Colombo 06",
      emergencyContactName: "Sunil Wickramasinghe",
      emergencyContactRelationship: "Spouse",
      emergencyContactNumber: "+94 71 234 5679",
      knownAllergies: "Penicillin",
      medicalHistory: "Hypertension, Gestational diabetes (2020)",
      currentMedications: "Amlodipine, Metformin",
      pregnancyStatus: "Not Applicable",
      bloodType: "B+",
      initialDiagnosis: "Severe pneumonia with respiratory failure",
      department: "ICU",
      consultantInCharge: "Dr. Perera"
    },
    bedId: 1,
    admissionDaysAgo: 5
  },
  {
    patientData: {
      patientNumber: "HDU-2025-002",
      fullName: "Kamal Fernando",
      nicPassport: "196508123456",
      dateOfBirth: "1965-08-15",
      age: 59,
      gender: "Male",
      maritalStatus: "Married",
      contactNumber: "+94 77 345 6789",
      email: "kamal.f@email.com",
      address: "78 Kandy Road, Kegalle",
      emergencyContactName: "Mala Fernando",
      emergencyContactRelationship: "Spouse",
      emergencyContactNumber: "+94 77 345 6790",
      knownAllergies: "Sulfa drugs, Latex",
      medicalHistory: "Type 2 Diabetes, Coronary artery disease, Previous CABG (2022)",
      currentMedications: "Insulin, Metoprolol, Clopidogrel, Atorvastatin",
      pregnancyStatus: "Not Applicable",
      bloodType: "O+",
      initialDiagnosis: "Post-operative complications following emergency appendectomy",
      department: "Surgery",
      consultantInCharge: "Dr. Silva"
    },
    bedId: 2,
    admissionDaysAgo: 3
  },
  {
    patientData: {
      patientNumber: "HDU-2025-003",
      fullName: "Priyanka Jayawardena",
      nicPassport: "199203456789",
      dateOfBirth: "1992-11-08",
      age: 32,
      gender: "Female",
      maritalStatus: "Single",
      contactNumber: "+94 76 456 7890",
      email: "priyanka.j@email.com",
      address: "123 Temple Road, Kegalle",
      emergencyContactName: "Nimal Jayawardena",
      emergencyContactRelationship: "Parent",
      emergencyContactNumber: "+94 76 456 7891",
      knownAllergies: "None known",
      medicalHistory: "Asthma, Depression",
      currentMedications: "Salbutamol inhaler, Sertraline",
      pregnancyStatus: "Not Applicable",
      bloodType: "AB+",
      initialDiagnosis: "Drug overdose - intentional self-harm",
      department: "ICU",
      consultantInCharge: "Dr. Rajapaksa"
    },
    bedId: 3,
    admissionDaysAgo: 2
  },
  {
    patientData: {
      patientNumber: "HDU-2025-004",
      fullName: "Ravi Mendis",
      nicPassport: "197401234567",
      dateOfBirth: "1974-05-30",
      age: 50,
      gender: "Male",
      maritalStatus: "Divorced",
      contactNumber: "+94 75 567 8901",
      email: "ravi.m@email.com",
      address: "67 Hill Street, Kegalle",
      emergencyContactName: "Saman Mendis",
      emergencyContactRelationship: "Other",
      emergencyContactNumber: "+94 75 567 8902",
      knownAllergies: "Codeine",
      medicalHistory: "Chronic kidney disease, Hypertension, Gout",
      currentMedications: "Allopurinol, Amlodipine, Furosemide",
      pregnancyStatus: "Not Applicable",
      bloodType: "A-",
      initialDiagnosis: "Acute kidney injury requiring dialysis",
      department: "Medical",
      consultantInCharge: "Dr. Gunasekara"
    },
    bedId: 4,
    admissionDaysAgo: 7
  },
  {
    patientData: {
      patientNumber: "HDU-2025-005",
      fullName: "Sandya Rathnayake",
      nicPassport: "198906789012",
      dateOfBirth: "1989-12-12",
      age: 35,
      gender: "Female",
      maritalStatus: "Married",
      contactNumber: "+94 78 678 9012",
      email: "sandya.r@email.com",
      address: "89 Main Street, Kegalle",
      emergencyContactName: "Chaminda Rathnayake",
      emergencyContactRelationship: "Spouse",
      emergencyContactNumber: "+94 78 678 9013",
      knownAllergies: "Iodine contrast",
      medicalHistory: "Epilepsy, Migraine",
      currentMedications: "Phenytoin, Sumatriptan",
      pregnancyStatus: "32 weeks pregnant",
      bloodType: "O-",
      initialDiagnosis: "Severe preeclampsia with HELLP syndrome",
      department: "ICU",
      consultantInCharge: "Dr. Wijesinghe"
    },
    bedId: 5,
    admissionDaysAgo: 1
  },
  {
    patientData: {
      patientNumber: "HDU-2025-006",
      fullName: "Thilak Perera",
      nicPassport: "195712345678",
      dateOfBirth: "1957-07-25",
      age: 67,
      gender: "Male",
      maritalStatus: "Widowed",
      contactNumber: "+94 72 789 0123",
      email: "thilak.p@email.com",
      address: "34 Lake View, Kegalle",
      emergencyContactName: "Dilani Perera",
      emergencyContactRelationship: "Child",
      emergencyContactNumber: "+94 72 789 0124",
      knownAllergies: "Aspirin, NSAIDs",
      medicalHistory: "COPD, Heart failure, Previous stroke (2021)",
      currentMedications: "Salbutamol, Digoxin, Warfarin, Furosemide",
      pregnancyStatus: "Not Applicable",
      bloodType: "B-",
      initialDiagnosis: "Acute exacerbation of COPD with respiratory failure",
      department: "ICU",
      consultantInCharge: "Dr. Kumara"
    },
    bedId: 6,
    admissionDaysAgo: 4
  }
];

async function clearAndPopulateDatabase() {
  try {
    console.log('🧹 Starting database cleanup and realistic scenario creation...');
    
    // Clear existing data in correct order (respecting foreign key constraints)
    console.log('🗑️ Clearing existing data...');
    await CriticalFactor.destroy({ where: {} });
    await MedicalRecord.destroy({ where: {} });
    await EmergencyContact.destroy({ where: {} });
    await Admission.destroy({ where: {} });
    
    // Reset bed assignments
    await BedMySQL.update({ patientId: null }, { where: {} });
    
    await Patient.destroy({ where: {} });
    
    console.log('✅ Database cleared successfully');
    
    // Ensure beds exist (1-12 for HDU)
    console.log('🛏️ Setting up beds...');
    for (let i = 1; i <= 12; i++) {
      await BedMySQL.upsert({
        id: i,
        bedNumber: `HDU-${String(i).padStart(2, '0')}`,
        ward: 'HDU',
        bedType: 'HDU',
        isOccupied: false,
        patientId: null
      });
    }
    
    console.log('📊 Creating realistic patient scenario...');
    
    for (const patientInfo of realisticPatients) {
      const { patientData, bedId, admissionDaysAgo } = patientInfo;
      
      console.log(`👤 Creating patient: ${patientData.fullName}`);
      
      // Create patient
      const patient = await Patient.create({
        patientNumber: patientData.patientNumber,
        fullName: patientData.fullName,
        nicPassport: patientData.nicPassport,
        dateOfBirth: patientData.dateOfBirth,
        age: patientData.age,
        gender: patientData.gender,
        maritalStatus: patientData.maritalStatus,
        contactNumber: patientData.contactNumber,
        email: patientData.email,
        address: patientData.address,
        knownAllergies: patientData.knownAllergies,
        medicalHistory: patientData.medicalHistory,
        currentMedications: patientData.currentMedications,
        pregnancyStatus: patientData.pregnancyStatus,
        bloodType: patientData.bloodType,
        initialDiagnosis: patientData.initialDiagnosis
      });
      
      // Create emergency contact
      await EmergencyContact.create({
        patientId: patient.id,
        name: patientData.emergencyContactName,
        relationship: patientData.emergencyContactRelationship,
        contactNumber: patientData.emergencyContactNumber
      });
      
      // Create medical record
      await MedicalRecord.create({
        patientId: patient.id,
        medicalHistory: patientData.medicalHistory,
        knownAllergies: patientData.knownAllergies,
        currentMedications: patientData.currentMedications,
        bloodType: patientData.bloodType,
        initialDiagnosis: patientData.initialDiagnosis
      });
      
      // Create admission with realistic date
      const admission = await Admission.create({
        patientId: patient.id,
        admissionDateTime: generateAdmissionDate(admissionDaysAgo),
        department: patientData.department,
        consultantInCharge: patientData.consultantInCharge,
        status: "Active"
      });
      
      // Create multiple critical factor updates
      const criticalFactorUpdates = generateCriticalFactorUpdates(patient.id, admissionDaysAgo);
      await CriticalFactor.bulkCreate(criticalFactorUpdates);
      
      // Assign to bed
      await BedMySQL.update(
        { 
          patientId: patient.id,
          isOccupied: true
        },
        { where: { id: bedId } }
      );
      
      console.log(`✅ Patient ${patientData.fullName} created and assigned to bed ${bedId}`);
      console.log(`   📅 Admitted ${admissionDaysAgo} days ago`);
      console.log(`   📊 ${criticalFactorUpdates.length} critical factor updates recorded`);
    }
    
    console.log('\n🎉 Realistic scenario creation completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 6 HDU patients with realistic data');
    console.log('- Patients admitted on different dates (1-7 days ago)');
    console.log('- Multiple critical factor updates for each patient');
    console.log('- Complete medical histories and emergency contacts');
    console.log('- Beds 1-6 occupied, beds 7-12 available (6 available beds total)');
    console.log('\n🛏️ Bed Status:');
    console.log('- Occupied: Beds 1-6');
    console.log('- Available: Beds 7-12 (6 beds available for new admissions)');
    console.log('\n✅ Perfect! You now have exactly 6 available beds as requested.');
    
  } catch (error) {
    console.error('❌ Error creating realistic scenario:', error);
  } finally {
    await sequelize.close();
  }
}

clearAndPopulateDatabase(); 