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

const icuPatients = [
  {
    patientData: {
      patientNumber: "ICU-2025-001",
      fullName: "Robert Chen",
      nicPassport: "198512345678",
      dateOfBirth: "1985-06-15",
      age: 40,
      gender: "Male",
      maritalStatus: "Married",
      contactNumber: "+94 71 123 4567",
      email: "robert.chen@email.com",
      address: "123 Lake View Road, Colombo 03",
      emergencyContactName: "Sarah Chen",
      emergencyContactRelationship: "Spouse",
      emergencyContactNumber: "+94 71 123 4568",
      knownAllergies: "Penicillin, Sulfa drugs",
      medicalHistory: "Hypertension, Type 2 Diabetes, Previous MI (2023)",
      currentMedications: "Metformin, Lisinopril, Aspirin, Atorvastatin",
      pregnancyStatus: "Not Applicable",
      bloodType: "A+",
      initialDiagnosis: "Acute myocardial infarction with cardiogenic shock",
      admissionDateTime: "2025-08-05T06:30:00.000Z",
      department: "ICU",
      consultantInCharge: "Dr. Rajapaksa"
    },
    bedId: 1,
    criticalFactors: {
      heartRate: 125,
      bloodPressure: "85/60",
      temperature: 37.8,
      spO2: 88,
      respiratoryRate: 28,
      gcs: 12,
      painScale: 8,
      bloodGlucose: 180,
      urineOutput: 15
    }
  },
  {
    patientData: {
      patientNumber: "ICU-2025-002",
      fullName: "Maria Rodriguez",
      nicPassport: "199003456789",
      dateOfBirth: "1990-03-22",
      age: 35,
      gender: "Female",
      maritalStatus: "Single",
      contactNumber: "+94 71 234 5678",
      email: "maria.rodriguez@email.com",
      address: "456 Hill Street, Kandy",
      emergencyContactName: "Carlos Rodriguez",
      emergencyContactRelationship: "Other",
      emergencyContactNumber: "+94 71 234 5679",
      knownAllergies: "Latex, Iodine",
      medicalHistory: "Asthma, Obesity, Sleep apnea",
      currentMedications: "Albuterol, CPAP therapy",
      pregnancyStatus: "Not Applicable",
      bloodType: "O+",
      initialDiagnosis: "Severe acute respiratory distress syndrome (ARDS)",
      admissionDateTime: "2025-08-05T08:15:00.000Z",
      department: "ICU",
      consultantInCharge: "Dr. Perera"
    },
    bedId: 2,
    criticalFactors: {
      heartRate: 110,
      bloodPressure: "95/70",
      temperature: 38.5,
      spO2: 82,
      respiratoryRate: 35,
      gcs: 10,
      painScale: 6,
      bloodGlucose: 140,
      urineOutput: 25
    }
  },
  {
    patientData: {
      patientNumber: "ICU-2025-003",
      fullName: "James Thompson",
      nicPassport: "197811567890",
      dateOfBirth: "1978-11-08",
      age: 47,
      gender: "Male",
      maritalStatus: "Divorced",
      contactNumber: "+94 71 345 6789",
      email: "james.thompson@email.com",
      address: "789 Beach Road, Galle",
      emergencyContactName: "Lisa Thompson",
      emergencyContactRelationship: "Other",
      emergencyContactNumber: "+94 71 345 6790",
      knownAllergies: "None",
      medicalHistory: "Chronic kidney disease, Hypertension",
      currentMedications: "Furosemide, Enalapril, Calcium carbonate",
      pregnancyStatus: "Not Applicable",
      bloodType: "B+",
      initialDiagnosis: "Acute kidney injury with fluid overload",
      admissionDateTime: "2025-08-05T09:45:00.000Z",
      department: "ICU",
      consultantInCharge: "Dr. Silva"
    },
    bedId: 3,
    criticalFactors: {
      heartRate: 95,
      bloodPressure: "160/95",
      temperature: 36.9,
      spO2: 94,
      respiratoryRate: 22,
      gcs: 15,
      painScale: 4,
      bloodGlucose: 120,
      urineOutput: 8
    }
  },
  {
    patientData: {
      patientNumber: "ICU-2025-004",
      fullName: "Jennifer Lee",
      nicPassport: "199504678901",
      dateOfBirth: "1995-04-12",
      age: 30,
      gender: "Female",
      maritalStatus: "Married",
      contactNumber: "+94 71 456 7890",
      email: "jennifer.lee@email.com",
      address: "321 Garden Avenue, Jaffna",
      emergencyContactName: "Michael Lee",
      emergencyContactRelationship: "Spouse",
      emergencyContactNumber: "+94 71 456 7891",
      knownAllergies: "Penicillin, Morphine",
      medicalHistory: "Migraines, Depression",
      currentMedications: "Sumatriptan, Sertraline",
      pregnancyStatus: "Not Applicable",
      bloodType: "AB+",
      initialDiagnosis: "Status epilepticus with altered mental status",
      admissionDateTime: "2025-08-05T11:20:00.000Z",
      department: "ICU",
      consultantInCharge: "Dr. Fernando"
    },
    bedId: 4,
    criticalFactors: {
      heartRate: 140,
      bloodPressure: "130/85",
      temperature: 37.2,
      spO2: 96,
      respiratoryRate: 18,
      gcs: 8,
      painScale: 2,
      bloodGlucose: 110,
      urineOutput: 30
    }
  },
  {
    patientData: {
      patientNumber: "ICU-2025-005",
      fullName: "David Wilson",
      nicPassport: "196509789012",
      dateOfBirth: "1965-09-30",
      age: 60,
      gender: "Male",
      maritalStatus: "Married",
      contactNumber: "+94 71 567 8901",
      email: "david.wilson@email.com",
      address: "654 Mountain View, Anuradhapura",
      emergencyContactName: "Helen Wilson",
      emergencyContactRelationship: "Spouse",
      emergencyContactNumber: "+94 71 567 8902",
      knownAllergies: "Iodine, Shellfish",
      medicalHistory: "Coronary artery disease, Previous CABG (2022), COPD",
      currentMedications: "Aspirin, Metoprolol, Atorvastatin, Albuterol",
      pregnancyStatus: "Not Applicable",
      bloodType: "O-",
      initialDiagnosis: "Acute exacerbation of COPD with respiratory failure",
      admissionDateTime: "2025-08-05T13:10:00.000Z",
      department: "ICU",
      consultantInCharge: "Dr. Wijesinghe"
    },
    bedId: 5,
    criticalFactors: {
      heartRate: 105,
      bloodPressure: "140/90",
      temperature: 37.1,
      spO2: 85,
      respiratoryRate: 32,
      gcs: 14,
      painScale: 5,
      bloodGlucose: 135,
      urineOutput: 20
    }
  },
  {
    patientData: {
      patientNumber: "ICU-2025-006",
      fullName: "Amanda Garcia",
      nicPassport: "198807890123",
      dateOfBirth: "1988-07-15",
      age: 37,
      gender: "Female",
      maritalStatus: "Single",
      contactNumber: "+94 71 678 9012",
      email: "amanda.garcia@email.com",
      address: "987 Sunset Boulevard, Negombo",
      emergencyContactName: "Roberto Garcia",
      emergencyContactRelationship: "Parent",
      emergencyContactNumber: "+94 71 678 9013",
      knownAllergies: "Sulfa drugs, Latex",
      medicalHistory: "Lupus, Hypertension, Previous stroke (2021)",
      currentMedications: "Prednisone, Hydroxychloroquine, Lisinopril",
      pregnancyStatus: "Not Applicable",
      bloodType: "A-",
      initialDiagnosis: "Septic shock secondary to pneumonia",
      admissionDateTime: "2025-08-05T14:30:00.000Z",
      department: "ICU",
      consultantInCharge: "Dr. Rajapaksa"
    },
    bedId: 6,
    criticalFactors: {
      heartRate: 130,
      bloodPressure: "75/50",
      temperature: 39.2,
      spO2: 89,
      respiratoryRate: 30,
      gcs: 11,
      painScale: 7,
      bloodGlucose: 160,
      urineOutput: 12
    }
  },
  {
    patientData: {
      patientNumber: "ICU-2025-007",
      fullName: "Thomas Anderson",
      nicPassport: "197312901234",
      dateOfBirth: "1973-12-03",
      age: 52,
      gender: "Male",
      maritalStatus: "Married",
      contactNumber: "+94 71 789 0123",
      email: "thomas.anderson@email.com",
      address: "456 River Street, Trincomalee",
      emergencyContactName: "Patricia Anderson",
      emergencyContactRelationship: "Spouse",
      emergencyContactNumber: "+94 71 789 0124",
      knownAllergies: "None",
      medicalHistory: "Diabetes mellitus type 2, Diabetic nephropathy",
      currentMedications: "Insulin, Metformin, Losartan",
      pregnancyStatus: "Not Applicable",
      bloodType: "B-",
      initialDiagnosis: "Diabetic ketoacidosis with severe metabolic acidosis",
      admissionDateTime: "2025-08-05T16:45:00.000Z",
      department: "ICU",
      consultantInCharge: "Dr. Perera"
    },
    bedId: 7,
    criticalFactors: {
      heartRate: 115,
      bloodPressure: "100/65",
      temperature: 36.8,
      spO2: 92,
      respiratoryRate: 25,
      gcs: 13,
      painScale: 3,
      bloodGlucose: 450,
      urineOutput: 35
    }
  }
];

async function clearExistingData() {
  try {
    console.log('🗑️ Clearing existing data...');
    
    // Clear in reverse order to avoid foreign key constraints
    await CriticalFactor.destroy({ where: {} });
    await Admission.destroy({ where: {} });
    await MedicalRecord.destroy({ where: {} });
    await EmergencyContact.destroy({ where: {} });
    await Patient.destroy({ where: {} });
    
    // Reset bed assignments
    await BedMySQL.update(
      { patientId: null },
      { where: {} }
    );
    
    console.log('✅ Existing data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing existing data:', error);
    throw error;
  }
}

async function populateICUData() {
  try {
    console.log('🏥 Starting ICU data population...');
    
    // Clear existing data first
    await clearExistingData();
    
    for (const icuCase of icuPatients) {
      const { patientData, bedId, criticalFactors } = icuCase;
      
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
      
      console.log(`👤 Created patient: ${patient.fullName} (ID: ${patient.id})`);
      
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
      
      // Create admission
      const admission = await Admission.create({
        patientId: patient.id,
        admissionDateTime: patientData.admissionDateTime,
        department: patientData.department,
        consultantInCharge: patientData.consultantInCharge,
        status: "Active"
      });
      
      // Create critical factors
      await CriticalFactor.create({
        patientId: patient.id,
        heartRate: criticalFactors.heartRate,
        bloodPressure: criticalFactors.bloodPressure,
        temperature: criticalFactors.temperature,
        spO2: criticalFactors.spO2,
        respiratoryRate: criticalFactors.respiratoryRate,
        gcs: criticalFactors.gcs,
        painScale: criticalFactors.painScale,
        bloodGlucose: criticalFactors.bloodGlucose,
        urineOutput: criticalFactors.urineOutput,
        recordedAt: new Date()
      });
      
      // Assign to bed
      await BedMySQL.update(
        { patientId: patient.id },
        { where: { id: bedId } }
      );
      
      console.log(`🛏️ Assigned patient ${patient.fullName} to bed ${bedId}`);
    }
    
    console.log('✅ ICU data population completed successfully!');
    console.log('📊 Summary:');
    console.log('- 7 ICU patients created and assigned to beds 1-7');
    console.log('- Emergency contacts and medical records created');
    console.log('- Admissions created for all patients');
    console.log('- Critical factors recorded for all patients');
    console.log('- Bed 8 remains available');
    console.log('- Total: 7 occupied beds, 1 available bed');
    
  } catch (error) {
    console.error('❌ Error populating ICU data:', error);
  } finally {
    await sequelize.close();
  }
}

populateICUData(); 