import { sequelize, testConnection } from "../config/database.js";
import {
  BedMySQL,
  Patient,
  EmergencyContact,
  MedicalRecord,
  Admission,
  PatientDocument,
  UserMySQLModel,
  CriticalFactor,
  AuditLog,
} from "../config/mysqlDB.js";

// Realistic patient data for ICU simulation
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
    admissionDaysAgo: 5,
    patientType: "respiratory_failure"
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
    admissionDaysAgo: 3,
    patientType: "post_operative"
  },
  {
    patientData: {
      patientNumber: "HDU-2025-003",
      fullName: "Priya Rajapakse",
      nicPassport: "199203156789",
      dateOfBirth: "1992-03-15",
      age: 33,
      gender: "Female",
      maritalStatus: "Single",
      contactNumber: "+94 76 456 7890",
      email: "priya.r@email.com",
      address: "123 Temple Road, Kandy",
      emergencyContactName: "Saman Rajapakse",
      emergencyContactRelationship: "Parent",
      emergencyContactNumber: "+94 76 456 7891",
      knownAllergies: "Shellfish, Iodine",
      medicalHistory: "Asthma, Previous pneumothorax (2021)",
      currentMedications: "Salbutamol inhaler, Prednisolone",
      pregnancyStatus: "Not Pregnant",
      bloodType: "A+",
      initialDiagnosis: "Severe asthma exacerbation with acute respiratory distress",
      department: "ICU",
      consultantInCharge: "Dr. Mendis"
    },
    bedId: 3,
    admissionDaysAgo: 2,
    patientType: "asthma_exacerbation"
  },
  {
    patientData: {
      patientNumber: "HDU-2025-004",
      fullName: "Ravi Gunasekara",
      nicPassport: "197511234567",
      dateOfBirth: "1975-11-08",
      age: 49,
      gender: "Male",
      maritalStatus: "Divorced",
      contactNumber: "+94 78 567 8901",
      email: "ravi.g@email.com",
      address: "67 Station Road, Gampaha",
      emergencyContactName: "Nimal Gunasekara",
      emergencyContactRelationship: "Parent",
      emergencyContactNumber: "+94 78 567 8902",
      knownAllergies: "NSAIDS",
      medicalHistory: "Chronic kidney disease, Hypertension, History of stroke (2020)",
      currentMedications: "ACE inhibitors, Calcium channel blockers, Aspirin",
      pregnancyStatus: "Not Applicable",
      bloodType: "AB+",
      initialDiagnosis: "Acute kidney injury with fluid overload",
      department: "Medical",
      consultantInCharge: "Dr. Jayawardena"
    },
    bedId: 4,
    admissionDaysAgo: 7,
    patientType: "kidney_failure"
  },
  {
    patientData: {
      patientNumber: "HDU-2025-005",
      fullName: "Sanduni Perera",
      nicPassport: "200001123456",
      dateOfBirth: "2000-01-25",
      age: 25,
      gender: "Female",
      maritalStatus: "Single",
      contactNumber: "+94 70 678 9012",
      email: "sanduni.p@email.com",
      address: "89 Hill Street, Nuwara Eliya",
      emergencyContactName: "Kumari Perera",
      emergencyContactRelationship: "Parent",
      emergencyContactNumber: "+94 70 678 9013",
      knownAllergies: "None known",
      medicalHistory: "No significant past medical history",
      currentMedications: "None",
      pregnancyStatus: "Not Pregnant",
      bloodType: "O-",
      initialDiagnosis: "Severe head trauma following motor vehicle accident",
      department: "ICU",
      consultantInCharge: "Dr. Wijesinghe"
    },
    bedId: 5,
    admissionDaysAgo: 1,
    patientType: "head_trauma"
  }
];

// Generate realistic admission date
const generateAdmissionDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
};

// Generate critical vital signs based on patient condition
const generateCriticalVitalSigns = (patientType, recordedAt = new Date()) => {
  const baseVitals = {
    recordedAt,
    recordedBy: null,
    isAmended: false,
    amendedBy: null,
    amendedAt: null,
    amendmentReason: null
  };

  switch (patientType) {
    case 'respiratory_failure':
      return {
        ...baseVitals,
        heartRate: 110 + Math.floor(Math.random() * 20), // 110-130
        respiratoryRate: 28 + Math.floor(Math.random() * 8), // 28-35
        bloodPressureSystolic: 90 + Math.floor(Math.random() * 20), // 90-110
        bloodPressureDiastolic: 50 + Math.floor(Math.random() * 15), // 50-65
        spO2: 85 + Math.floor(Math.random() * 8), // 85-92 (critical)
        temperature: 38.5 + Math.random() * 1.5, // 38.5-40.0
        glasgowComaScale: 13 + Math.floor(Math.random() * 3), // 13-15
        painScale: 6 + Math.floor(Math.random() * 3), // 6-8
        bloodGlucose: 140 + Math.floor(Math.random() * 60), // 140-200
        urineOutput: 20 + Math.random() * 30 // 20-50ml/hr (low)
      };

    case 'post_operative':
      return {
        ...baseVitals,
        heartRate: 95 + Math.floor(Math.random() * 25), // 95-120
        respiratoryRate: 22 + Math.floor(Math.random() * 8), // 22-30
        bloodPressureSystolic: 100 + Math.floor(Math.random() * 30), // 100-130
        bloodPressureDiastolic: 60 + Math.floor(Math.random() * 20), // 60-80
        spO2: 94 + Math.floor(Math.random() * 5), // 94-98
        temperature: 37.8 + Math.random() * 1.2, // 37.8-39.0
        glasgowComaScale: 14 + Math.floor(Math.random() * 2), // 14-15
        painScale: 7 + Math.floor(Math.random() * 3), // 7-9
        bloodGlucose: 180 + Math.floor(Math.random() * 120), // 180-300 (diabetic)
        urineOutput: 40 + Math.random() * 40 // 40-80ml/hr
      };

    case 'asthma_exacerbation':
      return {
        ...baseVitals,
        heartRate: 120 + Math.floor(Math.random() * 20), // 120-140
        respiratoryRate: 30 + Math.floor(Math.random() * 10), // 30-40
        bloodPressureSystolic: 85 + Math.floor(Math.random() * 25), // 85-110
        bloodPressureDiastolic: 45 + Math.floor(Math.random() * 20), // 45-65
        spO2: 88 + Math.floor(Math.random() * 7), // 88-94
        temperature: 37.2 + Math.random() * 0.8, // 37.2-38.0
        glasgowComaScale: 12 + Math.floor(Math.random() * 3), // 12-14
        painScale: 4 + Math.floor(Math.random() * 4), // 4-7
        bloodGlucose: 110 + Math.floor(Math.random() * 40), // 110-150
        urineOutput: 60 + Math.random() * 40 // 60-100ml/hr
      };

    case 'kidney_failure':
      return {
        ...baseVitals,
        heartRate: 100 + Math.floor(Math.random() * 30), // 100-130
        respiratoryRate: 24 + Math.floor(Math.random() * 8), // 24-32
        bloodPressureSystolic: 160 + Math.floor(Math.random() * 40), // 160-200
        bloodPressureDiastolic: 95 + Math.floor(Math.random() * 25), // 95-120
        spO2: 92 + Math.floor(Math.random() * 6), // 92-97
        temperature: 37.0 + Math.random() * 1.0, // 37.0-38.0
        glasgowComaScale: 13 + Math.floor(Math.random() * 3), // 13-15
        painScale: 5 + Math.floor(Math.random() * 4), // 5-8
        bloodGlucose: 120 + Math.floor(Math.random() * 80), // 120-200
        urineOutput: 5 + Math.random() * 15 // 5-20ml/hr (very low)
      };

    case 'head_trauma':
      return {
        ...baseVitals,
        heartRate: 60 + Math.floor(Math.random() * 20), // 60-80 (bradycardia)
        respiratoryRate: 10 + Math.floor(Math.random() * 8), // 10-18 (irregular)
        bloodPressureSystolic: 180 + Math.floor(Math.random() * 40), // 180-220 (hypertension)
        bloodPressureDiastolic: 100 + Math.floor(Math.random() * 30), // 100-130
        spO2: 96 + Math.floor(Math.random() * 4), // 96-99
        temperature: 36.5 + Math.random() * 1.5, // 36.5-38.0
        glasgowComaScale: 6 + Math.floor(Math.random() * 5), // 6-10 (severe)
        painScale: 2 + Math.floor(Math.random() * 4), // 2-5 (reduced consciousness)
        bloodGlucose: 90 + Math.floor(Math.random() * 60), // 90-150
        urineOutput: 80 + Math.random() * 60 // 80-140ml/hr
      };

    default:
      return {
        ...baseVitals,
        heartRate: 80 + Math.floor(Math.random() * 40),
        respiratoryRate: 16 + Math.floor(Math.random() * 8),
        bloodPressureSystolic: 110 + Math.floor(Math.random() * 40),
        bloodPressureDiastolic: 70 + Math.floor(Math.random() * 20),
        spO2: 95 + Math.floor(Math.random() * 5),
        temperature: 36.5 + Math.random() * 2,
        glasgowComaScale: 13 + Math.floor(Math.random() * 3),
        painScale: 3 + Math.floor(Math.random() * 5),
        bloodGlucose: 90 + Math.floor(Math.random() * 60),
        urineOutput: 50 + Math.random() * 100
      };
  }
};

// Generate multiple critical factor updates over time
const generateCriticalFactorUpdates = (patientType, patientId, admissionDaysAgo) => {
  const updates = [];
  const totalUpdates = Math.min(admissionDaysAgo * 3, 15); // Max 15 updates

  for (let i = 0; i < totalUpdates; i++) {
    const hoursAgo = i * (admissionDaysAgo * 24 / totalUpdates);
    const updateDate = new Date();
    updateDate.setHours(updateDate.getHours() - hoursAgo);
    
    updates.push({
      patientId,
      ...generateCriticalVitalSigns(patientType, updateDate)
    });
  }
  
  return updates;
};

// Create sample users for the system
const createSampleUsers = async () => {
  const sampleUsers = [
    {
      username: "nurse_mary",
      password: "$2b$10$example_hashed_password_1",
      email: "mary.nurse@hospital.lk",
      registrationNumber: "RN001",
      ward: "ICU",
      mobileNumber: "+94 71 111 1111",
      sex: "Female",
      role: "Nurse",
      nameWithInitials: "M.K. Silva",
      speciality: "Critical Care",
      grade: "Senior Staff Nurse"
    },
    {
      username: "dr_perera",
      password: "$2b$10$example_hashed_password_2",
      email: "dr.perera@hospital.lk",
      registrationNumber: "SLMC001",
      ward: "ICU",
      mobileNumber: "+94 77 222 2222",
      sex: "Male",
      role: "Consultant",
      nameWithInitials: "Dr. A.B. Perera",
      speciality: "Pulmonology",
      grade: "Consultant Physician"
    },
    {
      username: "mo_fernando",
      password: "$2b$10$example_hashed_password_3",
      email: "mo.fernando@hospital.lk",
      registrationNumber: "SLMC002",
      ward: "Surgery",
      mobileNumber: "+94 76 333 3333",
      sex: "Male",
      role: "Medical Officer",
      nameWithInitials: "Dr. K.L. Fernando",
      speciality: "General Surgery",
      grade: "Medical Officer"
    }
  ];

  for (const userData of sampleUsers) {
    await UserMySQLModel.create(userData);
  }
  
  console.log('✅ Created sample users');
};

// Main initialization function
async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Test database connection
    console.log('🔗 Testing database connection...');
    const connectionSuccessful = await testConnection();
    if (!connectionSuccessful) {
      throw new Error('Database connection failed');
    }
    
    // Sync all models (create tables)
    console.log('📋 Creating database tables...');
    await sequelize.sync({ force: true }); // This will drop existing tables and recreate them
    console.log('✅ All tables created successfully');
    
    // Create sample users
    console.log('👥 Creating sample users...');
    await createSampleUsers();
    
    // Create beds (12 ICU beds)
    console.log('🛏️ Creating ICU beds...');
    const beds = [];
    for (let i = 1; i <= 12; i++) {
      beds.push({
        bedNumber: `ICU-${String(i).padStart(2, '0')}`,
        patientId: null
      });
    }
    await BedMySQL.bulkCreate(beds);
    console.log('✅ Created 12 ICU beds');
    
    // Create realistic patients with full medical scenarios
    console.log('👤 Creating realistic patients...');
    
    for (const patientInfo of realisticPatients) {
      const { patientData, bedId, admissionDaysAgo, patientType } = patientInfo;
      
      console.log(`   Creating patient: ${patientData.fullName} (${patientType})`);
      
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
        address: patientData.address
      });
      
      // Create emergency contact
      await EmergencyContact.create({
        patientId: patient.id,
        name: patientData.emergencyContactName,
        relationship: patientData.emergencyContactRelationship,
        contactNumber: patientData.emergencyContactNumber,
        isPrimary: true
      });
      
      // Create medical record
      await MedicalRecord.create({
        patientId: patient.id,
        knownAllergies: patientData.knownAllergies,
        medicalHistory: patientData.medicalHistory,
        currentMedications: patientData.currentMedications,
        pregnancyStatus: patientData.pregnancyStatus,
        bloodType: patientData.bloodType,
        initialDiagnosis: patientData.initialDiagnosis
      });
      
      // Create admission with realistic date
      await Admission.create({
        patientId: patient.id,
        admissionDateTime: generateAdmissionDate(admissionDaysAgo),
        department: patientData.department,
        consultantInCharge: patientData.consultantInCharge,
        status: "Active"
      });
      
      // Create multiple critical factor updates over time
      const criticalFactorUpdates = generateCriticalFactorUpdates(patientType, patient.id, admissionDaysAgo);
      await CriticalFactor.bulkCreate(criticalFactorUpdates);
      
      // Assign to bed
      await BedMySQL.update(
        { patientId: patient.id },
        { where: { id: bedId } }
      );
      
      console.log(`   ✅ Patient ${patient.fullName} assigned to bed ICU-${String(bedId).padStart(2, '0')}`);
      console.log(`   📊 Created ${criticalFactorUpdates.length} vital sign records`);
    }
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Database tables: Created and synchronized`);
    console.log(`   • Users: 3 sample users created`);
    console.log(`   • Beds: 12 ICU beds created`);
    console.log(`   • Patients: 5 realistic patients with complete medical records`);
    console.log(`   • Vital signs: Multiple time-series data for each patient`);
    console.log(`   • Simulation: Ready for ICU monitoring and alerts`);
    
    // Display patient summary
    console.log('\n👥 Patient Summary:');
    for (const patientInfo of realisticPatients) {
      const { patientData, bedId, patientType } = patientInfo;
      console.log(`   • ${patientData.fullName} (${patientType}) - Bed ICU-${String(bedId).padStart(2, '0')}`);
      console.log(`     Diagnosis: ${patientData.initialDiagnosis}`);
    }
    
    console.log('\n🚨 The system is now ready with realistic ICU scenarios!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    // Don't close the connection here as it might be needed by other parts of the application
    console.log('\n✅ Database initialization script completed');
  }
}

// Run the initialization if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export default initializeDatabase; 