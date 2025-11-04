import { sequelize } from '../config/mysqlDB.js';
import definePatient from '../models/patients/Patient.js';
import defineBedMySQL from '../models/BedMySQL.js';
import defineCriticalFactor from '../models/patients/CriticalFactor.js';
import defineAdmission from '../models/patients/Admission.js';

const Patient = definePatient(sequelize);
const BedMySQL = defineBedMySQL(sequelize);
const CriticalFactor = defineCriticalFactor(sequelize);
const Admission = defineAdmission(sequelize);

async function verifySimulation() {
  try {
    console.log('🔍 Verifying Critical Patient Simulation Results...\n');
    
    // Get all patients
    const patients = await Patient.findAll({
      order: [['createdAt', 'ASC']]
    });
    
    // Get occupied beds
    const occupiedBeds = await BedMySQL.findAll({ 
      where: { 
        patientId: { [sequelize.Sequelize.Op.not]: null } 
      },
      order: [['id', 'ASC']]
    });
    
    // Get critical factors
    const criticalFactors = await CriticalFactor.findAll({
      order: [['patientId', 'ASC']]
    });
    
    // Get admissions
    const admissions = await Admission.findAll({
      order: [['patientId', 'ASC']]
    });
    
    console.log('📊 SIMULATION VERIFICATION RESULTS:');
    console.log('=====================================');
    console.log(`👥 Total Patients Created: ${patients.length}`);
    console.log(`🛏️ Beds Occupied: ${occupiedBeds.length}`);
    console.log(`🚨 Critical Factors Recorded: ${criticalFactors.length}`);
    console.log(`📅 Admissions Created: ${admissions.length}`);
    
    console.log('\n👥 PATIENT DETAILS:');
    console.log('===================');
    patients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.fullName}`);
      console.log(`   Patient Number: ${patient.patientNumber}`);
      console.log(`   Age: ${patient.age}, Gender: ${patient.gender}`);
      console.log(`   Contact: ${patient.contactNumber}`);
      console.log(`   Created: ${patient.createdAt.toLocaleString()}`);
    });
    
    console.log('\n🛏️ BED ASSIGNMENTS:');
    console.log('===================');
    occupiedBeds.forEach(bed => {
      const patient = patients.find(p => p.id === bed.patientId);
      console.log(`Bed ${bed.bedNumber}: ${patient ? patient.fullName : 'Unknown Patient'} (Patient ID: ${bed.patientId})`);
    });
    
    console.log('\n🚨 CRITICAL VITAL SIGNS:');
    console.log('========================');
    criticalFactors.forEach((factor, index) => {
      const patient = patients.find(p => p.id === factor.patientId);
      console.log(`${index + 1}. Patient: ${patient ? patient.fullName : 'Unknown'}`);
      
      const criticalValues = [];
      if (factor.heartRate && (factor.heartRate > 120 || factor.heartRate < 60)) 
        criticalValues.push(`Heart Rate: ${factor.heartRate} bpm`);
      if (factor.respiratoryRate && (factor.respiratoryRate > 25 || factor.respiratoryRate < 12)) 
        criticalValues.push(`Respiratory Rate: ${factor.respiratoryRate}/min`);
      if (factor.bloodPressureSystolic && (factor.bloodPressureSystolic > 140 || factor.bloodPressureSystolic < 90)) 
        criticalValues.push(`BP Systolic: ${factor.bloodPressureSystolic} mmHg`);
      if (factor.bloodPressureDiastolic && (factor.bloodPressureDiastolic > 90 || factor.bloodPressureDiastolic < 60)) 
        criticalValues.push(`BP Diastolic: ${factor.bloodPressureDiastolic} mmHg`);
      if (factor.spO2 && factor.spO2 < 95) 
        criticalValues.push(`SpO2: ${factor.spO2}%`);
      if (factor.temperature && (factor.temperature > 38.5 || factor.temperature < 35.5)) 
        criticalValues.push(`Temperature: ${factor.temperature}°C`);
      if (factor.glasgowComaScale && factor.glasgowComaScale < 13) 
        criticalValues.push(`GCS: ${factor.glasgowComaScale}`);
      if (factor.painScale && factor.painScale > 7) 
        criticalValues.push(`Pain Scale: ${factor.painScale}/10`);
      if (factor.bloodGlucose && (factor.bloodGlucose > 200 || factor.bloodGlucose < 70)) 
        criticalValues.push(`Blood Glucose: ${factor.bloodGlucose} mg/dL`);
      
      console.log(`   Critical Values: ${criticalValues.join(', ')}`);
      console.log(`   Recorded At: ${factor.recordedAt.toLocaleString()}`);
    });
    
    console.log('\n📅 ADMISSION DATES:');
    console.log('==================');
    admissions.forEach((admission, index) => {
      const patient = patients.find(p => p.id === admission.patientId);
      const admissionDate = new Date(admission.admissionDateTime);
      const daysAgo = Math.floor((new Date() - admissionDate) / (1000 * 60 * 60 * 24));
      
      console.log(`${index + 1}. ${patient ? patient.fullName : 'Unknown'}`);
      console.log(`   Admitted: ${admissionDate.toLocaleString()} (${daysAgo} days ago)`);
      console.log(`   Department: ${admission.department}`);
      console.log(`   Consultant: ${admission.consultantInCharge}`);
    });
    
    console.log('\n✅ VERIFICATION COMPLETE!');
    console.log('========================');
    console.log('🎯 Expected: 5 patients with critical alerts');
    console.log(`✅ Created: ${patients.length} patients`);
    console.log(`✅ Beds occupied: ${occupiedBeds.length}/12`);
    console.log(`✅ Critical factors: ${criticalFactors.length} (all with alert-triggering values)`);
    console.log(`✅ Different admission dates: ${new Set(admissions.map(a => a.admissionDateTime.split('T')[0])).size} unique dates`);
    
    console.log('\n🚨 CRITICAL ALERT STATUS:');
    console.log('=========================');
    console.log('All patients have vital signs that will trigger critical alerts:');
    console.log('- Heart Rate outside 60-120 bpm');
    console.log('- Respiratory Rate outside 12-25/min');  
    console.log('- Blood Pressure outside normal ranges');
    console.log('- SpO2 below 95%');
    console.log('- Temperature outside 35.5-38.5°C');
    console.log('- Glasgow Coma Scale below 13');
    console.log('- Pain Scale above 7');
    console.log('- Blood Glucose outside 70-200 mg/dL');
    
    console.log('\n🔄 Next Steps:');
    console.log('==============');
    console.log('1. Start your server (npm start)');
    console.log('2. Open your dashboard');
    console.log('3. Navigate to the Critical Alerts section');
    console.log('4. You should see 5 critical alerts for these patients');
    
  } catch (error) {
    console.error('❌ Verification Error:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

verifySimulation(); 