import { BedMySQL, Admission, Patient, MedicalRecord, EmergencyContact, PatientDocument } from "../config/mysqlDB.js";
import patientRepository from "../repositories/patientRepository.js";
import { Op } from "sequelize";
import { generatePatientNumber } from "../utils/generators.js";
import fs from "fs";
import path from "path";

export async function getBeds(req, res) {
  try {
    // Get all beds
    const beds = await BedMySQL.findAll({
      attributes: ["id", "bedNumber", "patientId", "createdAt", "updatedAt"],
    });
    
    // Get all patients with related data
    const patients = await Patient.findAll({
      attributes: [
        "id", 
        "patientNumber", 
        "fullName", 
        "nicPassport",
        "gender", 
        "contactNumber", 
        "email",
        "dateOfBirth", 
        "age",
        "maritalStatus",
        "address", 
        "createdAt"
      ],
      include: [
        {
          model: MedicalRecord,
          as: "medicalRecords",
          attributes: [
            "knownAllergies",
            "medicalHistory", 
            "currentMedications",
            "pregnancyStatus",
            "bloodType",
            "initialDiagnosis"
          ]
        },
        {
          model: EmergencyContact,
          as: "emergencyContacts",
          attributes: [
            "name",
            "relationship", 
            "contactNumber"
          ]
        },
        {
          model: Admission,
          as: "admissions",
          where: { status: "Active" },
          required: false,
          attributes: [
            "admissionDateTime",
            "department",
            "consultantInCharge",
            "status"
          ]
        }
      ]
    });
    
    // Create a map of patients for quick lookup
    const patientMap = {};
    patients.forEach(patient => {
      const patientData = patient.toJSON();
      
      // Merge related data into patient object
      if (patientData.medicalRecords && patientData.medicalRecords.length > 0) {
        const medicalRecord = patientData.medicalRecords[0];
        patientData.knownAllergies = medicalRecord.knownAllergies;
        patientData.medicalHistory = medicalRecord.medicalHistory;
        patientData.currentMedications = medicalRecord.currentMedications;
        patientData.pregnancyStatus = medicalRecord.pregnancyStatus;
        patientData.bloodType = medicalRecord.bloodType;
        patientData.initialDiagnosis = medicalRecord.initialDiagnosis;
        delete patientData.medicalRecords;
      }
      
      if (patientData.emergencyContacts && patientData.emergencyContacts.length > 0) {
        const emergencyContact = patientData.emergencyContacts[0];
        patientData.emergencyContactName = emergencyContact.name;
        patientData.emergencyContactRelationship = emergencyContact.relationship;
        patientData.emergencyContactNumber = emergencyContact.contactNumber;
        delete patientData.emergencyContacts;
      }
      
      if (patientData.admissions && patientData.admissions.length > 0) {
        const admission = patientData.admissions[0];
        patientData.admissionDateTime = admission.admissionDateTime;
        patientData.department = admission.department;
        patientData.consultantInCharge = admission.consultantInCharge;
        delete patientData.admissions;
      }
      
      patientMap[patientData.id] = patientData;
    });
    
    // Combine beds with patient data
    const bedsWithPatients = beds.map(bed => {
      const bedData = bed.toJSON();
      if (bedData.patientId && patientMap[bedData.patientId]) {
        bedData.Patient = patientMap[bedData.patientId];
      }
      return bedData;
    });
    
    res.json(bedsWithPatients);
  } catch (err) {
    console.error("Error in getBeds:", err);
    res.status(500).send("Server error");
  }
}

export async function getBedById(req, res) {
  try {
    const { bedId } = req.params;
    
    if (!bedId) {
      return res.status(400).json({ msg: "Bed ID is required" });
    }

    const bed = await BedMySQL.findOne({
      where: { id: bedId },
      attributes: ["id", "bedNumber", "patientId", "createdAt", "updatedAt"],
    });

    if (!bed) {
      return res.status(404).json({ msg: "Bed not found" });
    }

    // If bed has a patient, get detailed patient information
    if (bed.patientId) {
      const patient = await Patient.findOne({
        where: { id: bed.patientId },
        attributes: [
          "id", 
          "patientNumber", 
          "fullName", 
          "nicPassport",
          "gender", 
          "contactNumber", 
          "email",
          "dateOfBirth", 
          "age",
          "maritalStatus",
          "address", 
          "createdAt"
        ],
        include: [
          {
            model: MedicalRecord,
            as: "medicalRecords",
            attributes: [
              "knownAllergies",
              "medicalHistory", 
              "currentMedications",
              "pregnancyStatus",
              "bloodType",
              "initialDiagnosis"
            ]
          },
          {
            model: EmergencyContact,
            as: "emergencyContacts",
            attributes: [
              "name",
              "relationship", 
              "contactNumber"
            ]
          },
          {
            model: Admission,
            as: "admissions",
            where: { status: "Active" },
            required: false,
            attributes: [
              "admissionDateTime",
              "department",
              "consultantInCharge",
              "status"
            ]
          }
        ]
      });

      if (patient) {
        const patientData = patient.toJSON();
        
        // Merge related data into patient object
        if (patientData.medicalRecords && patientData.medicalRecords.length > 0) {
          const medicalRecord = patientData.medicalRecords[0];
          patientData.knownAllergies = medicalRecord.knownAllergies;
          patientData.medicalHistory = medicalRecord.medicalHistory;
          patientData.currentMedications = medicalRecord.currentMedications;
          patientData.pregnancyStatus = medicalRecord.pregnancyStatus;
          patientData.bloodType = medicalRecord.bloodType;
          patientData.initialDiagnosis = medicalRecord.initialDiagnosis;
          delete patientData.medicalRecords;
        }
        
        if (patientData.emergencyContacts && patientData.emergencyContacts.length > 0) {
          const emergencyContact = patientData.emergencyContacts[0];
          patientData.emergencyContactName = emergencyContact.name;
          patientData.emergencyContactRelationship = emergencyContact.relationship;
          patientData.emergencyContactNumber = emergencyContact.contactNumber;
          delete patientData.emergencyContacts;
        }
        
        if (patientData.admissions && patientData.admissions.length > 0) {
          const admission = patientData.admissions[0];
          patientData.admissionDateTime = admission.admissionDateTime;
          patientData.department = admission.department;
          patientData.consultantInCharge = admission.consultantInCharge;
          delete patientData.admissions;
        }
        
        bed.Patient = patientData;
      }
    }

    res.json(bed);
  } catch (err) {
    console.error("getBedById Error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
}

export async function getBedsByStatus(req, res) {
  try {
    const { status } = req.query; // 'occupied' or 'available'
    
    let whereClause = {};
    if (status === 'occupied') {
      whereClause.patientId = { [Op.ne]: null };
    } else if (status === 'available') {
      whereClause.patientId = null;
    }

    const beds = await BedMySQL.findAll({
      where: whereClause,
      attributes: ["id", "bedNumber", "patientId", "createdAt", "updatedAt"],
    });

    // Get all patients with related data for occupied beds
    const patientIds = beds.filter(bed => bed.patientId).map(bed => bed.patientId);
    const patients = await Patient.findAll({
      where: { id: patientIds },
      attributes: [
        "id", 
        "patientNumber", 
        "fullName", 
        "nicPassport",
        "gender", 
        "contactNumber", 
        "email",
        "dateOfBirth", 
        "age",
        "maritalStatus",
        "address", 
        "createdAt"
      ],
      include: [
        {
          model: MedicalRecord,
          as: "medicalRecords",
          attributes: [
            "knownAllergies",
            "medicalHistory", 
            "currentMedications",
            "pregnancyStatus",
            "bloodType",
            "initialDiagnosis"
          ]
        },
        {
          model: EmergencyContact,
          as: "emergencyContacts",
          attributes: [
            "name",
            "relationship", 
            "contactNumber"
          ]
        },
        {
          model: Admission,
          as: "admissions",
          where: { status: "Active" },
          required: false,
          attributes: [
            "admissionDateTime",
            "department",
            "consultantInCharge",
            "status"
          ]
        }
      ]
    });

    // Create a map of patients for quick lookup
    const patientMap = {};
    patients.forEach(patient => {
      const patientData = patient.toJSON();
      
      // Merge related data into patient object
      if (patientData.medicalRecords && patientData.medicalRecords.length > 0) {
        const medicalRecord = patientData.medicalRecords[0];
        patientData.knownAllergies = medicalRecord.knownAllergies;
        patientData.medicalHistory = medicalRecord.medicalHistory;
        patientData.currentMedications = medicalRecord.currentMedications;
        patientData.pregnancyStatus = medicalRecord.pregnancyStatus;
        patientData.bloodType = medicalRecord.bloodType;
        patientData.initialDiagnosis = medicalRecord.initialDiagnosis;
        delete patientData.medicalRecords;
      }
      
      if (patientData.emergencyContacts && patientData.emergencyContacts.length > 0) {
        const emergencyContact = patientData.emergencyContacts[0];
        patientData.emergencyContactName = emergencyContact.name;
        patientData.emergencyContactRelationship = emergencyContact.relationship;
        patientData.emergencyContactNumber = emergencyContact.contactNumber;
        delete patientData.emergencyContacts;
      }
      
      if (patientData.admissions && patientData.admissions.length > 0) {
        const admission = patientData.admissions[0];
        patientData.admissionDateTime = admission.admissionDateTime;
        patientData.department = admission.department;
        patientData.consultantInCharge = admission.consultantInCharge;
        delete patientData.admissions;
      }
      
      patientMap[patientData.id] = patientData;
    });

    // Combine beds with patient data
    const bedsWithPatients = beds.map(bed => {
      const bedData = bed.toJSON();
      if (bedData.patientId && patientMap[bedData.patientId]) {
        bedData.Patient = patientMap[bedData.patientId];
      }
      return bedData;
    });

    res.json(bedsWithPatients);
  } catch (err) {
    console.error("getBedsByStatus Error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
}

export async function updateBed(req, res) {
  try {
    const { bedId } = req.params;
    const { bedNumber, patientId } = req.body;

    if (!bedId) {
      return res.status(400).json({ msg: "Bed ID is required" });
    }

    const bed = await BedMySQL.findOne({ where: { id: bedId } });
    if (!bed) {
      return res.status(404).json({ msg: "Bed not found" });
    }

    const updateData = {};
    if (bedNumber !== undefined) updateData.bedNumber = bedNumber;
    if (patientId !== undefined) updateData.patientId = patientId;

    await bed.update(updateData);

    res.json({
      msg: "Bed updated successfully",
      bed: bed
    });
  } catch (err) {
    console.error("updateBed Error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
}

export async function assignBed(req, res) {
  try {
    const { patientData } = req.body;
    const { bedId } = patientData;

    if (!bedId) {
      console.error("Bed ID is missing in request:", req.body);
      return res.status(400).json({ msg: "Bed ID is required" });
    }

    if (!patientData || Object.keys(patientData).length === 0) {
      console.error("Patient data is missing or empty");
      return res.status(400).json({ msg: "Patient data is required" });
    }
    
    const bed = await BedMySQL.findOne({ where: { id: bedId } });
    if (!bed) {
      console.error("Bed not found:", bedId);
      return res.status(404).json({ msg: "Bed not found" });
    }

    if (bed.patientId !== null) {
      console.error("Bed is already occupied by another patient:", bedId);
      return res.status(400).json({ msg: "Bed is already occupied" });
    }

    try {
      // Check if patient with same NIC already exists
      let existingPatient = null;
      if (patientData.nicPassport) {
        existingPatient = await Patient.findOne({
          where: { nicPassport: patientData.nicPassport }
        });
      }

      let result;
      if (existingPatient) {
        // Use existing patient
        result = await patientRepository.createAdmissionForExistingPatient(existingPatient.id, patientData);
      } else {
        // Create new patient
        result = await patientRepository.createPatient(patientData);
      }

      const [updatedCount] = await BedMySQL.update(
        { patientId: result.patient.id },
        { where: { id: bedId, patientId: null } }
      );

      if (updatedCount > 0) {
        return res.json({
          msg: existingPatient ? "Bed assigned to existing patient successfully" : "Bed assigned successfully",
          patientId: result.patient.id,
          patientNumber: result.patient.patientNumber,
          admissionId: result.admission.id,
        });
      } else {
        console.error("Failed to update the bed:", bedId);
        return res.status(400).json({ msg: "Failed to assign bed" });
      }
    } catch (error) {
      console.error("Error creating patient:", error);
      return res.status(500).json({
        msg: "Failed to create patient record",
        error: error.message,
      });
    }
  } catch (err) {
    console.error("assignBed Error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
}

export async function deAssignBed(req, res) {
  try {
    const { bedId } = req.params;

    if (!bedId) {
      console.error("Bed ID is missing in request");
      return res.status(400).json({ msg: "Bed ID is required" });
    }

    const bed = await BedMySQL.findOne({ where: { id: bedId } });
    if (!bed) {
      console.error("Bed not found:", bedId);
      return res.status(404).json({ msg: "Bed not found" });
    }

    if (bed.patientId === null) {
      console.error("Bed is already unoccupied:", bedId);
      return res.status(400).json({ msg: "Bed is already unoccupied" });
    }
    if (bed.patientId) {
      try {
        // Delete all patient documents before discharge
        const patientDocuments = await PatientDocument.findAll({
          where: { patientId: bed.patientId }
        });

        for (const doc of patientDocuments) {
          try {
            // Delete physical file
            let cleanPath = doc.fileUrl;
            if (cleanPath.startsWith('/uploads/uploads/')) {
              // Fix double uploads path from old format
              cleanPath = cleanPath.replace('/uploads/uploads/', '/uploads/');
            }
            if (cleanPath.startsWith('/uploads/')) {
              cleanPath = cleanPath.replace('/uploads/', 'uploads/');
            }
            const filePath = path.join(process.cwd(), cleanPath);
            
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            } else {
              console.warn(`File not found: ${filePath}`);
            }

            // Delete database record
            await doc.destroy();
          } catch (fileError) {
            console.error(`Error deleting document ${doc.fileName}:`, fileError.message);
          }
        }

        const admissions = await Admission.findAll({
          where: {
            patientId: bed.patientId,
            status: "Active",
          },
          order: [["createdAt", "DESC"]],
        });

        if (admissions && admissions.length > 0) {
          const currentAdmission = admissions[0];
          await currentAdmission.update({
            status: "Discharged",
            dischargeDateTime: new Date(),
          });
        }
      } catch (error) {
        console.warn("Could not update admission status or delete documents:", error.message);
      }
    }

    const [updatedCount] = await BedMySQL.update(
      { patientId: null },
      { where: { id: bedId } }
    );

    if (updatedCount > 0) {
      return res.json({ 
        msg: "Bed deassigned successfully", 
        note: "All patient documents have been deleted"
      });
    } else {
      console.error("Failed to update the bed:", bedId);
      return res.status(400).json({ msg: "Failed to deassign bed" });
    }
  } catch (err) {
    console.error("deAssignBed Error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
}

export async function debugPatients(req, res) {
  try {
    const patients = await Patient.findAll({
      attributes: ["id", "patientNumber", "fullName", "gender", "contactNumber", "dateOfBirth", "address"],
    });
    
    const beds = await BedMySQL.findAll({
      attributes: ["id", "bedNumber", "patientId"],
    });
    
    
    res.json({
      patients: patients,
      beds: beds,
    });
  } catch (err) {
    console.error("Error in debugPatients:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function generateUniquePatientId(req, res) {
  try {
    const patientNumber = await generatePatientNumber();
    res.json({ patientId: patientNumber });
  } catch (err) {
    console.error("Error generating patient ID:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
}
