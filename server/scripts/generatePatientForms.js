import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleDocsDir = path.join(__dirname, '../../sample docs');

// Sri Lankan realistic data
const sriLankanFirstNames = {
  Male: ['Kamal', 'Nimal', 'Sunil', 'Priyantha', 'Chaminda', 'Dilshan', 'Tharindu', 'Kasun', 'Nuwan', 'Sampath', 'Ravindu', 'Dhanushka', 'Chathura', 'Ishan', 'Lakshan'],
  Female: ['Kamani', 'Nimali', 'Sunethra', 'Priyani', 'Chamari', 'Dilani', 'Tharushi', 'Kavindi', 'Nuwani', 'Sampathika', 'Ravindi', 'Dhanushika', 'Chathurika', 'Ishani', 'Lakshani']
};

const sriLankanLastNames = ['Perera', 'Fernando', 'Silva', 'De Silva', 'Wijesinghe', 'Jayasinghe', 'Gunasekara', 'Ratnayake', 'Wickramasinghe', 'Bandara', 'Jayawardena', 'Weerasinghe', 'Karunarathna', 'Abeysekara', 'Mendis'];

const sriLankanCities = [
  'Colombo 05', 'Kandy', 'Galle', 'Matara', 'Kurunegala', 'Anuradhapura', 'Ratnapura', 'Badulla',
  'Jaffna', 'Trincomalee', 'Batticaloa', 'Negombo', 'Kalutara', 'Gampaha', 'Polonnaruwa', 'Hambantota'
];

const sriLankanDistricts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota',
  'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'
];

const consultants = [
  'Dr. R.M. Perera', 'Dr. S.A. Fernando', 'Dr. K.D. Silva', 'Dr. N.P. Wijesinghe', 'Dr. M.K. Jayasinghe',
  'Dr. A.B. Gunasekara', 'Dr. C.R. Ratnayake', 'Dr. L.S. Wickramasinghe', 'Dr. P.T. Bandara', 'Dr. D.N. Jayawardena'
];

const departments = ['ICU', 'Surgery', 'Medical', 'HDU'];

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];

const relationships = ['Spouse', 'Parent', 'Child', 'Friend', 'Other'];

const commonAllergies = [
  'Penicillin', 'Aspirin', 'Sulfa drugs', 'Latex', 'Dust mites', 'Pollen', 'Shellfish', 'Peanuts', 'None'
];

const commonMedicalHistory = [
  'Hypertension', 'Diabetes Mellitus Type 2', 'Asthma', 'Chronic Obstructive Pulmonary Disease',
  'Coronary Artery Disease', 'Previous Myocardial Infarction', 'Chronic Kidney Disease', 'Rheumatoid Arthritis',
  'Hypothyroidism', 'Hyperthyroidism', 'Epilepsy', 'Migraine', 'None'
];

const commonMedications = [
  'Metformin 500mg twice daily', 'Amlodipine 5mg once daily', 'Atorvastatin 20mg once daily',
  'Salbutamol inhaler as needed', 'Omeprazole 20mg once daily', 'Levothyroxine 50mcg once daily',
  'Aspirin 75mg once daily', 'Losartan 50mg once daily', 'None'
];

const commonDiagnoses = [
  'Acute Myocardial Infarction', 'Pneumonia', 'Acute Appendicitis', 'Acute Cholecystitis',
  'Acute Pancreatitis', 'Severe Asthma Exacerbation', 'Diabetic Ketoacidosis', 'Acute Renal Failure',
  'Septic Shock', 'Acute Stroke', 'Acute Exacerbation of COPD', 'Acute Heart Failure'
];

const dischargeReasons = [
  'Recovery complete - Patient stable for discharge',
  'Treatment finished - Patient responding well to treatment',
  'Patient request - Patient requested discharge',
  'Transfer to another facility - Referred for specialized care',
  'Condition improved - Patient condition significantly improved'
];

const dischargeInstructions = [
  'Continue medications as prescribed. Follow-up appointment in 2 weeks. Rest at home and avoid strenuous activities.',
  'Take medications with meals. Monitor blood pressure daily. Return if symptoms worsen.',
  'Follow low-salt diet. Take medications regularly. Avoid smoking and alcohol. Follow-up in 1 week.',
  'Complete course of antibiotics. Rest and maintain adequate hydration. Return if fever persists.',
  'Continue diabetic medications. Monitor blood sugar levels. Follow diabetic diet. Follow-up in 2 weeks.'
];

const medicationsPrescribed = [
  'Amlodipine 5mg once daily for 30 days\nMetformin 500mg twice daily for 30 days\nAtorvastatin 20mg once daily for 30 days',
  'Salbutamol inhaler 2 puffs as needed\nPrednisolone 20mg once daily for 5 days\nOmeprazole 20mg once daily for 14 days',
  'Ciprofloxacin 500mg twice daily for 7 days\nParacetamol 500mg as needed for pain\nIbuprofen 400mg three times daily for 5 days',
  'Losartan 50mg once daily for 30 days\nHydrochlorothiazide 12.5mg once daily for 30 days\nAspirin 75mg once daily',
  'Levothyroxine 50mcg once daily\nCalcium supplements twice daily\nVitamin D3 1000 IU once daily'
];

// Generate Sri Lankan NIC number
function generateNIC(age) {
  const year = new Date().getFullYear() - age;
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Random letter A-Z
  return `${year}${randomNum}${letter}`;
}

// Generate Sri Lankan phone number
function generatePhoneNumber() {
  const prefixes = ['071', '072', '074', '075', '076', '077', '078'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${prefix}-${number}`;
}

// Generate email
function generateEmail(firstName, lastName) {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

// Generate address
function generateAddress() {
  const streetNumbers = [12, 25, 34, 45, 56, 67, 78, 89, 102, 115, 128, 145, 156, 167, 178];
  const streetNames = ['Main Street', 'Temple Road', 'Hospital Road', 'School Lane', 'Market Street', 'Church Road', 'Station Road', 'Garden Street'];
  const city = sriLankanCities[Math.floor(Math.random() * sriLankanCities.length)];
  const district = sriLankanDistricts[Math.floor(Math.random() * sriLankanDistricts.length)];
  const streetNum = streetNumbers[Math.floor(Math.random() * streetNumbers.length)];
  const street = streetNames[Math.floor(Math.random() * streetNames.length)];
  return `${streetNum}, ${street}, ${city}, ${district} District`;
}

// Generate date of birth from age
function generateDateOfBirth(age) {
  const year = new Date().getFullYear() - age;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// Generate admission date time (within last 30 days)
function generateAdmissionDateTime() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const admissionDate = new Date(now);
  admissionDate.setDate(admissionDate.getDate() - daysAgo);
  admissionDate.setHours(Math.floor(Math.random() * 24));
  admissionDate.setMinutes(Math.floor(Math.random() * 60));
  return admissionDate.toISOString().slice(0, 16);
}

// Generate discharge date time (after admission)
function generateDischargeDateTime(admissionDateTime) {
  const admission = new Date(admissionDateTime);
  const daysInHospital = Math.floor(Math.random() * 14) + 1; // 1-14 days
  const dischargeDate = new Date(admission);
  dischargeDate.setDate(dischargeDate.getDate() + daysInHospital);
  dischargeDate.setHours(Math.floor(Math.random() * 24));
  dischargeDate.setMinutes(Math.floor(Math.random() * 60));
  return dischargeDate.toISOString().slice(0, 16);
}

// Generate patient data
function generatePatientData(patientNumber) {
  const gender = Math.random() > 0.5 ? 'Male' : 'Female';
  const firstName = sriLankanFirstNames[gender][Math.floor(Math.random() * sriLankanFirstNames[gender].length)];
  const lastName = sriLankanLastNames[Math.floor(Math.random() * sriLankanLastNames.length)];
  const fullName = `${firstName} ${lastName}`;
  const age = Math.floor(Math.random() * 60) + 20; // 20-80 years
  const dateOfBirth = generateDateOfBirth(age);
  const nicPassport = generateNIC(age);
  const contactNumber = generatePhoneNumber();
  const email = generateEmail(firstName, lastName);
  const address = generateAddress();
  const maritalStatus = maritalStatuses[Math.floor(Math.random() * maritalStatuses.length)];
  
  // Emergency contact
  const emergencyContactName = `${sriLankanFirstNames[gender][Math.floor(Math.random() * sriLankanFirstNames[gender].length)]} ${sriLankanLastNames[Math.floor(Math.random() * sriLankanLastNames.length)]}`;
  const emergencyContactRelationship = relationships[Math.floor(Math.random() * relationships.length)];
  const emergencyContactNumber = generatePhoneNumber();
  
  // Medical info
  const knownAllergies = commonAllergies[Math.floor(Math.random() * commonAllergies.length)];
  const medicalHistory = commonMedicalHistory[Math.floor(Math.random() * commonMedicalHistory.length)];
  const currentMedications = commonMedications[Math.floor(Math.random() * commonMedications.length)];
  const bloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
  const pregnancyStatus = gender === 'Female' && age < 50 ? (Math.random() > 0.7 ? 'Pregnant' : 'Not Pregnant') : 'Not Applicable';
  const initialDiagnosis = commonDiagnoses[Math.floor(Math.random() * commonDiagnoses.length)];
  
  // Admission details
  const admissionDateTime = generateAdmissionDateTime();
  const department = departments[Math.floor(Math.random() * departments.length)];
  const consultantInCharge = consultants[Math.floor(Math.random() * consultants.length)];
  const bedNumber = Math.floor(Math.random() * 50) + 1;
  
  return {
    patientNumber: `P${String(patientNumber).padStart(6, '0')}`,
    fullName,
    nicPassport,
    dateOfBirth,
    age,
    gender,
    maritalStatus,
    contactNumber,
    email,
    address,
    emergencyContactName,
    emergencyContactRelationship,
    emergencyContactNumber,
    knownAllergies,
    medicalHistory,
    currentMedications,
    pregnancyStatus,
    bloodType,
    initialDiagnosis,
    admissionDateTime,
    department,
    consultantInCharge,
    bedNumber
  };
}

// Generate discharge data
function generateDischargeData(patientData) {
  const dischargeReason = dischargeReasons[Math.floor(Math.random() * dischargeReasons.length)];
  const doctorComments = `Patient admitted with ${patientData.initialDiagnosis}. Treatment was initiated and patient responded well. Vital signs are stable. Patient is now fit for discharge. Continue medications as prescribed and follow-up as scheduled.`;
  const dischargeInstructionsText = dischargeInstructions[Math.floor(Math.random() * dischargeInstructions.length)];
  const followUpRequired = Math.random() > 0.3; // 70% chance
  const followUpDate = followUpRequired ? (() => {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 14) + 7); // 7-21 days from now
    return date.toISOString().split('T')[0];
  })() : '';
  const medicationsPrescribedText = medicationsPrescribed[Math.floor(Math.random() * medicationsPrescribed.length)];
  const dischargeDateTime = generateDischargeDateTime(patientData.admissionDateTime);
  
  return {
    dischargeReason,
    doctorComments,
    dischargeInstructions: dischargeInstructionsText,
    followUpRequired,
    followUpDate,
    medicationsPrescribed: medicationsPrescribedText,
    dischargeDateTime
  };
}

// Generate Admission Form PDF
function generateAdmissionFormPDF(patientData, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('PATIENT ADMISSION FORM', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('gray').text(`Form Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}`, { align: 'center' });
    doc.moveDown(1);
    doc.fillColor('black');

    // Patient Details Section
    doc.fontSize(14).font('Helvetica-Bold').text('PATIENT DETAILS', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    
    doc.text(`Patient ID: ${patientData.patientNumber}`, { continued: false });
    doc.text(`Full Name: ${patientData.fullName}`, { continued: false });
    doc.text(`NIC/Passport Number: ${patientData.nicPassport}`, { continued: false });
    doc.text(`Date of Birth: ${patientData.dateOfBirth}`, { continued: false });
    doc.text(`Age: ${patientData.age} years`, { continued: false });
    doc.text(`Gender: ${patientData.gender}`, { continued: false });
    doc.text(`Marital Status: ${patientData.maritalStatus}`, { continued: false });
    doc.text(`Contact Number: ${patientData.contactNumber}`, { continued: false });
    doc.text(`Email: ${patientData.email}`, { continued: false });
    doc.text(`Address: ${patientData.address}`, { continued: false });
    doc.moveDown(0.5);

    // Emergency Contact Section
    doc.fontSize(14).font('Helvetica-Bold').text('EMERGENCY CONTACT', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Name: ${patientData.emergencyContactName}`, { continued: false });
    doc.text(`Relationship: ${patientData.emergencyContactRelationship}`, { continued: false });
    doc.text(`Contact Number: ${patientData.emergencyContactNumber}`, { continued: false });
    doc.moveDown(0.5);

    // Medical Information Section
    doc.fontSize(14).font('Helvetica-Bold').text('MEDICAL INFORMATION', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Known Allergies: ${patientData.knownAllergies}`, { continued: false });
    doc.text(`Medical History: ${patientData.medicalHistory}`, { continued: false });
    doc.text(`Current Medications: ${patientData.currentMedications}`, { continued: false });
    doc.text(`Blood Type: ${patientData.bloodType}`, { continued: false });
    if (patientData.pregnancyStatus !== 'Not Applicable') {
      doc.text(`Pregnancy Status: ${patientData.pregnancyStatus}`, { continued: false });
    }
    doc.text(`Initial Diagnosis: ${patientData.initialDiagnosis}`, { continued: false });
    doc.moveDown(0.5);

    // Admission Details Section
    doc.fontSize(14).font('Helvetica-Bold').text('ADMISSION DETAILS', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    const admissionDate = new Date(patientData.admissionDateTime);
    doc.text(`Admission Date & Time: ${admissionDate.toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}`, { continued: false });
    doc.text(`Department/Ward: ${patientData.department}`, { continued: false });
    doc.text(`Bed Number: ${patientData.bedNumber}`, { continued: false });
    doc.text(`Consultant In Charge: ${patientData.consultantInCharge}`, { continued: false });
    doc.moveDown(1);

    // Footer
    doc.fontSize(9).fillColor('gray').text('This is a sample admission form for testing purposes.', { align: 'center' });
    doc.text('Generated by HDU Management System', { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
}

// Generate Discharge Form PDF
function generateDischargeFormPDF(patientData, dischargeData, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('PATIENT DISCHARGE FORM', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('gray').text(`Form Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}`, { align: 'center' });
    doc.moveDown(1);
    doc.fillColor('black');

    // Patient Information Section
    doc.fontSize(14).font('Helvetica-Bold').text('PATIENT INFORMATION', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Patient ID: ${patientData.patientNumber}`, { continued: false });
    doc.text(`Full Name: ${patientData.fullName}`, { continued: false });
    doc.text(`Age: ${patientData.age} years | Gender: ${patientData.gender}`, { continued: false });
    doc.text(`Contact Number: ${patientData.contactNumber}`, { continued: false });
    doc.text(`Address: ${patientData.address}`, { continued: false });
    doc.moveDown(0.5);

    // Admission Summary
    doc.fontSize(14).font('Helvetica-Bold').text('ADMISSION SUMMARY', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    const admissionDate = new Date(patientData.admissionDateTime);
    const dischargeDate = new Date(dischargeData.dischargeDateTime);
    doc.text(`Admission Date: ${admissionDate.toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}`, { continued: false });
    doc.text(`Discharge Date: ${dischargeDate.toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}`, { continued: false });
    doc.text(`Department: ${patientData.department}`, { continued: false });
    doc.text(`Bed Number: ${patientData.bedNumber}`, { continued: false });
    doc.text(`Consultant: ${patientData.consultantInCharge}`, { continued: false });
    doc.text(`Initial Diagnosis: ${patientData.initialDiagnosis}`, { continued: false });
    doc.moveDown(0.5);

    // Discharge Information Section
    doc.fontSize(14).font('Helvetica-Bold').text('DISCHARGE INFORMATION', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Discharge Reason:`, { continued: false });
    doc.font('Helvetica').text(dischargeData.dischargeReason, { indent: 20 });
    doc.moveDown(0.3);
    
    doc.font('Helvetica-Bold').text(`Doctor Comments:`, { continued: false });
    doc.font('Helvetica').text(dischargeData.doctorComments, { indent: 20 });
    doc.moveDown(0.3);
    
    doc.font('Helvetica-Bold').text(`Discharge Instructions:`, { continued: false });
    doc.font('Helvetica').text(dischargeData.dischargeInstructions, { indent: 20 });
    doc.moveDown(0.3);
    
    doc.font('Helvetica-Bold').text(`Medications Prescribed:`, { continued: false });
    doc.font('Helvetica').text(dischargeData.medicationsPrescribed, { indent: 20 });
    doc.moveDown(0.3);
    
    if (dischargeData.followUpRequired) {
      doc.font('Helvetica-Bold').text(`Follow-up Required: Yes`, { continued: false });
      doc.font('Helvetica').text(`Follow-up Date: ${new Date(dischargeData.followUpDate).toLocaleDateString('en-US')}`, { continued: false });
    } else {
      doc.font('Helvetica-Bold').text(`Follow-up Required: No`, { continued: false });
    }
    doc.moveDown(1);

    // Footer
    doc.fontSize(9).fillColor('gray').text('This is a sample discharge form for testing purposes.', { align: 'center' });
    doc.text('Generated by HDU Management System', { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
}

// Main function
async function generateAllForms() {
  console.log('Generating patient admission and discharge forms...');
  console.log(`Output directory: ${sampleDocsDir}`);

  // Create sample docs folder if it doesn't exist
  if (!fs.existsSync(sampleDocsDir)) {
    fs.mkdirSync(sampleDocsDir, { recursive: true });
  }

  // Create subdirectories
  const admissionDir = path.join(sampleDocsDir, 'Admission Forms');
  const dischargeDir = path.join(sampleDocsDir, 'Discharge Forms');
  
  if (!fs.existsSync(admissionDir)) {
    fs.mkdirSync(admissionDir, { recursive: true });
  }
  if (!fs.existsSync(dischargeDir)) {
    fs.mkdirSync(dischargeDir, { recursive: true });
  }

  const numberOfPatients = 8;
  const patients = [];

  // Generate patient data
  for (let i = 1; i <= numberOfPatients; i++) {
    patients.push(generatePatientData(i));
  }

  // Generate admission forms
  console.log('\nGenerating Admission Forms...');
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const fileName = `Admission_Form_Patient_${String(i + 1).padStart(2, '0')}_${patient.patientNumber}.pdf`;
    const outputPath = path.join(admissionDir, fileName);
    
    try {
      await generateAdmissionFormPDF(patient, outputPath);
      console.log(`  ✓ Generated: ${fileName}`);
    } catch (error) {
      console.error(`  ✗ Error generating ${fileName}:`, error.message);
    }
  }

  // Generate discharge forms
  console.log('\nGenerating Discharge Forms...');
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const dischargeData = generateDischargeData(patient);
    const fileName = `Discharge_Form_Patient_${String(i + 1).padStart(2, '0')}_${patient.patientNumber}.pdf`;
    const outputPath = path.join(dischargeDir, fileName);
    
    try {
      await generateDischargeFormPDF(patient, dischargeData, outputPath);
      console.log(`  ✓ Generated: ${fileName}`);
    } catch (error) {
      console.error(`  ✗ Error generating ${fileName}:`, error.message);
    }
  }

  console.log('\n✓ All forms generated successfully!');
  console.log(`\nAdmission forms location: ${admissionDir}`);
  console.log(`Discharge forms location: ${dischargeDir}`);
}

// Run the script
generateAllForms().catch(console.error);
