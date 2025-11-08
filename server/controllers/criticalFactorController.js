import {
  CriticalFactor,
  Patient,
  UserMySQLModel as User,
  AuditLog,
  sequelize,
  BedMySQL,
  VitalSignsConfig,
} from "../config/mysqlDB.js";
import { Op } from "sequelize";

/**
 * Compares old and new values to identify changes for audit logging
 * @param {Object|null} oldValues - Previous state of the record
 * @param {Object} newValues - Current state of the record
 * @returns {Object} Object containing only the changed fields with old/new values
 */
const getChangedValues = (oldValues, newValues) => {
  const changes = {};
  for (const key in newValues) {
    if (!oldValues || oldValues[key] !== newValues[key]) {
      changes[key] = {
        old: oldValues ? oldValues[key] : null,
        new: newValues[key],
      };
    }
  }
  return changes;
};

/**
 * Creates an audit log entry for database operations
 * @param {number} userId - ID of the user performing the action
 * @param {string} action - Action type (CREATE, UPDATE, ACKNOWLEDGE)
 * @param {string} tableName - Name of the table being modified
 * @param {number} recordId - ID of the record being modified
 * @param {Object|null} oldValues - Previous state (null for CREATE/ACKNOWLEDGE)
 * @param {Object} newValues - New state or initial values
 * @param {string} description - Human-readable description of the action
 * @param {Object} transaction - Sequelize transaction object
 * @throws {Error} If audit log creation fails
 */
const logAudit = async (
  userId,
  action,
  tableName,
  recordId,
  oldValues,
  newValues,
  description,
  transaction
) => {
  try {
    const changes =
      action === "CREATE" || action === "ACKNOWLEDGE"
        ? { initialValues: newValues }
        : getChangedValues(oldValues, newValues);

    await AuditLog.create(
      {
        userId,
        action,
        tableName,
        recordId,
        oldValues: (action === "CREATE" || action === "ACKNOWLEDGE") ? null : oldValues,
        newValues: (action === "CREATE" || action === "ACKNOWLEDGE") ? newValues : changes,
        description,
        timestamp: new Date(),
      },
      { transaction }
    );
  } catch (error) {
    console.error("Audit log failed:", error);
    throw error;
  }
};

/**
 * Dynamically retrieves standard vital sign fields from the CriticalFactor model
 * Excludes metadata fields to return only actual vital sign database columns
 * @returns {string[]} Array of field names that are standard vital sign columns
 */
const getStandardFields = () => {
  const metadataFields = ['id', 'patientId', 'recordedAt', 'recordedBy', 'isAmended', 
    'amendedBy', 'amendedAt', 'amendmentReason', 'dynamicVitals', 'createdAt', 'updatedAt'];
  const modelAttributes = Object.keys(CriticalFactor.rawAttributes || {});
  return modelAttributes.filter(attr => !metadataFields.includes(attr));
};

/**
 * Separates standard database fields from dynamic vital signs
 * Standard fields are stored as columns, dynamic fields go into JSON column
 * @param {Object} data - Input data containing both standard and dynamic fields
 * @returns {Object} Object with standardData and dynamicData properties
 */
const separateFields = (data) => {
  const standardData = {};
  const dynamicData = {};
  const standardFields = getStandardFields();
  const metadataFields = ['id', 'patientId', 'recordedAt', 'recordedBy', 'isAmended', 
    'amendedBy', 'amendedAt', 'amendmentReason', 'dynamicVitals', 'createdAt', 'updatedAt'];
  
  for (const key in data) {
    if (metadataFields.includes(key) || standardFields.includes(key)) {
      standardData[key] = data[key];
    } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
      dynamicData[key] = data[key];
    }
  }
  
  return { standardData, dynamicData };
};

/**
 * Merges dynamic vital signs from JSON column back into the main factor object
 * This allows dynamic fields to be accessed as if they were standard columns
 * @param {Object} factor - CriticalFactor instance or plain object
 * @returns {Object} Factor object with dynamic vitals merged in
 */
const mergeDynamicVitals = (factor) => {
  const factorJson = factor.toJSON ? factor.toJSON() : factor;
  const dynamicVitals = factorJson.dynamicVitals || {};
  
  return {
    ...factorJson,
    ...dynamicVitals
  };
};

/**
 * Creates new critical factor records for a patient
 * Supports both standard database columns and dynamic vital signs stored in JSON
 * @route POST /api/critical-factors/:patientId
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.patientId - ID of the patient
 * @param {Object|Array} req.body - Critical factor data (single object or array)
 * @param {Object} res - Express response object
 */
export const addCriticalFactors = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { patientId } = req.params;
    const criticalFactorsData = req.body;
    const userId = req.user.id;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      await t.rollback();
      return res.status(404).json({ message: "Patient not found" });
    }

    const createdFactors = [];

    const factorsToCreate = Array.isArray(criticalFactorsData)
      ? criticalFactorsData
      : [criticalFactorsData];

    for (const factorData of factorsToCreate) {
      const { standardData, dynamicData } = separateFields(factorData);
      
      const createData = {
        ...standardData,
        patientId,
        recordedBy: userId,
        recordedAt: new Date(),
        dynamicVitals: Object.keys(dynamicData).length > 0 ? dynamicData : null,
      };

      const newFactor = await CriticalFactor.create(createData, { transaction: t });

      const createdFactor = await CriticalFactor.findByPk(newFactor.id, {
        transaction: t,
      });

      await logAudit(
        userId,
        "CREATE",
        "CriticalFactors",
        newFactor.id,
        null,
        createdFactor.toJSON(),
        `Added critical factors for patient ID: ${patientId}`,
        t
      );

      createdFactors.push(mergeDynamicVitals(createdFactor));
    }

    await t.commit();
    res.status(201).json(createdFactors);
  } catch (error) {
    await t.rollback();
    console.error("Error adding critical factors:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Retrieves all critical factor records for a specific patient
 * Includes recorder information and merges dynamic vital signs
 * @route GET /api/critical-factors/patient/:patientId
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.patientId - ID of the patient
 * @param {Object} res - Express response object
 */
export const getCriticalFactorsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    const factors = await CriticalFactor.findAll({
      where: { patientId },
      include: [
        {
          model: User,
          as: "recorder",
          attributes: ["id", "username", "nameWithInitials"],
        },
      ],
      order: [["recordedAt", "DESC"]],
    });

    if (!factors) {
      return res
        .status(404)
        .json({ message: "No critical factors found for this patient" });
    }
    
    const factorsWithDynamicVitals = factors.map(factor => mergeDynamicVitals(factor));
    res.json(factorsWithDynamicVitals);
  } catch (error) {
    console.error("Error fetching critical factors:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Updates an existing critical factor record
 * Requires an amendment reason for audit trail compliance
 * Merges dynamic vital signs with existing dynamic data
 * @route PUT /api/critical-factors/:criticalFactorId
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.criticalFactorId - ID of the critical factor record
 * @param {Object} req.body - Updated critical factor data
 * @param {string} req.body.amendmentReason - Required reason for the amendment
 * @param {Object} res - Express response object
 */
export const updateCriticalFactors = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { criticalFactorId } = req.params;

    let factor = await CriticalFactor.findByPk(criticalFactorId, {
      transaction: t,
    });

    if (!factor) {
      factor = await CriticalFactor.findByPk(criticalFactorId);
    }
    const { amendmentReason, ...updatedData } = req.body;
    const userId = req.user.id;

    if (!amendmentReason) {
      await t.rollback();
      return res.status(400).json({
        message: "Amendment reason is required for updating critical factors",
      });
    }

    if (!factor) {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "Critical factor record not found" });
    }

    const oldValues = factor.toJSON();
    const { standardData, dynamicData } = separateFields(updatedData);
    
    const updateData = {
      ...standardData,
      isAmended: true,
      amendedBy: userId,
      amendedAt: new Date(),
      amendmentReason: amendmentReason,
      dynamicVitals: Object.keys(dynamicData).length > 0 
        ? { ...(factor.dynamicVitals || {}), ...dynamicData }
        : factor.dynamicVitals,
    };

    await factor.update(updateData, { transaction: t });

    const newValues = factor.toJSON();

    await logAudit(
      userId,
      "UPDATE",
      "CriticalFactors",
      criticalFactorId,
      oldValues,
      newValues,
      `Updated critical factors for patient ID: ${factor.patientId}, record ID: ${criticalFactorId}. Amendment reason: ${amendmentReason}`,
      t
    );

    await t.commit();
    res.json(mergeDynamicVitals(factor));
  } catch (error) {
    await t.rollback();
    console.error("Error updating critical factors:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Retrieves complete audit history for a critical factor record
 * Includes all changes, who made them, and when
 * @route GET /api/critical-factors/:criticalFactorId/audit
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.criticalFactorId - ID of the critical factor record
 * @param {Object} res - Express response object
 */
export const getCriticalFactorAuditHistory = async (req, res) => {
  try {
    const { criticalFactorId } = req.params;

    const factor = await CriticalFactor.findByPk(criticalFactorId, {
      include: [
        {
          model: User,
          as: "recorder",
          attributes: ["id", "username", "nameWithInitials", "role"],
        },
        {
          model: User,
          as: "amender",
          attributes: ["id", "username", "nameWithInitials", "role"],
          foreignKey: "amendedBy",
        },
      ],
    });

    if (!factor) {
      return res
        .status(404)
        .json({ message: "Critical factor record not found" });
    }

    const auditLogs = await AuditLog.findAll({
      where: {
        tableName: "CriticalFactors",
        recordId: criticalFactorId,
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

    const response = {
      currentRecord: {
        ...factor.toJSON(),
        recorder: factor.recorder,
        amender: factor.amender,
      },
      auditHistory: auditLogs.map((log) => {
        const formattedLog = {
          id: log.id,
          action: log.action,
          timestamp: log.timestamp,
          user: log.user,
          description: log.description,
        };

        if (log.action === "CREATE") {
          formattedLog.changes = {
            initialValues: log.newValues,
          };
        } else if (log.action === "UPDATE") {
          formattedLog.changes = log.newValues;
        }

        return formattedLog;
      }),
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching critical factor audit history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Determines if a vital sign value is outside the configured normal range
 * @param {string|number|null|undefined} value - The vital sign value to check
 * @param {Object} config - Vital sign configuration with normalRangeMin/Max
 * @returns {boolean} True if value is critical (outside normal range)
 */
const isValueCritical = (value, config) => {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    return false;
  }
  
  if (config.normalRangeMax !== null && numValue > config.normalRangeMax) {
    return true;
  }
  
  if (config.normalRangeMin !== null && numValue < config.normalRangeMin) {
    return true;
  }
  
  return false;
};

/**
 * Identifies patients with critical vital signs based on dynamic configuration
 * Checks both standard database columns and dynamic JSON fields
 * Returns patients grouped with their critical factors and bed assignments
 * @route GET /api/critical-factors/critical-patients
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getCriticalPatients(req, res) {
  try {
    const vitalSignsConfigs = await VitalSignsConfig.findAll({
      where: { isActive: true },
      order: [["displayOrder", "ASC"]],
    });

    const validCriticalFactorFields = getStandardFields();
    const criticalConditions = [];
    const dynamicFieldConfigs = new Map();
    
    for (const config of vitalSignsConfigs) {
      const fieldName = config.name;
      
      if (validCriticalFactorFields.includes(fieldName)) {
        if (config.normalRangeMin !== null || config.normalRangeMax !== null) {
          const fieldConditions = [];
          
          if (config.normalRangeMax !== null) {
            fieldConditions.push({
              [fieldName]: { [Op.gt]: config.normalRangeMax },
            });
          }
          
          if (config.normalRangeMin !== null) {
            fieldConditions.push({
              [fieldName]: { [Op.lt]: config.normalRangeMin },
            });
          }
          
          if (fieldConditions.length > 0) {
            criticalConditions.push(...fieldConditions);
          }
        }
      } else {
        dynamicFieldConfigs.set(fieldName, config);
      }
    }

    let criticalFactors = [];
    if (criticalConditions.length > 0) {
      criticalFactors = await CriticalFactor.findAll({
        where: {
          [Op.or]: criticalConditions,
        },
        include: [
          {
            model: Patient,
            as: "patient",
            attributes: ["id", "patientNumber", "fullName", "gender", "contactNumber"],
          },
          {
            model: User,
            as: "recorder",
            attributes: ["id", "username", "nameWithInitials"],
          },
        ],
        order: [["recordedAt", "DESC"]],
      });
    }
    
    if (dynamicFieldConfigs.size > 0) {
      const recentFactors = await CriticalFactor.findAll({
        where: {
          recordedAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        include: [
          {
            model: Patient,
            as: "patient",
            attributes: ["id", "patientNumber", "fullName", "gender", "contactNumber"],
          },
          {
            model: User,
            as: "recorder",
            attributes: ["id", "username", "nameWithInitials"],
          },
        ],
        order: [["recordedAt", "DESC"]],
      });
      
      for (const factor of recentFactors) {
        const factorWithDynamic = mergeDynamicVitals(factor);
        const dynamicVitals = factor.dynamicVitals || {};
        
        let hasCriticalDynamicValue = false;
        for (const [fieldName, config] of dynamicFieldConfigs.entries()) {
          const value = dynamicVitals[fieldName];
          if (isValueCritical(value, config)) {
            hasCriticalDynamicValue = true;
            break;
          }
        }
        
        if (hasCriticalDynamicValue) {
          const alreadyIncluded = criticalFactors.some(cf => cf.id === factor.id);
          if (!alreadyIncluded) {
            criticalFactors.push(factor);
          }
        }
      }
    }

    const criticalPatients = [];
    const patientMap = new Map();

    criticalFactors.forEach((factor) => {
      const factorWithDynamic = mergeDynamicVitals(factor);
      const patientId = factor.patientId;
      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          patientId: factor.patient.id,
          patientNumber: factor.patient.patientNumber,
          patientName: factor.patient.fullName,
          bedNumber: "N/A",
          criticalFactors: [],
        });
      }

      const patient = patientMap.get(patientId);
      const criticalFactorData = {
        id: factor.id,
        recordedAt: factor.recordedAt,
        heartRate: factorWithDynamic.heartRate,
        respiratoryRate: factorWithDynamic.respiratoryRate,
        bloodPressureSystolic: factorWithDynamic.bloodPressureSystolic,
        bloodPressureDiastolic: factorWithDynamic.bloodPressureDiastolic,
        spO2: factorWithDynamic.spO2,
        temperature: factorWithDynamic.temperature,
        glasgowComaScale: factorWithDynamic.glasgowComaScale,
        painScale: factorWithDynamic.painScale,
        bloodGlucose: factorWithDynamic.bloodGlucose,
        urineOutput: factorWithDynamic.urineOutput,
        recorder: factor.recorder ? {
          id: factor.recorder.id,
          username: factor.recorder.username,
          nameWithInitials: factor.recorder.nameWithInitials,
        } : null,
      };
      
      const dynamicVitals = factor.dynamicVitals || {};
      for (const key in dynamicVitals) {
        if (dynamicVitals[key] !== null && dynamicVitals[key] !== undefined && dynamicVitals[key] !== '') {
          criticalFactorData[key] = dynamicVitals[key];
        }
      }
      
      patient.criticalFactors.push(criticalFactorData);
    });

    const criticalPatientsArray = [];
    patientMap.forEach((patient) => {
      criticalPatientsArray.push(patient);
    });

    const criticalPatientsWithBeds = await Promise.all(
      criticalPatientsArray.map(async (patient) => {
        const bed = await BedMySQL.findOne({
          where: { patientId: patient.patientId },
        });
        
        return {
          ...patient,
          bedNumber: bed ? bed.bedNumber : "N/A",
        };
      })
    );

    res.json(criticalPatientsWithBeds);
  } catch (error) {
    console.error("Error fetching critical patients:", error);
    res.status(500).json({
      message: "Failed to fetch critical patients",
      error: error.message,
    });
  }
}

/**
 * Acknowledges a critical alert and logs the acknowledgment in audit trail
 * @route POST /api/critical-factors/acknowledge-alert
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.body - Alert acknowledgment data
 * @param {string} req.body.alertId - ID of the alert being acknowledged
 * @param {string} req.body.alertType - Type of alert (critical_patient, high_occupancy, etc.)
 * @param {number} [req.body.patientId] - Optional patient ID if alert is patient-specific
 * @param {string} [req.body.bedNumber] - Optional bed number if alert is bed-specific
 * @param {Object} res - Express response object
 */
export async function acknowledgeAlert(req, res) {
  const t = await sequelize.transaction();
  try {
    if (!req.body) {
      await t.rollback();
      return res.status(400).json({
        message: "Failed to acknowledge alert",
        error: "Request body is missing"
      });
    }

    const { alertId, alertType, patientId, bedNumber, acknowledgedBy } = req.body;
    const userId = req.user.id;

    if (!alertId) {
      await t.rollback();
      return res.status(400).json({
        message: "Failed to acknowledge alert",
        error: "alertId is required"
      });
    }

    if (!alertType) {
      await t.rollback();
      return res.status(400).json({
        message: "Failed to acknowledge alert",
        error: "alertType is required"
      });
    }

    let auditMessage = `Alert acknowledged: ${alertType}`;
    if (patientId && bedNumber) {
      auditMessage += ` for patient ${patientId} in bed ${bedNumber}`;
    } else if (alertType === 'high_occupancy') {
      auditMessage += ` - High bed occupancy alert`;
    } else if (alertType === 'low_availability') {
      auditMessage += ` - Low bed availability alert`;
    } else {
      auditMessage += ` - System alert`;
    }

    await logAudit(
      userId,
      "ACKNOWLEDGE",
      "Alerts",
      alertId,
      null,
      {
        alertId,
        alertType,
        patientId: patientId || null,
        bedNumber: bedNumber || null,
        acknowledgedBy: acknowledgedBy || 'Unknown',
        acknowledgedAt: new Date().toISOString(),
      },
      auditMessage,
      t
    );

    await t.commit();
    res.json({ 
      message: "Alert acknowledged successfully",
      acknowledgedAt: new Date().toISOString(),
      alertId: alertId
    });
  } catch (error) {
    await t.rollback();
    console.error("Error acknowledging alert:", error);
    res.status(500).json({
      message: "Failed to acknowledge alert",
      error: error.message,
    });
  }
}
