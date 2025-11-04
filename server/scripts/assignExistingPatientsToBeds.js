import { sequelize } from '../config/mysqlDB.js';
import definePatient from '../models/patients/Patient.js';
import defineBedMySQL from '../models/BedMySQL.js';

// Initialize models
const Patient = definePatient(sequelize);
const BedMySQL = defineBedMySQL(sequelize);

async function assignExistingPatientsToBeds() {
  try {
    console.log('Starting to assign existing patients to beds...');

    // Get all patients
    const patients = await Patient.findAll();
    console.log(`Found ${patients.length} patients`);

    // Get all beds
    const beds = await BedMySQL.findAll();
    console.log(`Found ${beds.length} beds`);

    // Assign first 5 patients to first 5 beds
    for (let i = 0; i < Math.min(5, patients.length, beds.length); i++) {
      const patient = patients[i];
      const bed = beds[i];

      // Update bed to assign patient
      await BedMySQL.update(
        { patientId: patient.id },
        { where: { id: bed.id } }
      );

      console.log(`✅ Assigned patient ${patient.fullName} (ID: ${patient.id}) to bed ${bed.bedNumber} (ID: ${bed.id})`);
    }

    console.log('✅ Patient assignment completed successfully!');

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
    console.error('❌ Error assigning patients:', error);
  } finally {
    await sequelize.close();
  }
}

assignExistingPatientsToBeds(); 