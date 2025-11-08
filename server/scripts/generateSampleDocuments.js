import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createCanvas } from "canvas";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for sample documents at root level
const baseDir = path.join(__dirname, "..", "..", "sample docs");

// Realistic document names
const medicalReportNames = [
  "Blood_Test_Results_2024",
  "CT_Scan_Report_Chest",
  "MRI_Report_Brain",
  "XRay_Report_Leg",
  "ECG_Report_Heart",
  "Ultrasound_Abdomen",
  "Pathology_Report_Complete",
  "Surgery_Report_Appendectomy",
  "Discharge_Summary_Hospital",
  "Lab_Report_Urine_Analysis",
  "Biopsy_Report_Tissue",
  "Endoscopy_Report_Upper_GI",
  "Colonoscopy_Report",
  "Echocardiogram_Report",
  "Pulmonary_Function_Test"
];

const idProofNames = [
  "National_ID_Card_Front",
  "National_ID_Card_Back",
  "Passport_Page_1",
  "Passport_Page_2",
  "Drivers_License_Front",
  "Drivers_License_Back",
  "Birth_Certificate",
  "Marriage_Certificate",
  "Voter_ID_Card",
  "PAN_Card",
  "Aadhar_Card_Front",
  "Aadhar_Card_Back",
  "Work_Permit",
  "Residence_Permit",
  "Student_ID_Card"
];

const consentFormNames = [
  "Surgery_Consent_Form",
  "Anesthesia_Consent_Form",
  "Blood_Transfusion_Consent",
  "Procedure_Consent_General",
  "Research_Participation_Consent",
  "Photography_Consent_Form",
  "Disclosure_Consent_Form",
  "Treatment_Consent_Form",
  "Emergency_Consent_Form",
  "Minor_Consent_Form",
  "Mental_Health_Consent",
  "Organ_Donation_Consent",
  "Autopsy_Consent_Form",
  "HIV_Testing_Consent",
  "Vaccination_Consent_Form"
];

const otherDocumentNames = [
  "Insurance_Card_Front",
  "Insurance_Card_Back",
  "Medical_History_Summary",
  "Previous_Discharge_Summary",
  "Prescription_List",
  "Allergy_Information",
  "Emergency_Contact_Details",
  "Power_of_Attorney",
  "Living_Will",
  "Advance_Directive",
  "Medical_Proxy_Form",
  "Financial_Agreement",
  "Privacy_Notice",
  "Patient_Rights_Form",
  "Complaint_Form"
];

// File extensions
const pdfExt = ".pdf";
const wordExt = ".docx";
const imageExts = [".jpg", ".jpeg", ".png"];
const videoExt = ".mp4";

// Create directory if it doesn't exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Delete existing files in sample docs directory
const deleteExistingFiles = () => {
  console.log("Cleaning up existing files in sample docs...");
  if (fs.existsSync(baseDir)) {
    const files = fs.readdirSync(baseDir);
    for (const file of files) {
      const filePath = path.join(baseDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        // Recursively delete directory contents
        deleteDirectoryContents(filePath);
        fs.rmdirSync(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    }
    console.log("  ✓ Existing files deleted");
  }
};

// Recursively delete directory contents
const deleteDirectoryContents = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        deleteDirectoryContents(filePath);
        fs.rmdirSync(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    }
  }
};

// Generate a file with content
const createFile = (filePath, content = "Sample document content") => {
  fs.writeFileSync(filePath, content, "utf8");
};

// Generate meaningful JPEG image
const generateJPEG = (filePath, documentName, category) => {
  const canvas = createCanvas(1200, 1600);
  const ctx = canvas.getContext("2d");

  // Background - white with subtle gradient
  const gradient = ctx.createLinearGradient(0, 0, 1200, 1600);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "#f5f5f5");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1600);

  // Header section with colored background
  ctx.fillStyle = "#1976d2";
  ctx.fillRect(0, 0, 1200, 120);
  
  // Hospital/Clinic name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText("HDU Management System", 600, 50);
  
  ctx.font = "20px Arial";
  ctx.fillText("Medical Document", 600, 85);

  // Document title
  ctx.fillStyle = "#000000";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText(documentName.replace(/_/g, " "), 600, 180);

  // Category badge
  ctx.fillStyle = "#4caf50";
  ctx.fillRect(450, 200, 300, 40);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Arial";
  ctx.fillText(category, 600, 225);

  // Content area
  let yPos = 280;
  ctx.fillStyle = "#000000";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";

  // Document details
  const details = [
    { label: "Document Type:", value: documentName.replace(/_/g, " ") },
    { label: "Category:", value: category },
    { label: "Date:", value: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
    { label: "Time:", value: new Date().toLocaleTimeString("en-US") },
    { label: "Status:", value: "Verified" },
  ];

  details.forEach((detail) => {
    ctx.font = "bold 18px Arial";
    ctx.fillText(detail.label, 100, yPos);
    ctx.font = "18px Arial";
    ctx.fillText(detail.value, 350, yPos);
    yPos += 40;
  });

  // Separator line
  yPos += 20;
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, yPos);
  ctx.lineTo(1100, yPos);
  ctx.stroke();

  // Document content based on category
  yPos += 40;
  ctx.font = "bold 22px Arial";
  ctx.fillText("Document Information:", 100, yPos);
  yPos += 40;

  ctx.font = "16px Arial";
  const contentText = getDocumentContent(documentName, category);
  const lines = wrapText(ctx, contentText, 1000);
  lines.forEach((line) => {
    ctx.fillText(line, 100, yPos);
    yPos += 25;
  });

  // Footer section
  yPos = 1500;
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, yPos);
  ctx.lineTo(1100, yPos);
  ctx.stroke();

  yPos += 30;
  ctx.font = "14px Arial";
  ctx.fillStyle = "#666666";
  ctx.textAlign = "center";
  ctx.fillText("This is a sample medical document for testing purposes", 600, yPos);
  ctx.fillText("Generated by HDU Management System", 600, yPos + 25);

  // Save as JPEG
  const buffer = canvas.toBuffer("image/jpeg", { quality: 0.9 });
  fs.writeFileSync(filePath, buffer);
};

// Get document content based on document name and category
const getDocumentContent = (documentName, category) => {
  const lowerName = documentName.toLowerCase();
  
  if (category === "Medical Reports") {
    if (lowerName.includes("blood")) {
      return "Complete Blood Count (CBC) results showing normal ranges for all parameters. Hemoglobin: 14.2 g/dL, White Blood Cells: 6.5 x 10^9/L, Platelets: 250 x 10^9/L. All values within normal limits.";
    } else if (lowerName.includes("ct") || lowerName.includes("scan")) {
      return "CT Scan report indicates normal findings. No abnormalities detected in the scanned area. Patient condition appears stable based on imaging results.";
    } else if (lowerName.includes("mri")) {
      return "MRI examination shows normal brain structure. No signs of abnormalities, lesions, or pathological changes observed. All anatomical structures appear within normal limits.";
    } else if (lowerName.includes("xray") || lowerName.includes("x-ray")) {
      return "X-Ray examination reveals normal bone structure. No fractures, dislocations, or pathological changes detected. Alignment and density appear normal.";
    } else if (lowerName.includes("ecg")) {
      return "Electrocardiogram shows normal sinus rhythm. Heart rate: 72 bpm. No arrhythmias or abnormalities detected. ST segments and T waves appear normal.";
    } else if (lowerName.includes("ultrasound")) {
      return "Ultrasound examination shows normal organ structure and size. No masses, cysts, or abnormalities detected. Blood flow appears normal.";
    } else if (lowerName.includes("pathology")) {
      return "Pathology report indicates normal tissue structure. No malignant cells or abnormalities detected. All findings are within normal parameters.";
    } else if (lowerName.includes("surgery")) {
      return "Surgery report documents successful procedure completion. Patient tolerated the procedure well. Post-operative condition stable. No complications observed.";
    } else if (lowerName.includes("discharge")) {
      return "Discharge summary indicates patient is stable and ready for discharge. All vital signs normal. Medications prescribed. Follow-up appointment scheduled.";
    } else if (lowerName.includes("lab") || lowerName.includes("urine")) {
      return "Laboratory analysis shows normal urine composition. No signs of infection or abnormalities. All parameters within normal ranges.";
    } else if (lowerName.includes("biopsy")) {
      return "Biopsy report shows benign tissue structure. No malignant cells detected. Findings are consistent with normal tissue characteristics.";
    } else if (lowerName.includes("endoscopy")) {
      return "Endoscopy examination reveals normal upper GI tract. No ulcers, inflammation, or abnormalities detected. Mucosa appears healthy.";
    } else if (lowerName.includes("colonoscopy")) {
      return "Colonoscopy examination shows normal colon structure. No polyps, inflammation, or abnormalities detected. Mucosa appears healthy throughout.";
    } else if (lowerName.includes("echocardiogram")) {
      return "Echocardiogram shows normal heart function. Ejection fraction: 60%. No valvular abnormalities or structural defects detected.";
    } else if (lowerName.includes("pulmonary")) {
      return "Pulmonary function test results indicate normal lung capacity and function. All spirometry values within normal ranges. No signs of respiratory impairment.";
    }
  } else if (category === "ID Proofs") {
    return "This document serves as official identification proof. Contains personal information including name, date of birth, identification number, and photograph. Document is valid and verified.";
  } else if (category === "Consent Forms") {
    return "This consent form documents patient agreement for the specified medical procedure or treatment. Patient has been informed of risks, benefits, and alternatives. Consent obtained after thorough explanation.";
  } else if (category === "Other Documents") {
    if (lowerName.includes("insurance")) {
      return "Insurance card information including policy number, coverage details, and contact information. Valid for current period. Coverage includes hospitalization and medical procedures.";
    } else if (lowerName.includes("medical history")) {
      return "Comprehensive medical history summary including past illnesses, surgeries, medications, and allergies. Updated with current medical information and treatment records.";
    } else if (lowerName.includes("prescription")) {
      return "List of current medications including dosages, frequencies, and instructions. Medications prescribed by authorized medical professionals. Follow dosage instructions carefully.";
    } else if (lowerName.includes("allergy")) {
      return "Allergy information document listing known allergies, reactions, and severity. Important for medical staff reference. Update as needed with new allergy information.";
    } else {
      return "This document contains important medical or administrative information relevant to patient care. Please review carefully and keep for your records.";
    }
  }
  
  return "This medical document contains important information relevant to patient care and treatment. Please review all details carefully.";
};

// Helper function to wrap text
const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

// Generate documents for a category
const generateDocuments = (category, names, folderName) => {
  const folderPath = path.join(baseDir, folderName);
  ensureDirectoryExists(folderPath);

  console.log(`\nGenerating ${category} documents in ${folderName}/`);

  // Generate PDFs
  for (let i = 0; i < 15; i++) {
    const fileName = `${names[i]}${pdfExt}`;
    const filePath = path.join(folderPath, fileName);
    createFile(filePath, `Sample PDF document: ${names[i]}`);
    console.log(`  Created: ${fileName}`);
  }

  // Generate Word documents
  for (let i = 0; i < 15; i++) {
    const fileName = `${names[i]}${wordExt}`;
    const filePath = path.join(folderPath, fileName);
    createFile(filePath, `Sample Word document: ${names[i]}`);
    console.log(`  Created: ${fileName}`);
  }

  // Generate Images (JPEG only for meaningful images)
  for (let i = 0; i < 15; i++) {
    const fileName = `${names[i]}.jpeg`;
    const filePath = path.join(folderPath, fileName);
    try {
      generateJPEG(filePath, names[i], category);
      console.log(`  Created: ${fileName}`);
    } catch (error) {
      console.error(`  Error creating ${fileName}:`, error.message);
      // Fallback to text file if canvas fails
      createFile(filePath, `Sample image document: ${names[i]}`);
    }
  }

  // Generate Videos
  for (let i = 0; i < 5; i++) {
    const fileName = `${names[i]}_Video${videoExt}`;
    const filePath = path.join(folderPath, fileName);
    createFile(filePath, `Sample video document: ${names[i]}`);
    console.log(`  Created: ${fileName}`);
  }
};

// Main function
const main = () => {
  console.log("Generating sample patient documents...");
  console.log("======================================");
  
  // Delete existing files first
  deleteExistingFiles();

  // Generate Medical Reports
  generateDocuments(
    "Medical Reports",
    medicalReportNames,
    "medical-reports"
  );

  // Generate ID Proofs
  generateDocuments(
    "ID Proofs",
    idProofNames,
    "id-proof"
  );

  // Generate Consent Forms
  generateDocuments(
    "Consent Forms",
    consentFormNames,
    "consent-forms"
  );

  // Generate Other Documents
  generateDocuments(
    "Other Documents",
    otherDocumentNames,
    "other"
  );

  console.log("\n======================================");
  console.log("Sample documents generation completed!");
  console.log("\nSummary:");
  console.log("  Medical Reports: 15 PDFs, 15 Word docs, 15 images, 5 MP4 videos");
  console.log("  ID Proofs: 15 PDFs, 15 Word docs, 15 images, 5 MP4 videos");
  console.log("  Consent Forms: 15 PDFs, 15 Word docs, 15 images, 5 MP4 videos");
  console.log("  Other Documents: 15 PDFs, 15 Word docs, 15 images, 5 MP4 videos");
  console.log("  Total: 200 files");
};

main();

