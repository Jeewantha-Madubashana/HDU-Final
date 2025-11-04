import { sequelize } from '../config/mysqlDB.js';
import { Patient, MedicalRecord, EmergencyContact, Admission } from '../config/mysqlDB.js';

async function createCompleteTestPatient() {
  try {
    console.log('Creating complete test patient with all related records...');

    // Create patient
    const patient = await Patient.create({
      patientNumber: 'PT-2025-TEST002',
      fullName: 'Test Patient Complete 2',
      nicPassport: 'TEST123456790',
      dateOfBirth: '1980-01-15',
      age: 45,
      gender: 'Male',
      maritalStatus: 'Married',
      contactNumber: '+94 71 999 9999',
      email: 'test.patient2@email.com',
      address: '123 Test Street, Colombo'
    });

    console.log('✅ Patient created:', patient.patientNumber);

    // Create medical record
    const medicalRecord = await MedicalRecord.create({
      patientId: patient.id,
      knownAllergies: 'Penicillin, Sulfa drugs',
      medicalHistory: 'Hypertension, Diabetes Type 2, Previous heart surgery in 2020',
      currentMedications: 'Metformin 500mg twice daily, Lisinopril 10mg daily, Aspirin 81mg daily',
      pregnancyStatus: 'Not Applicable',
      bloodType: 'O+',
      initialDiagnosis: 'Chest pain with suspected coronary artery disease. Patient reports intermittent chest discomfort for the past 2 weeks.'
    });

    console.log('✅ Medical record created');

    // Create emergency contact
    const emergencyContact = await EmergencyContact.create({
      patientId: patient.id,
      name: 'Jane Test Patient',
      relationship: 'Spouse',
      contactNumber: '+94 71 888 8888',
      isPrimary: true
    });

    console.log('✅ Emergency contact created');

    // Create admission
    const admission = await Admission.create({
      patientId: patient.id,
      admissionDateTime: new Date(),
      department: 'ICU',
      consultantInCharge: 'Dr. Sarah Wilson',
      status: 'Active'
    });

    console.log('✅ Admission created');

    console.log('\n📋 Complete Test Patient Summary:');
    console.log(`Patient ID: ${patient.id}`);
    console.log(`Patient Number: ${patient.patientNumber}`);
    console.log(`Name: ${patient.fullName}`);
    console.log(`Medical Record ID: ${medicalRecord.id}`);
    console.log(`Emergency Contact ID: ${emergencyContact.id}`);
    console.log(`Admission ID: ${admission.id}`);

    console.log('\n✅ Complete test patient created successfully!');

  } catch (error) {
    console.error('❌ Error creating complete test patient:', error);
  } finally {
    await sequelize.close();
  }
}

createCompleteTestPatient(); 