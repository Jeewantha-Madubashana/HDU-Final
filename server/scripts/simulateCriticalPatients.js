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

// Helper function to generate critical vital signs that will trigger alerts
const generateCriticalVitalSigns = (patientType) => {
  const baseDate = new Date();
  
  switch (patientType) {
    case 'cardiac':
      return {
        heartRate: Math.random() > 0.5 ? 135 : 45, // Critical: >120 or <60
        respiratoryRate: 22,
        bloodPressureSystolic: 165, // Critical: >140
        bloodPressureDiastolic: 95, // Critical: >90
        spO2: 97,
        temperature: 37.2,
        glasgowComaScale: 14,
        painScale: 8, // Critical: >7
        bloodGlucose: 120,
        urineOutput: 800,
        recordedAt: new Date(baseDate.getTime() - Math.random() * 60 * 60 * 1000) // Within last hour
      };
    
    case 'respiratory':
      return {
        heartRate: 95,
        respiratoryRate: 28, // Critical: >25
        bloodPressureSystolic: 125,
        bloodPressureDiastolic: 75,
        spO2: 88, // Critical: <95
        temperature: 39.1, // Critical: >38.5
        glasgowComaScale: 13,
        painScale: 6,
        bloodGlucose: 110,
        urineOutput: 650,
        recordedAt: new Date(baseDate.getTime() - Math.random() * 60 * 60 * 1000)
      };
    
    case 'neurological':
      return {
        heartRate: 78,
        respiratoryRate: 18,
        bloodPressureSystolic: 110,
        bloodPressureDiastolic: 70,
        spO2: 96,
        temperature: 37.8,
        glasgowComaScale: 9, // Critical: <13
        painScale: 4,
        bloodGlucose: 85,
        urineOutput: 720,
        recordedAt: new Date(baseDate.getTime() - Math.random() * 60 * 60 * 1000)
      };
    
    case 'diabetic':
      return {
        heartRate: 88,
        respiratoryRate: 20,
        bloodPressureSystolic: 130,
        bloodPressureDiastolic: 80,
        spO2: 94, // Critical: <95
        temperature: 38.8, // Critical: >38.5
        glasgowComaScale: 12, // Critical: <13
        painScale: 5,
        bloodGlucose: 245, // Critical: >200
        urineOutput: 1200,
        recordedAt: new Date(baseDate.getTime() - Math.random() * 60 * 60 * 1000)
      };
    
    case 'hypotensive':
      return {
        heartRate: 125, // Critical: >120
        respiratoryRate: 24,
        bloodPressureSystolic: 85, // Critical: <90
        bloodPressureDiastolic: 55, // Critical: <60
        spO2: 92, // Critical: <95
        temperature: 35.2, // Critical: <35.5
        glasgowComaScale: 11, // Critical: <13
        painScale: 8, // Critical: >7
        bloodGlucose: 65, // Critical: <70
        urineOutput: 450,
        recordedAt: new Date(baseDate.getTime() - Math.random() * 60 * 60 * 1000)
      };
    
    default:
      return {
        heartRate: 130, // Critical: >120
        respiratoryRate: 26, // Critical: >25
        bloodPressureSystolic: 150, // Critical: >140
        bloodPressureDiastolic: 95, // Critical: >90
        spO2: 90, // Critical: <95
        temperature: 39.0, // Critical: >38.5
        glasgowComaScale: 10, // Critical: <13
        painScale: 9, // Critical: >7
        bloodGlucose: 220, // Critical: >200
        urineOutput: 400,
        recordedAt: new Date(baseDate.getTime() - Math.random() * 60 * 60 * 1000)
      };
  }
};

const criticalPatients = [
  {
    patientData: {
      patientNumber: "HDU-2025-C001",
      fullName: "Nimal Perera",
      nicPassport: "198501234567",
      dateOfBirth: "1985-03-15",
      age: 39,
      gender: "Male",
      maritalStatus: "Married",
      contactNumber: "+94 71 555 0001",
      email: "nimal.p@email.com",
      address: "123 Main Street, Colombo 05",
      emergencyContactName: "Kamala Perera",
      emergencyContactRelationship: "Spouse",
      emergencyContactNumber: "+94 71 555 0002",
      knownAllergies: "Penicillin, Latex",
      medicalHistory: "Hypertension, Previous MI (2022)",
      currentMedications: "Metoprolol, Aspirin, Atorvastatin",
      pregnancyStatus: "Not Applicable",
      bloodType: "O+",
      initialDiagnosis: "Acute coronary syndrome with cardiogenic shock",
      department: "ICU",
      consultantInCharge: "Dr. Rajapaksa"
    },
    bedId: 1,
    admissionDaysAgo: 3,
    patientType: 'cardiac'
  },
  {
    patientData: {
      patientNumber: "HDU-2025-C002",
      fullName: "Sita Kumari",
      nicPassport: "197812345678",
      dateOfBirth: "1978-08-22",
      age: 46,
      gender: "Female",
      maritalStatus: "Married",
      contactNumber: "+94 77 555 0003",
      email: "sita.k@email.com",
      address: "456 Hospital Road, Kandy",
      emergencyContactName: "Ravi Kumari",
      emergencyContactRelationship: "Spouse",
      emergencyContactNumber: "+94 77 555 0004",
      knownAllergies: "Sulfa drugs",
      medicalHistory: "Asthma, COPD",
      currentMedications: "Salbutamol, Prednisolone, Theophylline",
      pregnancyStatus: "Not Applicable",
      bloodType: "A+",
      initialDiagnosis: "Acute exacerbation of COPD with respiratory failure",
      department: "ICU",
      consultantInCharge: "Dr. Silva"
    },
    bedId: 2,
    admissionDaysAgo: 5,
    patientType: 'respiratory'
  },
  {
    patientData: {
      patientNumber: "HDU-2025-C003",
      fullName: "Mahinda Fernando",
      nicPassport: "196505678901",
      dateOfBirth: "1965-11-10",
      age: 59,
      gender: "Male",
      maritalStatus: "Widowed",
      contactNumber: "+94 76 555 0005",
      email: "mahinda.f@email.com",
      address: "789 Lake View, Galle",
      emergencyContactName: "Sunil Fernando",
      emergencyContactRelationship: "Child",
      emergencyContactNumber: "+94 76 555 0006",
      knownAllergies: "None known",
      medicalHistory: "Previous stroke (2020), Epilepsy",
      currentMedications: "Phenytoin, Warfarin, Atorvastatin",
      pregnancyStatus: "Not Applicable",
      bloodType: "B+",
      initialDiagnosis: "Acute stroke with decreased level of consciousness",
      department: "ICU",
      consultantInCharge: "Dr. Wijesinghe"
    },
    bedId: 3,
    admissionDaysAgo: 1,
    patientType: 'neurological'
  },
  {
    patientData: {
      patientNumber: "HDU-2025-C004",
      fullName: "Priya Jayawardena",
      nicPassport: "199203456789",
      dateOfBirth: "1992-06-18",
      age: 32,
      gender: "Female",
      maritalStatus: "Single",
      contactNumber: "+94 78 555 0007",
      email: "priya.j@email.com",
      address: "321 Temple Road, Matara",
      emergencyContactName: "Mala Jayawardena",
      emergencyContactRelationship: "Parent",
      emergencyContactNumber: "+94 78 555 0008",
      knownAllergies: "Iodine contrast",
      medicalHistory: "Type 1 Diabetes, Diabetic nephropathy",
      currentMedications: "Insulin, Lisinopril, Metformin",
      pregnancyStatus: "Not Applicable",
      bloodType: "AB-",
      initialDiagnosis: "Diabetic ketoacidosis with severe dehydration",
      department: "Medical",
      consultantInCharge: "Dr. Gunasekara"
    },
    bedId: 4,
    admissionDaysAgo: 2,
    patientType: 'diabetic'
  },
  {
    patientData: {
      patientNumber: "HDU-2025-C005",
      fullName: "Kamal Mendis",
      nicPassport: "197109876543",
      dateOfBirth: "1971-12-03",
      age: 53,
      gender: "Male",
      maritalStatus: "Divorced",
      contactNumber: "+94 75 555 0009",
      email: "kamal.m@email.com",
      address: "654 Hill Street, Ratnapura",
      emergencyContactName: "Anura Mendis",
      emergencyContactRelationship: "Other",
      emergencyContactNumber: "+94 75 555 0010",
      knownAllergies: "Codeine, NSAIDs",
      medicalHistory: "Chronic kidney disease, Sepsis history",
      currentMedications: "Furosemide, Amlodipine, Allopurinol",
      pregnancyStatus: "Not Applicable",
      bloodType: "O-",
      initialDiagnosis: "Septic shock with multi-organ dysfunction",
      department: "ICU",
      consultantInCharge: "Dr. Perera"
    },
    bedId: 5,
    admissionDaysAgo: 4,
    patientType: 'hypotensive'
  }
];

async function simulateCriticalPatients() {
  try {
    console.log('🚨 Starting Critical Patient Simulation...');
    
    // Clear existing data in correct order (respecting foreign key constraints)
    console.log('🧹 Clearing existing data...');
    await CriticalFactor.destroy({ where: {} });
    await MedicalRecord.destroy({ where: {} });
    await EmergencyContact.destroy({ where: {} });
    await Admission.destroy({ where: {} });
    
    // Reset bed assignments
    await BedMySQL.update({ patientId: null }, { where: {} });
    
    await Patient.destroy({ where: {} });
    
    console.log('✅ Database cleared successfully');
    
    // Ensure beds exist (1-10 for HDU)
    console.log('🛏️ Setting up beds...');
    for (let i = 1; i <= 10; i++) {
      await BedMySQL.upsert({
        id: i,
        bedNumber: `HDU-${String(i).padStart(2, '0')}`,
        patientId: null
      });
    }
    
    console.log('🚨 Creating 5 critical patients with alerts...');
    
    for (const patientInfo of criticalPatients) {
      const { patientData, bedId, admissionDaysAgo, patientType } = patientInfo;
      
      console.log(`👤 Creating critical patient: ${patientData.fullName} (${patientType})`);
      
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
      
      // Create CRITICAL vital signs that will trigger alerts
      const criticalVitals = generateCriticalVitalSigns(patientType);
      await CriticalFactor.create({
        patientId: patient.id,
        ...criticalVitals
      });
      
      // Assign to bed
      await BedMySQL.update(
        { 
          patientId: patient.id
        },
        { where: { id: bedId } }
      );
      
      console.log(`🚨 Critical patient ${patientData.fullName} created and assigned to bed ${bedId}`);
      console.log(`   📅 Admitted ${admissionDaysAgo} days ago`);
      console.log(`   ⚠️  Critical vitals recorded - will trigger alerts!`);
      
      // Log critical values for verification
      const criticalValues = [];
      if (criticalVitals.heartRate > 120 || criticalVitals.heartRate < 60) 
        criticalValues.push(`Heart Rate: ${criticalVitals.heartRate}`);
      if (criticalVitals.respiratoryRate > 25 || criticalVitals.respiratoryRate < 12) 
        criticalValues.push(`Respiratory Rate: ${criticalVitals.respiratoryRate}`);
      if (criticalVitals.bloodPressureSystolic > 140 || criticalVitals.bloodPressureSystolic < 90) 
        criticalValues.push(`BP Systolic: ${criticalVitals.bloodPressureSystolic}`);
      if (criticalVitals.bloodPressureDiastolic > 90 || criticalVitals.bloodPressureDiastolic < 60) 
        criticalValues.push(`BP Diastolic: ${criticalVitals.bloodPressureDiastolic}`);
      if (criticalVitals.spO2 < 95) 
        criticalValues.push(`SpO2: ${criticalVitals.spO2}%`);
      if (criticalVitals.temperature > 38.5 || criticalVitals.temperature < 35.5) 
        criticalValues.push(`Temperature: ${criticalVitals.temperature}°C`);
      if (criticalVitals.glasgowComaScale < 13) 
        criticalValues.push(`GCS: ${criticalVitals.glasgowComaScale}`);
      if (criticalVitals.painScale > 7) 
        criticalValues.push(`Pain Scale: ${criticalVitals.painScale}`);
      if (criticalVitals.bloodGlucose > 200 || criticalVitals.bloodGlucose < 70) 
        criticalValues.push(`Blood Glucose: ${criticalVitals.bloodGlucose}`);
      
      console.log(`   🔥 Critical values: ${criticalValues.join(', ')}`);
    }
    
    console.log('\n🎉 Critical Patient Simulation completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 5 HDU patients with CRITICAL vital signs');
    console.log('- All patients will trigger critical alerts in the system');
    console.log('- Patients admitted on different dates (1-5 days ago)');
    console.log('- Complete medical histories and emergency contacts');
    console.log('- Beds 1-5 occupied with critical patients');
    console.log('- Beds 6-12 available (7 available beds total)');
    
    console.log('\n🚨 Alert Types Generated:');
    console.log('- Bed 1: Cardiac patient (High BP, Pain, Heart Rate issues)');
    console.log('- Bed 2: Respiratory patient (Low SpO2, High temp, High RR)');
    console.log('- Bed 3: Neurological patient (Low GCS)');
    console.log('- Bed 4: Diabetic patient (High glucose, Low SpO2, Low GCS)');
    console.log('- Bed 5: Hypotensive patient (Multiple critical values)');
    
    console.log('\n✅ Perfect! Your system now has 5 critical patients with active alerts.');
    console.log('🔄 Refresh your dashboard to see the critical alerts appear!');
    
  } catch (error) {
    console.error('❌ Error creating critical patient simulation:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

simulateCriticalPatients(); 