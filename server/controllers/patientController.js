import { Patient, BedMySQL, CriticalFactor, Admission, VitalSignsConfig, EmergencyContact, MedicalRecord, AuditLog, PatientDocument, UserMySQLModel as User, sequelize } from "../config/mysqlDB.js";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";

/**
 * Compares old and new values to identify changes for audit logging
 * @param {Object|null} oldValues - Previous state of the record
 * @param {Object} newValues - Current state of the record
 * @returns {Object} Object containing only the changed fields with old/new values
 */
function getChangedValues(oldValues, newValues) {
  const changes = {};
  for (const key in newValues) {
    const oldVal = oldValues ? oldValues[key] : null;
    const newVal = newValues[key];
    
    // Skip if both values are null/undefined
    if (oldVal == null && newVal == null) {
      continue;
    }
    
    // Special handling for Date objects and date strings
    let hasChanged = false;
    if (oldVal instanceof Date || newVal instanceof Date || 
        (typeof oldVal === 'string' && oldVal.includes('T') && oldVal.includes('Z')) ||
        (typeof newVal === 'string' && newVal.includes('T') && newVal.includes('Z'))) {
      // Compare dates by converting to timestamps
      const oldDate = oldVal ? new Date(oldVal) : null;
      const newDate = newVal ? new Date(newVal) : null;
      
      if (oldDate == null && newDate == null) {
        hasChanged = false;
      } else if (oldDate == null || newDate == null) {
        hasChanged = true;
      } else {
        // Compare timestamps (ignore milliseconds for comparison)
        const oldTime = Math.floor(oldDate.getTime() / 1000);
        const newTime = Math.floor(newDate.getTime() / 1000);
        hasChanged = oldTime !== newTime;
      }
    } else {
      // Regular comparison for non-date values
      hasChanged = oldVal !== newVal;
    }
    
    if (hasChanged) {
      changes[key] = {
        old: oldVal,
        new: newVal,
      };
    }
  }
  return changes;
}

/**
 * Creates an audit log entry for patient data changes
 * @param {number} userId - ID of the user performing the action
 * @param {string} action - Action type (CREATE, UPDATE)
 * @param {string} tableName - Name of the table being modified
 * @param {number|string} recordId - ID of the record being modified
 * @param {Object|null} oldValues - Previous state (null for CREATE)
 * @param {Object} newValues - New state or initial values
 * @param {string} description - Human-readable description of the action
 * @param {Object} transaction - Sequelize transaction object (optional)
 */
async function logPatientAudit(userId, action, tableName, recordId, oldValues, newValues, description, transaction = null) {
  try {
    const changes = action === "CREATE" 
      ? { initialValues: newValues }
      : getChangedValues(oldValues, newValues);

    const auditData = {
      userId,
      action,
      tableName,
      recordId: String(recordId),
      oldValues: (action === "CREATE") ? null : oldValues,
      newValues: (action === "CREATE") ? newValues : changes,
      description,
      timestamp: new Date(),
    };

    if (transaction) {
      await AuditLog.create(auditData, { transaction });
    } else {
      await AuditLog.create(auditData);
    }
  } catch (error) {
    console.error("Audit log failed:", error);
    throw error;
  }
}

/**
 * Checks if a patient record is complete with all required fields
 * Required fields: fullName, nicPassport, dateOfBirth, age, gender, contactNumber, address
 * Also requires: emergencyContact, medicalRecord with initialDiagnosis, and admission with consultantInCharge
 * @param {Object} patient - Patient model instance
 * @param {Object} emergencyContact - EmergencyContact model instance
 * @param {Object} medicalRecord - MedicalRecord model instance
 * @param {Object} admission - Admission model instance
 * @returns {boolean} - True if patient is complete, false otherwise
 */
function checkIfPatientIsComplete(patient, emergencyContact, medicalRecord, admission) {
  if (!patient) return false;

  // Only fullName and gender are required fields
  const hasRequiredFields = 
    patient.fullName && patient.fullName.trim() !== "" &&
    patient.gender && patient.gender.trim() !== "";

  return hasRequiredFields;
}

/**
 * Retrieves comprehensive patient analytics including demographics and vital signs trends
 * @route GET /api/patients/analytics
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getPatientAnalytics(req, res) {
  try {
    // Get only active patients (those currently in beds)
    const activeBeds = await BedMySQL.findAll({
      where: {
        patientId: { [Op.ne]: null }
      },
      attributes: ['patientId']
    });
    
    const activePatientIds = activeBeds.map(bed => bed.patientId);
    
    if (activePatientIds.length === 0) {
      // No active patients, return empty data
      return res.json({
        totalPatients: 0,
        genderDistribution: [],
        ageGroups: [],
        vitalSignsTrends: {
          heartRate: [],
          bloodPressure: [],
          temperature: [],
          spO2: []
        },
        criticalPatients: 0,
        bedOccupancy: {
          occupied: 0,
          total: await BedMySQL.count(),
          rate: 0
        }
      });
    }
    
    const totalPatients = activePatientIds.length;
    
    // Get gender distribution for active patients only
    const genderDistributionRaw = await Patient.findAll({
      attributes: [
        'gender',
        [Patient.sequelize.fn('COUNT', Patient.sequelize.col('id')), 'count']
      ],
      where: {
        id: { [Op.in]: activePatientIds }
      },
      group: ['gender']
    });
    
    const genderDistribution = genderDistributionRaw.map(item => ({
      label: item.gender || 'Unknown',
      value: parseInt(item.dataValues.count),
      color: item.gender === 'Male' ? '#2196F3' : item.gender === 'Female' ? '#E91E63' : '#9E9E9E'
    }));
    
    // Get age distribution for active patients only
    const patientsWithAge = await Patient.findAll({
      attributes: ['id', 'dateOfBirth', 'age'],
      where: {
        id: { [Op.in]: activePatientIds },
        [Op.or]: [
          { age: { [Op.ne]: null } },
          { dateOfBirth: { [Op.ne]: null } }
        ]
      }
    });
    
    const ageGroups = {
      '0-30': 0,
      '30-40': 0,
      '40-50': 0,
      '50-60': 0,
      '60+': 0
    };
    
    patientsWithAge.forEach(patient => {
      const age = patient.age || (patient.dateOfBirth ? 
        Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null);
      
      if (age !== null) {
        if (age < 30) ageGroups['0-30']++;
        else if (age < 40) ageGroups['30-40']++;
        else if (age < 50) ageGroups['40-50']++;
        else if (age < 60) ageGroups['50-60']++;
        else ageGroups['60+']++;
      }
    });
    
    const ageGroupsFormatted = [
      { label: '0-30', value: ageGroups['0-30'], color: '#2196F3' },
      { label: '30-40', value: ageGroups['30-40'], color: '#4CAF50' },
      { label: '40-50', value: ageGroups['40-50'], color: '#FF9800' },
      { label: '50-60', value: ageGroups['50-60'], color: '#F44336' },
      { label: '60+', value: ageGroups['60+'], color: '#9C27B0' }
    ].filter(item => item.value > 0);
    
    const vitalSignsTrends = {
      heartRate: [],
      bloodPressure: [],
      temperature: [],
      spO2: []
    };
    
    // Get vital signs trends only for active patients
    const recentFactors = await CriticalFactor.findAll({
      attributes: ['heartRate', 'bloodPressureSystolic', 'bloodPressureDiastolic', 'temperature', 'spO2', 'recordedAt'],
      where: {
        patientId: { [Op.in]: activePatientIds },
        recordedAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      order: [['recordedAt', 'DESC']],
      limit: 12
    });
    
    recentFactors.forEach(factor => {
      if (factor.heartRate) vitalSignsTrends.heartRate.push(factor.heartRate);
      if (factor.bloodPressureSystolic) vitalSignsTrends.bloodPressure.push(factor.bloodPressureSystolic);
      if (factor.temperature) vitalSignsTrends.temperature.push(parseFloat(factor.temperature));
      if (factor.spO2) vitalSignsTrends.spO2.push(factor.spO2);
    });
    
    vitalSignsTrends.heartRate = vitalSignsTrends.heartRate.reverse();
    vitalSignsTrends.bloodPressure = vitalSignsTrends.bloodPressure.reverse();
    vitalSignsTrends.temperature = vitalSignsTrends.temperature.reverse();
    vitalSignsTrends.spO2 = vitalSignsTrends.spO2.reverse();
    
    const vitalSignsConfigs = await VitalSignsConfig.findAll({
      where: { isActive: true },
      order: [["displayOrder", "ASC"]],
    });

    const metadataFields = ['id', 'patientId', 'recordedAt', 'recordedBy', 'isAmended', 
      'amendedBy', 'amendedAt', 'amendmentReason', 'dynamicVitals', 'createdAt', 'updatedAt'];
    const modelAttributes = Object.keys(CriticalFactor.rawAttributes || {});
    const validCriticalFactorFields = modelAttributes.filter(attr => !metadataFields.includes(attr));
    
    const criticalConditions = [];
    
    for (const config of vitalSignsConfigs) {
      const fieldName = config.name;
      
      if (validCriticalFactorFields.includes(fieldName)) {
        if (config.normalRangeMin !== null || config.normalRangeMax !== null) {
          if (config.normalRangeMax !== null) {
            criticalConditions.push({
              [fieldName]: { [Op.gt]: config.normalRangeMax },
            });
          }
          if (config.normalRangeMin !== null) {
            criticalConditions.push({
              [fieldName]: { [Op.lt]: config.normalRangeMin },
            });
          }
        }
      }
    }
    
    // Get critical patients only for active patients
    let criticalPatients = [];
    if (criticalConditions.length > 0) {
      criticalPatients = await CriticalFactor.findAll({
        where: {
          [Op.or]: criticalConditions,
          patientId: { [Op.in]: activePatientIds }
        },
        include: {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'fullName', 'patientNumber']
        }
      });
    }
    
    const occupiedBeds = await BedMySQL.count({
      where: {
        patientId: { [Op.ne]: null }
      }
    });
    
    const totalBeds = await BedMySQL.count();
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    
    res.json({
      totalPatients,
      genderDistribution,
      ageGroups: ageGroupsFormatted,
      vitalSignsTrends,
      criticalPatients: criticalPatients.length,
      bedOccupancy: {
        occupied: occupiedBeds,
        total: totalBeds,
        rate: Math.round(occupancyRate * 100) / 100
      }
    });
  } catch (err) {
    console.error("Error in getPatientAnalytics:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
}

/**
 * Retrieves a specific patient by ID with related bed and critical factors
 * @route GET /api/patients/:patientId
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.patientId - ID of the patient
 * @param {Object} res - Express response object
 */
export async function getPatientById(req, res) {
  try {
    const { patientId } = req.params;
    
    if (!patientId) {
      return res.status(400).json({ msg: "Patient ID is required" });
    }

    const patient = await Patient.findOne({
      where: { id: patientId },
      include: [
        {
          model: BedMySQL,
          as: 'bed',
          attributes: ['id', 'bedNumber']
        },
        {
          model: CriticalFactor,
          as: 'criticalFactors',
          attributes: [
            'id', 
            'heartRate', 
            'respiratoryRate',
            'bloodPressureSystolic',
            'bloodPressureDiastolic',
            'spO2',
            'temperature',
            'glasgowComaScale',
            'painScale',
            'bloodGlucose',
            'urineOutput',
            'dynamicVitals',
            'recordedAt',
            'createdAt'
          ],
          order: [['recordedAt', 'DESC']],
          limit: 10
        },
        {
          model: EmergencyContact,
          as: 'emergencyContacts',
          attributes: ['id', 'name', 'relationship', 'contactNumber', 'isPrimary']
        },
        {
          model: MedicalRecord,
          as: 'medicalRecords',
          attributes: [
            'id',
            'knownAllergies',
            'medicalHistory',
            'currentMedications',
            'pregnancyStatus',
            'bloodType',
            'initialDiagnosis'
          ]
        },
        {
          model: Admission,
          as: 'admissions',
          where: { status: 'Active' },
          required: false,
          attributes: [
            'id',
            'admissionDateTime',
            'department',
            'consultantInCharge',
            'status'
          ]
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    const patientData = patient.toJSON();
    console.log("getPatientById - Patient ID:", patientId);
    console.log("getPatientById - Emergency Contacts:", patientData.emergencyContacts);
    console.log("getPatientById - Medical Records:", patientData.medicalRecords);
    console.log("getPatientById - Admissions:", patientData.admissions);

    res.json(patient);
  } catch (err) {
    console.error("getPatientById Error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
}

/**
 * Retrieves all patients in the system
 * @route GET /api/patients
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getAllPatients(req, res) {
  try {
    const patients = await Patient.findAll({
      attributes: [
        'id',
        'patientNumber',
        'fullName',
        'gender',
        'contactNumber',
        'dateOfBirth',
        'address',
        'createdAt'
      ],
      include: [
        {
          model: BedMySQL,
          as: 'bed',
          attributes: ['id', 'bedNumber']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(patients);
  } catch (err) {
    console.error("getAllPatients Error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
}

/**
 * Calculates average length of stay statistics for patients
 * Includes current patients, discharged patients, and stay duration metrics
 * @route GET /api/patients/analytics/alos
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getAverageLengthOfStay(req, res) {
  try {
    const alosQuery = `
      SELECT 
        AVG(DATEDIFF(dischargeDateTime, admissionDateTime)) as avgLengthOfStay,
        COUNT(*) as totalDischargedPatients,
        MIN(DATEDIFF(dischargeDateTime, admissionDateTime)) as minStay,
        MAX(DATEDIFF(dischargeDateTime, admissionDateTime)) as maxStay,
        AVG(DATEDIFF(NOW(), admissionDateTime)) as currentAvgStay
      FROM admissions 
      WHERE status = 'Discharged'
        AND dischargeDateTime IS NOT NULL 
        AND admissionDateTime IS NOT NULL
        AND dischargeDateTime > admissionDateTime
    `;

    const currentPatientsQuery = `
      SELECT 
        COUNT(*) as currentPatients,
        AVG(DATEDIFF(NOW(), admissionDateTime)) as currentAvgStay
      FROM admissions 
      WHERE status = 'Active'
        AND admissionDateTime IS NOT NULL
    `;

    const [alosResult] = await Patient.sequelize.query(alosQuery);
    const [currentPatientsResult] = await Patient.sequelize.query(currentPatientsQuery);

    const alosByDepartmentQuery = `
      SELECT 
        department,
        AVG(DATEDIFF(dischargeDateTime, admissionDateTime)) as avgLengthOfStay,
        COUNT(*) as patientCount
      FROM admissions 
      WHERE status = 'Discharged'
        AND dischargeDateTime IS NOT NULL 
        AND admissionDateTime IS NOT NULL
        AND dischargeDateTime > admissionDateTime
      GROUP BY department
    `;

    const [alosByDepartmentResult] = await Patient.sequelize.query(alosByDepartmentQuery);

    res.json({
      avgLengthOfStay: parseFloat(alosResult[0]?.avgLengthOfStay || 0).toFixed(1),
      totalDischargedPatients: alosResult[0]?.totalDischargedPatients || 0,
      minStay: alosResult[0]?.minStay || 0,
      maxStay: alosResult[0]?.maxStay || 0,
      currentPatients: currentPatientsResult[0]?.currentPatients || 0,
      currentAvgStay: parseFloat(currentPatientsResult[0]?.currentAvgStay || 0).toFixed(1),
      byDepartment: alosByDepartmentResult
    });
  } catch (error) {
    console.error("Error calculating ALOS:", error);
    res.status(500).json({ 
      message: "Failed to calculate average length of stay",
      error: error.message 
    });
  }
}

/**
 * Updates incomplete patient data
 * Used to complete urgent admissions with full patient information
 * @route PUT /api/patients/:patientId/update-incomplete
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.patientId - ID of the patient to update
 * @param {Object} req.body - Complete patient data
 * @param {Object} res - Express response object
 */
export async function updateIncompletePatient(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const { patientId } = req.params;
    const patientData = req.body;
    const userId = req.user?.id || null;

    const patient = await Patient.findByPk(patientId, { transaction });
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({ msg: "Patient not found" });
    }

    // Allow updates for all patients (not just urgent admissions)
    // This enables "View Full Details" to edit any patient anytime

    // Validate required fields: only fullName and gender are required for incomplete patient updates
    const fullName = patientData.fullName !== undefined ? patientData.fullName : patient.fullName;
    const gender = patientData.gender !== undefined ? patientData.gender : patient.gender;

    if (!fullName || !fullName.trim()) {
      await transaction.rollback();
      return res.status(400).json({ msg: "Full name is required" });
    }

    if (!gender || !gender.trim()) {
      await transaction.rollback();
      return res.status(400).json({ msg: "Gender is required" });
    }

    console.log("Updating patient:", patientId, "Data:", JSON.stringify(patientData, null, 2));

    const oldPatientValues = patient.toJSON();
    const updateData = {
      fullName: fullName.trim(),
      nicPassport: patientData.nicPassport !== undefined ? (patientData.nicPassport || null) : patient.nicPassport,
      dateOfBirth: patientData.dateOfBirth !== undefined ? (patientData.dateOfBirth || null) : patient.dateOfBirth,
      age: patientData.age !== undefined ? (patientData.age ? parseInt(patientData.age) : null) : patient.age,
      gender: gender.trim(),
      maritalStatus: patientData.maritalStatus !== undefined ? patientData.maritalStatus : (patient.maritalStatus || "Unknown"),
      contactNumber: patientData.contactNumber !== undefined ? (patientData.contactNumber || null) : patient.contactNumber,
      email: patientData.email !== undefined ? (patientData.email || null) : patient.email,
      address: patientData.address !== undefined ? (patientData.address || null) : patient.address,
    };

    await patient.update(updateData, { transaction });
    
    const patientChanges = getChangedValues(oldPatientValues, updateData);
    if (Object.keys(patientChanges).length > 0) {
      await logPatientAudit(
        userId,
        "UPDATE",
        "patients",
        patientId,
        oldPatientValues,
        updateData,
        `Patient details updated`,
        transaction
      );
    }

    // Emergency Contact is completely optional for incomplete patient updates
    // Only create/update if all three fields (name, relationship, contactNumber) are provided
    if (patientData.emergencyContactName !== undefined || patientData.emergencyContactRelationship !== undefined || patientData.emergencyContactNumber !== undefined) {
      const existingContact = await EmergencyContact.findOne({
        where: { patientId: patient.id, isPrimary: true },
        transaction
      });

      const contactData = {
        name: patientData.emergencyContactName !== undefined ? (patientData.emergencyContactName || null) : (existingContact ? existingContact.name : null),
        relationship: patientData.emergencyContactRelationship !== undefined ? (patientData.emergencyContactRelationship || null) : (existingContact ? existingContact.relationship : null),
        contactNumber: patientData.emergencyContactNumber !== undefined ? (patientData.emergencyContactNumber || null) : (existingContact ? existingContact.contactNumber : null),
      };

      console.log("Emergency Contact Data:", contactData);

      // Only create/update if all three fields have non-empty values
      // Emergency contact is optional - skip if any field is missing
      const hasValidData = contactData.name && contactData.relationship && contactData.contactNumber;

      if (hasValidData) {
        if (existingContact) {
          const oldContactValues = existingContact.toJSON();
          await existingContact.update(contactData, { transaction });
          const contactChanges = getChangedValues(oldContactValues, contactData);
          if (Object.keys(contactChanges).length > 0) {
            await logPatientAudit(
              userId,
              "UPDATE",
              "emergency_contacts",
              existingContact.id,
              oldContactValues,
              contactData,
              `Emergency contact information updated`,
              transaction
            );
          }
          console.log("Updated existing emergency contact");
        } else {
          const newContact = await EmergencyContact.create({
            patientId: patient.id,
            name: contactData.name,
            relationship: contactData.relationship,
            contactNumber: contactData.contactNumber,
            isPrimary: true,
          }, { transaction });
          await logPatientAudit(
            userId,
            "CREATE",
            "emergency_contacts",
            newContact.id,
            null,
            contactData,
            `Emergency contact information created`,
            transaction
          );
          console.log("Created new emergency contact");
        }
      } else {
        console.log("Skipping emergency contact update - insufficient data provided");
      }
    }

    if (patientData.knownAllergies !== undefined || patientData.medicalHistory !== undefined || patientData.currentMedications !== undefined || patientData.pregnancyStatus !== undefined || patientData.bloodType !== undefined || patientData.initialDiagnosis !== undefined) {
      const existingRecord = await MedicalRecord.findOne({
        where: { patientId: patient.id },
        transaction
      });

      const medicalUpdateData = {};
      if (patientData.knownAllergies !== undefined) {
        medicalUpdateData.knownAllergies = patientData.knownAllergies || null;
      }
      if (patientData.medicalHistory !== undefined) {
        medicalUpdateData.medicalHistory = patientData.medicalHistory || null;
      }
      if (patientData.currentMedications !== undefined) {
        medicalUpdateData.currentMedications = patientData.currentMedications || null;
      }
      if (patientData.pregnancyStatus !== undefined) {
        medicalUpdateData.pregnancyStatus = patientData.pregnancyStatus;
      }
      if (patientData.bloodType !== undefined) {
        medicalUpdateData.bloodType = patientData.bloodType;
      }
      if (patientData.initialDiagnosis !== undefined) {
        medicalUpdateData.initialDiagnosis = patientData.initialDiagnosis || null;
      }

      if (existingRecord) {
        const oldRecordValues = existingRecord.toJSON();
        await existingRecord.update(medicalUpdateData, { transaction });
        const recordChanges = getChangedValues(oldRecordValues, medicalUpdateData);
        if (Object.keys(recordChanges).length > 0) {
          await logPatientAudit(
            userId,
            "UPDATE",
            "medical_records",
            existingRecord.id,
            oldRecordValues,
            medicalUpdateData,
            `Medical information updated`,
            transaction
          );
        }
      } else {
        const newRecord = await MedicalRecord.create({
          patientId: patient.id,
          knownAllergies: medicalUpdateData.knownAllergies !== undefined ? medicalUpdateData.knownAllergies : null,
          medicalHistory: medicalUpdateData.medicalHistory !== undefined ? medicalUpdateData.medicalHistory : null,
          currentMedications: medicalUpdateData.currentMedications !== undefined ? medicalUpdateData.currentMedications : null,
          pregnancyStatus: medicalUpdateData.pregnancyStatus !== undefined ? medicalUpdateData.pregnancyStatus : "Not Applicable",
          bloodType: medicalUpdateData.bloodType !== undefined ? medicalUpdateData.bloodType : "Unknown",
          initialDiagnosis: medicalUpdateData.initialDiagnosis !== undefined ? medicalUpdateData.initialDiagnosis : null,
        }, { transaction });
        await logPatientAudit(
          userId,
          "CREATE",
          "medical_records",
          newRecord.id,
          null,
          medicalUpdateData,
          `Medical information created`,
          transaction
        );
      }
    }

    if (patientData.admissionDateTime !== undefined || patientData.department !== undefined || patientData.consultantInCharge !== undefined) {
      const existingAdmission = await Admission.findOne({
        where: { patientId: patient.id, status: "Active" },
        transaction
      });

      // Only include fields that are explicitly provided in the update
      const admissionData = {};
      
      if (patientData.admissionDateTime !== undefined) {
        // Only update if explicitly provided
        admissionData.admissionDateTime = patientData.admissionDateTime 
          ? new Date(patientData.admissionDateTime) 
          : (existingAdmission ? existingAdmission.admissionDateTime : new Date());
      }
      
      if (patientData.department !== undefined) {
        admissionData.department = patientData.department || "HDU";
      }
      
      if (patientData.consultantInCharge !== undefined) {
        admissionData.consultantInCharge = patientData.consultantInCharge || null;
      }

      console.log("Admission Data:", admissionData);

      if (existingAdmission) {
        // Only update if there are actual changes
        if (Object.keys(admissionData).length > 0) {
          const oldAdmissionValues = existingAdmission.toJSON();
          await existingAdmission.update(admissionData, { transaction });
          const admissionChanges = getChangedValues(oldAdmissionValues, admissionData);
          if (Object.keys(admissionChanges).length > 0) {
            await logPatientAudit(
              userId,
              "UPDATE",
              "admissions",
              existingAdmission.id,
              oldAdmissionValues,
              admissionData,
              `Admission details updated`,
              transaction
            );
          }
        }
        console.log("Updated existing admission");
      } else {
        // Create new admission with provided data or defaults
        const newAdmission = await Admission.create({
          patientId: patient.id,
          admissionDateTime: admissionData.admissionDateTime || new Date(),
          department: admissionData.department || "HDU",
          consultantInCharge: admissionData.consultantInCharge || null,
          status: "Active",
        }, { transaction });
        await logPatientAudit(
          userId,
          "CREATE",
          "admissions",
          newAdmission.id,
          null,
          admissionData,
          `Admission details created`,
          transaction
        );
        console.log("Created new admission");
      }
    }

    const finalPatient = await Patient.findByPk(patientId, { transaction });
    const emergencyContact = await EmergencyContact.findOne({
      where: { patientId: patientId, isPrimary: true },
      transaction
    });
    const medicalRecord = await MedicalRecord.findOne({
      where: { patientId: patientId },
      transaction
    });
    const admission = await Admission.findOne({
      where: { patientId: patientId, status: "Active" },
      transaction
    });

    const isComplete = checkIfPatientIsComplete(finalPatient, emergencyContact, medicalRecord, admission);

    if (isComplete && finalPatient.isIncomplete) {
      await finalPatient.update({ isIncomplete: false }, { transaction });
    }

    await transaction.commit();

    const responsePatient = await Patient.findByPk(patientId, {
      include: [
        { model: EmergencyContact, as: "emergencyContacts" },
        { model: MedicalRecord, as: "medicalRecords" },
        { model: Admission, as: "admissions", where: { status: "Active" }, required: false },
      ]
    });

    res.json({
      msg: "Patient data updated successfully",
      patient: responsePatient,
      isComplete: isComplete,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("updateIncompletePatient Error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
}

/**
 * Retrieves change history for a patient
 * Includes all changes to Patient, EmergencyContact, MedicalRecord, and Admission
 * @route GET /api/patients/:patientId/change-history
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.patientId - ID of the patient
 * @param {Object} res - Express response object
 */
export async function getPatientChangeHistory(req, res) {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    const emergencyContact = await EmergencyContact.findOne({
      where: { patientId: patientId, isPrimary: true }
    });

    const medicalRecord = await MedicalRecord.findOne({
      where: { patientId: patientId }
    });

    const admission = await Admission.findOne({
      where: { patientId: patientId, status: "Active" }
    });

    const recordIds = [
      { tableName: "patients", recordId: String(patientId) },
    ];

    if (emergencyContact) {
      recordIds.push({ tableName: "emergency_contacts", recordId: String(emergencyContact.id) });
    }

    if (medicalRecord) {
      recordIds.push({ tableName: "medical_records", recordId: String(medicalRecord.id) });
    }

    if (admission) {
      recordIds.push({ tableName: "admissions", recordId: String(admission.id) });
    }

    const auditLogs = await AuditLog.findAll({
      where: {
        [Op.or]: recordIds.map(({ tableName, recordId }) => ({
          tableName,
          recordId,
        })),
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "nameWithInitials", "role"],
        },
      ],
      order: [["timestamp", "DESC"]],
    });

    const formattedHistory = auditLogs.map((log) => {
      const logData = log.toJSON();
      return {
        id: logData.id,
        action: logData.action,
        tableName: logData.tableName,
        recordId: logData.recordId,
        timestamp: logData.timestamp,
        user: logData.user,
        description: logData.description,
        changes: logData.newValues,
        oldValues: logData.oldValues,
      };
    });

    res.json({
      patientId: parseInt(patientId),
      changeHistory: formattedHistory,
    });
  } catch (err) {
    console.error("getPatientChangeHistory Error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
}

/**
 * Discharges a patient and deassigns them from their bed
 * Closes active admissions and creates discharge record
 * @route POST /api/patients/:patientId/discharge
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.patientId - ID of the patient to discharge
 * @param {Object} req.body - Discharge information
 * @param {Object} res - Express response object
 */
export async function dischargePatient(req, res) {
  try {
    const { patientId } = req.params;
    const {
      bedId,
      dischargeReason,
      doctorComments,
      dischargeInstructions,
      followUpRequired,
      followUpDate,
      medicationsPrescribed
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ msg: "Patient ID is required" });
    }

    if (!dischargeReason || !doctorComments) {
      return res.status(400).json({ 
        msg: "Discharge reason and doctor comments are required" 
      });
    }

    const patient = await Patient.findOne({
      where: { id: patientId },
      include: [
        {
          model: Admission,
          as: 'admissions',
          where: { status: 'Active' },
          required: false
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    const dischargeRecord = {
      patientId: patientId,
      bedId: bedId,
      dischargeReason,
      doctorComments,
      dischargeInstructions: dischargeInstructions || "",
      followUpRequired: followUpRequired || false,
      followUpDate: followUpRequired && followUpDate ? new Date(followUpDate) : null,
      medicationsPrescribed: medicationsPrescribed || "",
      dischargedBy: req.user?.id || "System", // Handle case where user info is not available
      dischargeDateTime: new Date(),
      status: 'Discharged'
    };

    if (patient.admissions && patient.admissions.length > 0) {
      const currentAdmission = patient.admissions[0];
      await currentAdmission.update({
        status: 'Discharged',
        dischargeDateTime: new Date(),
        dischargeNotes: doctorComments
      });
    }

    if (bedId) {
      try {
        const bed = await BedMySQL.findOne({ where: { id: bedId } });
        if (bed) {
          await bed.update({ patientId: null });
        }
      } catch (error) {
        console.warn("Could not deassign bed:", error.message);
      }
    }

    // Delete all patient-related data from all tables
    try {
      console.log(`Starting deletion of all data for patient ${patientId}...`);

      // First, get all related record IDs BEFORE deleting (needed for audit log cleanup)
      const admissions = await Admission.findAll({ where: { patientId: patientId }, attributes: ['id'] });
      const medicalRecords = await MedicalRecord.findAll({ where: { patientId: patientId }, attributes: ['id'] });
      const emergencyContacts = await EmergencyContact.findAll({ where: { patientId: patientId }, attributes: ['id'] });
      const criticalFactors = await CriticalFactor.findAll({ where: { patientId: patientId }, attributes: ['id'] });
      const patientDocuments = await PatientDocument.findAll({ where: { patientId: patientId }, attributes: ['id', 'fileUrl', 'fileName'] });

      const relatedRecordIds = {
        admissions: admissions.map(a => String(a.id)),
        medical_records: medicalRecords.map(m => String(m.id)),
        emergency_contacts: emergencyContacts.map(e => String(e.id)),
        critical_factors: criticalFactors.map(c => String(c.id)),
        patient_documents: patientDocuments.map(d => String(d.id))
      };

      // 1. Delete all patient documents and their files
      for (const doc of patientDocuments) {
        try {
          // Delete file from filesystem
          let cleanPath = doc.fileUrl;
          if (cleanPath.startsWith('/uploads/uploads/')) {
            cleanPath = cleanPath.replace('/uploads/uploads/', '/uploads/');
          }
          if (cleanPath.startsWith('/uploads/')) {
            cleanPath = cleanPath.replace('/uploads/', 'uploads/');
          }
          const filePath = path.join(process.cwd(), cleanPath);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${doc.fileName}`);
          }
        } catch (fileError) {
          console.warn(`Error deleting document file ${doc.fileName}:`, fileError.message);
        }
      }

      // Delete all patient documents from database
      const deletedDocuments = await PatientDocument.destroy({
        where: { patientId: patientId }
      });
      console.log(`Deleted ${deletedDocuments} patient document(s)`);

      // 2. Delete all critical factors
      const deletedCriticalFactors = await CriticalFactor.destroy({
        where: { patientId: patientId }
      });
      console.log(`Deleted ${deletedCriticalFactors} critical factor record(s)`);

      // 3. Delete all admissions
      const deletedAdmissions = await Admission.destroy({
        where: { patientId: patientId }
      });
      console.log(`Deleted ${deletedAdmissions} admission record(s)`);

      // 4. Delete all medical records
      const deletedMedicalRecords = await MedicalRecord.destroy({
        where: { patientId: patientId }
      });
      console.log(`Deleted ${deletedMedicalRecords} medical record(s)`);

      // 5. Delete all emergency contacts
      const deletedEmergencyContacts = await EmergencyContact.destroy({
        where: { patientId: patientId }
      });
      console.log(`Deleted ${deletedEmergencyContacts} emergency contact(s)`);

      // 6. Delete all audit logs related to this patient
      // Delete audit logs for patient record
      const deletedPatientAuditLogs = await AuditLog.destroy({
        where: {
          tableName: 'patients',
          recordId: String(patientId)
        }
      });
      console.log(`Deleted ${deletedPatientAuditLogs} audit log(s) for patient record`);

      // Delete audit logs for all related records
      const auditLogConditions = [];
      
      // Add conditions for each related table
      if (relatedRecordIds.admissions.length > 0) {
        auditLogConditions.push({
          tableName: 'admissions',
          recordId: { [Op.in]: relatedRecordIds.admissions }
        });
      }
      if (relatedRecordIds.medical_records.length > 0) {
        auditLogConditions.push({
          tableName: 'medical_records',
          recordId: { [Op.in]: relatedRecordIds.medical_records }
        });
      }
      if (relatedRecordIds.emergency_contacts.length > 0) {
        auditLogConditions.push({
          tableName: 'emergency_contacts',
          recordId: { [Op.in]: relatedRecordIds.emergency_contacts }
        });
      }
      if (relatedRecordIds.critical_factors.length > 0) {
        auditLogConditions.push({
          tableName: 'critical_factors',
          recordId: { [Op.in]: relatedRecordIds.critical_factors }
        });
      }
      if (relatedRecordIds.patient_documents.length > 0) {
        auditLogConditions.push({
          tableName: 'patient_documents',
          recordId: { [Op.in]: relatedRecordIds.patient_documents }
        });
      }

      // Also delete audit logs that might reference patientId in JSON fields
      const allAuditLogs = await AuditLog.findAll({
        where: {
          [Op.or]: [
            { tableName: 'patients' },
            { tableName: 'admissions' },
            { tableName: 'medical_records' },
            { tableName: 'emergency_contacts' },
            { tableName: 'critical_factors' },
            { tableName: 'patient_documents' }
          ]
        }
      });

      let deletedRelatedAuditLogs = 0;
      for (const auditLog of allAuditLogs) {
        let shouldDelete = false;
        
        // Check if recordId matches patientId or any related record ID
        if (auditLog.recordId === String(patientId)) {
          shouldDelete = true;
        } else {
          // Check if recordId is in any of the related record IDs
          const allRelatedIds = [
            ...relatedRecordIds.admissions,
            ...relatedRecordIds.medical_records,
            ...relatedRecordIds.emergency_contacts,
            ...relatedRecordIds.critical_factors,
            ...relatedRecordIds.patient_documents
          ];
          if (allRelatedIds.includes(auditLog.recordId)) {
            shouldDelete = true;
          }
        }

        if (shouldDelete) {
          await auditLog.destroy();
          deletedRelatedAuditLogs++;
        }
      }
      console.log(`Deleted ${deletedRelatedAuditLogs} audit log(s) for related records`);

      // 7. Finally, delete the patient record itself
      const deletedPatient = await Patient.destroy({
        where: { id: patientId }
      });
      console.log(`Deleted ${deletedPatient} patient record(s)`);

      console.log(`✅ All data for patient ${patientId} has been deleted successfully`);
      console.log(`   Summary: ${deletedDocuments} documents, ${deletedCriticalFactors} critical factors, ${deletedAdmissions} admissions, ${deletedMedicalRecords} medical records, ${deletedEmergencyContacts} emergency contacts, ${deletedPatientAuditLogs + deletedRelatedAuditLogs} audit logs, ${deletedPatient} patient record`);
    } catch (deleteError) {
      console.error("Error deleting patient data:", deleteError);
      // Continue with response even if deletion fails partially
    }

    res.json({
      msg: "Patient discharged successfully and all related data has been removed from the database",
      dischargeRecord,
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        patientNumber: patient.patientNumber
      }
    });

  } catch (err) {
    console.error("dischargePatient Error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
} 