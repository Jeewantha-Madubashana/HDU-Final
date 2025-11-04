import { sequelize, UserMySQLModel as User, BedMySQL as Bed, Patient, CriticalFactor, Admission, EmergencyContact, MedicalRecord } from './config/mysqlDB.js';
import { genSalt, hash } from 'bcryptjs';

async function clearExistingPatientData() {
  try {
    console.log('🧹 Clearing existing patient data...');
    
    // Clear beds first (remove patient assignments)
    await Bed.update({ patientId: null }, { where: {} });
    
    // Clear in order of dependencies
    await CriticalFactor.destroy({ where: {} });
    await MedicalRecord.destroy({ where: {} });
    await Admission.destroy({ where: {} });
    await EmergencyContact.destroy({ where: {} });
    await Patient.destroy({ where: {} });
    
    console.log('✅ Existing patient data cleared');
  } catch (error) {
    console.log('ℹ️  No existing patient data to clear or error occurred:', error.message);
  }
}

async function generateRealisticScenario() {
  try {
    console.log('🏥 Generating Realistic Hospital Scenario');
    console.log('========================================');
    
    // Clear existing patient data first
    await clearExistingPatientData();
    
    // Create some consultants and staff first
    const salt = await genSalt(10);
    const hashedPassword = await hash('hospital123', salt);
    
    const consultantData = [
      {
        username: 'dr.cardio',
        password: hashedPassword,
        email: 'cardio@hospital.com',
        registrationNumber: 'CONS001',
        ward: 'ICU',
        mobileNumber: '+94 71 234 5001',
        sex: 'Male',
        role: 'Consultant',
        nameWithInitials: 'Dr. A. Cardio',
        speciality: 'Cardiology'
      },
      {
        username: 'dr.neuro',
        password: hashedPassword,
        email: 'neuro@hospital.com',
        registrationNumber: 'CONS002',
        ward: 'ICU',
        mobileNumber: '+94 71 234 5002',
        sex: 'Female',
        role: 'Consultant',
        nameWithInitials: 'Dr. B. Neuro',
        speciality: 'Neurology'
      },
      {
        username: 'dr.surgery',
        password: hashedPassword,
        email: 'surgery@hospital.com',
        registrationNumber: 'CONS003',
        ward: 'Surgery',
        mobileNumber: '+94 71 234 5003',
        sex: 'Male',
        role: 'Consultant',
        nameWithInitials: 'Dr. C. Surgery',
        speciality: 'General Surgery'
      }
    ];

    const consultants = [];
    for (const data of consultantData) {
      let consultant = await User.findOne({ where: { username: data.username } });
      if (!consultant) {
        consultant = await User.create(data);
        console.log(`✅ Created consultant: ${data.nameWithInitials}`);
      } else {
        console.log(`ℹ️  Using existing consultant: ${consultant.nameWithInitials}`);
      }
      consultants.push(consultant);
    }
    
    console.log('✅ Created consultants');
    
    // Create beds if they don't exist
    const existingBeds = await Bed.findAll();
    if (existingBeds.length === 0) {
      const beds = [];
      for (let i = 1; i <= 12; i++) {
        beds.push({
          bedNumber: `HDU-${i.toString().padStart(2, '0')}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      await Bed.bulkCreate(beds);
      console.log('✅ Created 12 beds');
    }
    
    // Patient scenarios with realistic medical data
    const patientScenarios = [
      {
        // Patient 1 - Critical cardiac patient
        patient: {
          patientNumber: 'HDU-2025-001',
          fullName: 'Rajesh Kumar Patel',
          nicPassport: '196805123456',
          gender: 'Male',
          contactNumber: '+94 77 123 4567',
          email: 'rajesh.patel@email.com',
          dateOfBirth: '1968-05-15',
          age: 56,
          maritalStatus: 'Married',
          address: '45 Temple Road, Kandy',
          knownAllergies: 'Penicillin, Aspirin',
          medicalHistory: 'Hypertension (15 years), Type 2 Diabetes (10 years), Previous MI (2022), Smoking history (30 pack-years, quit 2 years ago)',
          currentMedications: 'Metoprolol 50mg BD, Atorvastatin 40mg OD, Metformin 500mg BD, Aspirin 75mg OD, Ramipril 5mg OD',
          pregnancyStatus: 'Not Applicable',
          bloodType: 'O+',
          initialDiagnosis: 'Acute ST-elevation myocardial infarction with cardiogenic shock, requiring urgent PCI and IABP support',
          department: 'ICU',
          consultantInCharge: 'Dr. A. Cardio (Cardiology)',
          bedNumber: 'HDU-01',
          admissionDate: new Date('2025-08-07T14:30:00'),
        },
        emergencyContact: {
          name: 'Priya Patel',
          relationship: 'Spouse',
          contactNumber: '+94 77 123 4568'
        },
        criticalFactors: [
          {
            heartRate: 125,
            respiratoryRate: 28,
            bloodPressureSystolic: 85,
            bloodPressureDiastolic: 50,
            spO2: 88,
            temperature: 37.8,
            glasgowComaScale: 14,
            painScale: 8,
            bloodGlucose: 180,
            urineOutput: 15,
            recordedAt: new Date('2025-08-09T10:00:00'),
                         recordedBy: 1
          }
        ]
      },
      {
        // Patient 2 - Severe respiratory failure
        patient: {
          patientNumber: 'HDU-2025-002',
          fullName: 'Maria Fernandez Silva',
          nicPassport: '197203234567',
          gender: 'Female',
          contactNumber: '+94 76 234 5678',
          email: 'maria.silva@email.com',
          dateOfBirth: '1972-03-22',
          age: 52,
          maritalStatus: 'Divorced',
          address: '78 Galle Road, Colombo 03',
          knownAllergies: 'Sulfonamides, Latex',
          medicalHistory: 'COPD (Gold Stage III), Chronic bronchitis, Previous pneumonia episodes (2023, 2024), Ex-smoker (40 pack-years)',
          currentMedications: 'Salbutamol MDI 2 puffs QID, Tiotropium 18mcg OD, Prednisolone 10mg OD, Azithromycin 250mg 3x/week',
          pregnancyStatus: 'Not Applicable',
          bloodType: 'A-',
          initialDiagnosis: 'Acute exacerbation of COPD with Type II respiratory failure, requiring non-invasive ventilation',
          department: 'ICU',
          consultantInCharge: 'Dr. B. Neuro (Neurology)',
          bedNumber: 'HDU-02',
          admissionDate: new Date('2025-08-06T09:15:00'),
        },
        emergencyContact: {
          name: 'Carlos Silva',
          relationship: 'Child',
          contactNumber: '+94 76 234 5679'
        },
        criticalFactors: [
          {
            heartRate: 110,
            respiratoryRate: 32,
            bloodPressureSystolic: 160,
            bloodPressureDiastolic: 95,
            spO2: 85,
            temperature: 38.5,
            glasgowComaScale: 13,
            painScale: 6,
            bloodGlucose: 145,
            urineOutput: 25,
            recordedAt: new Date('2025-08-09T09:30:00'),
                         recordedBy: 1
          }
        ]
      },
      {
        // Patient 3 - Post-operative complications
        patient: {
          patientNumber: 'HDU-2025-003',
          fullName: 'Ahmed Hassan Mohamed',
          nicPassport: '198512345678',
          gender: 'Male',
          contactNumber: '+94 75 345 6789',
          email: 'ahmed.hassan@email.com',
          dateOfBirth: '1985-12-10',
          age: 39,
          maritalStatus: 'Married',
          address: '123 Mosque Road, Gampaha',
          knownAllergies: 'Morphine, Codeine',
          medicalHistory: 'Appendicitis with perforation, No significant past medical history, Non-smoker, Occasional alcohol use',
          currentMedications: 'Paracetamol 1g QID, Tramadol 50mg PRN, Metronidazole 500mg TDS, Ceftriaxone 1g BD',
          pregnancyStatus: 'Not Applicable',
          bloodType: 'B+',
          initialDiagnosis: 'Post-operative complications following emergency appendectomy - wound dehiscence with intra-abdominal sepsis',
          department: 'Surgery',
          consultantInCharge: 'Dr. C. Surgery (General Surgery)',
          bedNumber: 'HDU-03',
          admissionDate: new Date('2025-08-05T22:45:00'),
        },
        emergencyContact: {
          name: 'Fatima Mohamed',
          relationship: 'Spouse',
          contactNumber: '+94 75 345 6790'
        },
        criticalFactors: [
          {
            heartRate: 115,
            respiratoryRate: 24,
            bloodPressureSystolic: 95,
            bloodPressureDiastolic: 60,
            spO2: 92,
            temperature: 39.2,
            glasgowComaScale: 15,
            painScale: 7,
            bloodGlucose: 120,
            urineOutput: 20,
            recordedAt: new Date('2025-08-09T08:45:00'),
                         recordedBy: 1
          }
        ]
      },
      {
        // Patient 4 - Neurological emergency
        patient: {
          patientNumber: 'HDU-2025-004',
          fullName: 'Kamala Devi Sharma',
          nicPassport: '195408234567',
          gender: 'Female',
          contactNumber: '+94 78 456 7890',
          email: 'kamala.sharma@email.com',
          dateOfBirth: '1954-08-25',
          age: 70,
          maritalStatus: 'Widowed',
          address: '67 Buddha Road, Matara',
          knownAllergies: 'Iodine contrast, NSAIDs',
          medicalHistory: 'Hypertension (20 years), Atrial fibrillation on warfarin, Previous TIA (2020), Osteoarthritis',
          currentMedications: 'Warfarin 5mg OD, Amlodipine 10mg OD, Digoxin 0.25mg OD, Paracetamol 500mg PRN',
          pregnancyStatus: 'Not Applicable',
          bloodType: 'AB+',
          initialDiagnosis: 'Acute ischemic stroke (left MCA territory) with hemorrhagic transformation, requiring close monitoring',
          department: 'ICU',
          consultantInCharge: 'Dr. B. Neuro (Neurology)',
          bedNumber: 'HDU-04',
          admissionDate: new Date('2025-08-08T16:20:00'),
        },
        emergencyContact: {
          name: 'Raj Sharma',
          relationship: 'Child',
          contactNumber: '+94 78 456 7891'
        },
        criticalFactors: [
          {
            heartRate: 95,
            respiratoryRate: 22,
            bloodPressureSystolic: 180,
            bloodPressureDiastolic: 110,
            spO2: 94,
            temperature: 37.2,
            glasgowComaScale: 11,
            painScale: 4,
            bloodGlucose: 160,
            urineOutput: 30,
            recordedAt: new Date('2025-08-09T07:15:00'),
                         recordedBy: 1
          }
        ]
      },
      {
        // Patient 5 - Multi-trauma
        patient: {
          patientNumber: 'HDU-2025-005',
          fullName: 'Sunil Bandara Wickramasinghe',
          nicPassport: '199001123456',
          gender: 'Male',
          contactNumber: '+94 71 567 8901',
          email: 'sunil.bandara@email.com',
          dateOfBirth: '1990-01-15',
          age: 34,
          maritalStatus: 'Single',
          address: '89 Hill Street, Nuwara Eliya',
          knownAllergies: 'No known allergies',
          medicalHistory: 'Previously healthy, Regular exercise, Non-smoker, Social drinker',
          currentMedications: 'Morphine PCA, Ceftriaxone 2g BD, Enoxaparin 40mg OD, Omeprazole 40mg OD',
          pregnancyStatus: 'Not Applicable',
          bloodType: 'O-',
          initialDiagnosis: 'Polytrauma from motor vehicle accident - multiple rib fractures, pneumothorax, splenic laceration, requiring close monitoring',
          department: 'ICU',
          consultantInCharge: 'Dr. C. Surgery (General Surgery)',
          bedNumber: 'HDU-05',
          admissionDate: new Date('2025-08-09T03:30:00'),
        },
        emergencyContact: {
          name: 'Mala Wickramasinghe',
          relationship: 'Parent',
          contactNumber: '+94 71 567 8902'
        },
        criticalFactors: [
          {
            heartRate: 120,
            respiratoryRate: 26,
            bloodPressureSystolic: 90,
            bloodPressureDiastolic: 55,
            spO2: 90,
            temperature: 36.8,
            glasgowComaScale: 14,
            painScale: 9,
            bloodGlucose: 140,
            urineOutput: 18,
            recordedAt: new Date('2025-08-09T11:00:00'),
                         recordedBy: 1
          }
        ]
      }
    ];
    
    // Create all patients and related data
    for (let i = 0; i < patientScenarios.length; i++) {
      const scenario = patientScenarios[i];
      
      console.log(`\n👤 Creating Patient ${i + 1}: ${scenario.patient.fullName}`);
      
      // Create patient
      const patient = await Patient.create(scenario.patient);
      console.log(`  ✅ Patient created with ID: ${patient.id}`);
      
      // Create emergency contact
      await EmergencyContact.create({
        patientId: patient.id,
        ...scenario.emergencyContact
      });
      console.log(`  ✅ Emergency contact created`);
      
      // Create admission record
      await Admission.create({
        patientId: patient.id,
        admissionDateTime: scenario.patient.admissionDate,
        department: scenario.patient.department,
        initialDiagnosis: scenario.patient.initialDiagnosis,
        consultantInCharge: scenario.patient.consultantInCharge
      });
      console.log(`  ✅ Admission record created`);
      
      // Create medical record
      await MedicalRecord.create({
        patientId: patient.id,
        knownAllergies: scenario.patient.knownAllergies,
        medicalHistory: scenario.patient.medicalHistory,
        currentMedications: scenario.patient.currentMedications,
        bloodType: scenario.patient.bloodType,
        initialDiagnosis: scenario.patient.initialDiagnosis
      });
      console.log(`  ✅ Medical record created`);
      
      // Assign to bed
      const bed = await Bed.findOne({ where: { bedNumber: scenario.patient.bedNumber } });
      if (bed) {
        await bed.update({ patientId: patient.id });
        console.log(`  ✅ Assigned to bed: ${scenario.patient.bedNumber}`);
      }
      
      // Create critical factors (multiple readings for realism)
      for (const factor of scenario.criticalFactors) {
        await CriticalFactor.create({
          patientId: patient.id,
          ...factor
        });
        console.log(`  ✅ Critical factors recorded`);
        
        // Add additional readings with slight variations
        const additionalReadings = [
          { ...factor, recordedAt: new Date(factor.recordedAt.getTime() - 2 * 60 * 60 * 1000) }, // 2 hours ago
          { ...factor, recordedAt: new Date(factor.recordedAt.getTime() - 4 * 60 * 60 * 1000) }, // 4 hours ago
          { ...factor, recordedAt: new Date(factor.recordedAt.getTime() - 6 * 60 * 60 * 1000) }  // 6 hours ago
        ];
        
        for (const reading of additionalReadings) {
          // Add small variations to make it realistic
          reading.heartRate += Math.floor(Math.random() * 10) - 5;
          reading.bloodPressureSystolic += Math.floor(Math.random() * 10) - 5;
          reading.bloodPressureDiastolic += Math.floor(Math.random() * 8) - 4;
          reading.spO2 += Math.floor(Math.random() * 4) - 2;
          reading.temperature += (Math.random() * 0.6) - 0.3;
          
          await CriticalFactor.create({
            patientId: patient.id,
            ...reading
          });
        }
        console.log(`  ✅ Additional vital sign readings created`);
      }
    }
    
    // Create a nurse user for testing
    let nurse = await User.findOne({ where: { username: 'nurse.test' } });
    if (!nurse) {
      nurse = await User.create({
        username: 'nurse.test',
        password: hashedPassword,
        email: 'nurse.test@hospital.com',
        registrationNumber: 'NURSE001',
        ward: 'ICU',
        mobileNumber: '+94 71 999 0001',
        sex: 'Female',
        role: 'Nurse',
        nameWithInitials: 'N. Test'
      });
      console.log('✅ Created test nurse');
    } else {
      console.log('ℹ️  Using existing test nurse');
    }
    
    console.log('\n🎉 Realistic Hospital Scenario Generated Successfully!');
    console.log('=====================================================');
    console.log('📊 Summary:');
    console.log(`  • ${patientScenarios.length} patients created with critical conditions`);
    console.log(`  • ${consultants.length} consultants available`);
    console.log(`  • All patients assigned to beds HDU-01 through HDU-05`);
    console.log(`  • Multiple vital sign readings for each patient`);
    console.log(`  • Different admission dates spanning last 4 days`);
    console.log(`  • 1 test nurse account created`);
    console.log('\n🔐 Test Login Credentials:');
    console.log('  Nurse: nurse.test / hospital123');
    console.log('  Consultants: dr.cardio, dr.neuro, dr.surgery / hospital123');
    console.log('\n🏥 Patient Overview:');
    console.log('  HDU-01: Cardiac emergency (MI with shock)');
    console.log('  HDU-02: Respiratory failure (COPD exacerbation)');
    console.log('  HDU-03: Post-surgical sepsis');
    console.log('  HDU-04: Stroke with complications');
    console.log('  HDU-05: Multi-trauma from accident');
    console.log('\n✨ All patients have critical vital signs that will trigger alerts!');
    
  } catch (error) {
    console.error('❌ Error generating scenario:', error);
  } finally {
    process.exit(0);
  }
}

generateRealisticScenario(); 