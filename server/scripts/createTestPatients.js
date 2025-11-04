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
    admissionDateTime: "2025-08-04T10:00:00.000Z",
    department: "ICU",
    initialDiagnosis: "Severe chest pain, suspected heart attack",
    consultantInCharge: "Dr. Sarah Johnson"
  },
  {
    fullName: "Maria Garcia",
    nicPassport: "222222222v",
    dateOfBirth: "1992-07-22",
    age: 33,
    gender: "Female",
    maritalStatus: "Single",
    contactNumber: "+94 71 234 5678",
    email: "maria.garcia@email.com",
    address: "456 Oak Avenue, Kandy",
    emergencyContactName: "Carlos Garcia",
    emergencyContactRelationship: "Parent",
    emergencyContactNumber: "+94 71 234 5679",
    knownAllergies: "None",
    medicalHistory: "Asthma",
    currentMedications: "Albuterol inhaler",
    pregnancyStatus: "Not Pregnant",
    bloodType: "O-",
    admissionDateTime: "2025-08-04T11:00:00.000Z",
    department: "Medical",
    initialDiagnosis: "Severe asthma attack",
    consultantInCharge: "Dr. Michael Chen"
  },
  {
    fullName: "David Wilson",
    nicPassport: "333333333v",
    dateOfBirth: "1978-11-08",
    age: 47,
    gender: "Male",
    maritalStatus: "Divorced",
    contactNumber: "+94 71 345 6789",
    email: "david.wilson@email.com",
    address: "789 Pine Road, Galle",
    emergencyContactName: "Lisa Wilson",
    emergencyContactRelationship: "Child",
    emergencyContactNumber: "+94 71 345 6790",
    knownAllergies: "Sulfa drugs",
    medicalHistory: "Kidney stones, Appendectomy",
    currentMedications: "None",
    pregnancyStatus: "Not Applicable",
    bloodType: "B+",
    admissionDateTime: "2025-08-04T12:00:00.000Z",
    department: "Surgery",
    initialDiagnosis: "Acute appendicitis",
    consultantInCharge: "Dr. Robert Kim"
  },
  {
    fullName: "Sarah Johnson",
    nicPassport: "444444444v",
    dateOfBirth: "1990-05-14",
    age: 35,
    gender: "Female",
    maritalStatus: "Married",
    contactNumber: "+94 71 456 7890",
    email: "sarah.johnson@email.com",
    address: "321 Elm Street, Jaffna",
    emergencyContactName: "Tom Johnson",
    emergencyContactRelationship: "Spouse",
    emergencyContactNumber: "+94 71 456 7891",
    knownAllergies: "Latex",
    medicalHistory: "C-section, Thyroid disorder",
    currentMedications: "Levothyroxine",
    pregnancyStatus: "Not Pregnant",
    bloodType: "AB+",
    admissionDateTime: "2025-08-04T13:00:00.000Z",
    department: "ICU",
    initialDiagnosis: "Severe pneumonia",
    consultantInCharge: "Dr. Emily Davis"
  },
  {
    fullName: "James Brown",
    nicPassport: "555555555v",
    dateOfBirth: "1983-09-30",
    age: 42,
    gender: "Male",
    maritalStatus: "Married",
    contactNumber: "+94 71 567 8901",
    email: "james.brown@email.com",
    address: "654 Maple Drive, Anuradhapura",
    emergencyContactName: "Jennifer Brown",
    emergencyContactRelationship: "Spouse",
    emergencyContactNumber: "+94 71 567 8902",
    knownAllergies: "Peanuts",
    medicalHistory: "High cholesterol, Sleep apnea",
    currentMedications: "Atorvastatin, CPAP machine",
    pregnancyStatus: "Not Applicable",
    bloodType: "O+",
    admissionDateTime: "2025-08-04T14:00:00.000Z",
    department: "Medical",
    initialDiagnosis: "Stroke symptoms",
    consultantInCharge: "Dr. William Thompson"
  }
];

async function createTestPatients() {
  try {
    console.log('Starting to create test patients...');

    // Get all beds
    const beds = await BedMySQL.findAll();
    console.log(`Found ${beds.length} beds`);

    for (let i = 0; i < Math.min(5, testPatients.length, beds.length); i++) {
      const patientData = testPatients[i];
      const bed = beds[i];

      console.log(`Creating patient ${i + 1}: ${patientData.fullName}`);

      // Create patient
      const patient = await Patient.create({
        patientNumber: `PT-2025-${String(i + 1001).padStart(4, '0')}`,
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

      // Create admission
      await Admission.create({
        patientId: patient.id,
        admissionDateTime: patientData.admissionDateTime,
        department: patientData.department,
        consultantInCharge: patientData.consultantInCharge,
        status: "Active"
      });

      // Assign to bed
      await BedMySQL.update(
        { patientId: patient.id },
        { where: { id: bed.id } }
      );

      console.log(`✅ Created patient ${patientData.fullName} (ID: ${patient.id}) and assigned to bed ${bed.bedNumber} (ID: ${bed.id})`);
    }

    console.log('✅ Test patients created successfully!');

    // Show current bed status
    const updatedBeds = await BedMySQL.findAll({
      include: [{
        model: Patient,
        as: 'Patient'
      }]
    });

    console.log('\n📋 Current Bed Status:');
    updatedBeds.forEach(bed => {
      if (bed.Patient) {
        console.log(`Bed ${bed.bedNumber}: ${bed.Patient.fullName} (${bed.Patient.patientNumber})`);
      } else {
        console.log(`Bed ${bed.bedNumber}: Available`);
      }
    });

  } catch (error) {
    console.error('❌ Error creating test patients:', error);
  } finally {
    await sequelize.close();
  }
}

createTestPatients(); 