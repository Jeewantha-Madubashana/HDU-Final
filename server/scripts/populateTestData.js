import { sequelize } from '../config/mysqlDB.js';
import definePatient from '../models/patients/Patient.js';
import defineBedMySQL from '../models/BedMySQL.js';
import defineAdmission from '../models/patients/Admission.js';
import defineEmergencyContact from '../models/patients/EmergencyContact.js';
import defineMedicalRecord from '../models/patients/MedicalRecord.js';

// Initialize models
const Patient = definePatient(sequelize);
const BedMySQL = defineBedMySQL(sequelize);
const Admission = defineAdmission(sequelize);
const EmergencyContact = defineEmergencyContact(sequelize);
const MedicalRecord = defineMedicalRecord(sequelize);

const testPatients = [
  {
    patientData: {
      patientNumber: "PT-2025-0101",
      fullName: "John Smith",
      nicPassport: "111111111v",
      dateOfBirth: "1985-03-15",
      age: 40,
      gender: "Male",
      maritalStatus: "Married",
      contactNumber: "+94 71 123 4567",
      email: "john.smith@email.com",
      address: "123 Main Street, Colombo",
      emergencyContactName: "Mary Smith",
      emergencyContactRelationship: "Spouse",
      emergencyContactNumber: "+94 71 123 4568",
      knownAllergies: "Penicillin",
      medicalHistory: "Hypertension, Diabetes",
      currentMedications: "Metformin, Lisinopril",
      pregnancyStatus: "Not Applicable",
      bloodType: "A+",
      initialDiagnosis: "Chest pain, suspected angina",
      admissionDateTime: "2025-08-04T08:00:00.000Z",
      department: "Medical",
      consultantInCharge: "Dr. Rajapaksa"
    },
    bedId: 1
  },
  {
    patientData: {
      patientNumber: "PT-2025-0102",
      fullName: "Sarah Johnson",
      nicPassport: "222222222v",
      dateOfBirth: "1990-07-22",
      age: 35,
      gender: "Female",
      maritalStatus: "Single",
      contactNumber: "+94 71 234 5678",
      email: "sarah.johnson@email.com",
      address: "456 Oak Avenue, Kandy",
      emergencyContactName: "Robert Johnson",
      emergencyContactRelationship: "Parent",
      emergencyContactNumber: "+94 71 234 5679",
      knownAllergies: "None",
      medicalHistory: "Asthma",
      currentMedications: "Albuterol inhaler",
      pregnancyStatus: "Not Applicable",
      bloodType: "O+",
      initialDiagnosis: "Severe asthma attack",
      admissionDateTime: "2025-08-04T09:30:00.000Z",
      department: "Medical",
      consultantInCharge: "Dr. Perera"
    },
    bedId: 2
  },
  {
    patientData: {
      patientNumber: "PT-2025-0103",
      fullName: "Michael Brown",
      nicPassport: "333333333v",
      dateOfBirth: "1978-11-08",
      age: 47,
      gender: "Male",
      maritalStatus: "Divorced",
      contactNumber: "+94 71 345 6789",
      email: "michael.brown@email.com",
      address: "789 Pine Road, Galle",
      emergencyContactName: "Lisa Brown",
      emergencyContactRelationship: "Friend",
      emergencyContactNumber: "+94 71 345 6790",
      knownAllergies: "Sulfa drugs",
      medicalHistory: "Kidney stones, Appendectomy",
      currentMedications: "None",
      pregnancyStatus: "Not Applicable",
      bloodType: "B+",
      initialDiagnosis: "Acute appendicitis",
      admissionDateTime: "2025-08-04T10:15:00.000Z",
      department: "Surgery",
      consultantInCharge: "Dr. Silva"
    },
    bedId: 3
  },
  {
    patientData: {
      patientNumber: "PT-2025-0104",
      fullName: "Emily Davis",
      nicPassport: "444444444v",
      dateOfBirth: "1995-04-12",
      age: 30,
      gender: "Female",
      maritalStatus: "Married",
      contactNumber: "+94 71 456 7890",
      email: "emily.davis@email.com",
      address: "321 Elm Street, Jaffna",
      emergencyContactName: "David Davis",
      emergencyContactRelationship: "Spouse",
      emergencyContactNumber: "+94 71 456 7891",
      knownAllergies: "Latex",
      medicalHistory: "Migraines",
      currentMedications: "Sumatriptan",
      pregnancyStatus: "Pregnant - 24 weeks",
      bloodType: "AB+",
      initialDiagnosis: "Pre-eclampsia",
      admissionDateTime: "2025-08-04T11:00:00.000Z",
      department: "Medical",
      consultantInCharge: "Dr. Fernando"
    },
    bedId: 4
  },
  {
    patientData: {
      patientNumber: "PT-2025-0105",
      fullName: "David Wilson",
      nicPassport: "555555555v",
      dateOfBirth: "1965-09-30",
      age: 60,
      gender: "Male",
      maritalStatus: "Married",
      contactNumber: "+94 71 567 8901",
      email: "david.wilson@email.com",
      address: "654 Maple Drive, Anuradhapura",
      emergencyContactName: "Helen Wilson",
      emergencyContactRelationship: "Spouse",
      emergencyContactNumber: "+94 71 567 8902",
      knownAllergies: "Iodine",
      medicalHistory: "Heart disease, Stroke (2020)",
      currentMedications: "Aspirin, Atorvastatin, Metoprolol",
      pregnancyStatus: "Not Applicable",
      bloodType: "O-",
      initialDiagnosis: "Chest pain, elevated troponin",
      admissionDateTime: "2025-08-04T12:45:00.000Z",
      department: "ICU",
      consultantInCharge: "Dr. Wijesinghe"
    },
    bedId: 5
  }
];

async function populateTestData() {
  try {
    console.log('Starting to populate test data...');
    
    for (const testCase of testPatients) {
      const { patientData, bedId } = testCase;
      
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
      
      console.log(`Created patient: ${patient.fullName} (ID: ${patient.id})`);
      
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
      
      // Assign to bed
      await BedMySQL.update(
        { patientId: patient.id },
        { where: { id: bedId } }
      );
      
      console.log(`Assigned patient ${patient.fullName} to bed ${bedId}`);
    }
    
    console.log('✅ Test data population completed successfully!');
    console.log('📋 Summary:');
    console.log('- 5 patients created and assigned to beds 1-5');
    console.log('- Emergency contacts and medical records created');
    console.log('- Admissions created for all patients');
    
  } catch (error) {
    console.error('❌ Error populating test data:', error);
  } finally {
    await sequelize.close();
  }
}

populateTestData(); 