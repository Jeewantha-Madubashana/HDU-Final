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

// Get standard fields dynamically from CriticalFactor model attributes
// These are the actual database columns (excluding metadata fields)
const getStandardFields = () => {
  // Metadata fields that are not vital signs
  const metadataFields = ['id', 'patientId', 'recordedAt', 'recordedBy', 'isAmended', 
    'amendedBy', 'amendedAt', 'amendmentReason', 'dynamicVitals', 'createdAt', 'updatedAt'];
  
  // Get all attributes from the CriticalFactor model
  const modelAttributes = Object.keys(CriticalFactor.rawAttributes || {});
  
  // Return only vital sign fields (exclude metadata)
  return modelAttributes.filter(attr => !metadataFields.includes(attr));
};

// Helper function to separate standard fields from dynamic fields
const separateFields = (data) => {
  const standardData = {};
  const dynamicData = {};
  const standardFields = getStandardFields();
  const metadataFields = ['id', 'patientId', 'recordedAt', 'recordedBy', 'isAmended', 
    'amendedBy', 'amendedAt', 'amendmentReason', 'dynamicVitals', 'createdAt', 'updatedAt'];
  
  for (const key in data) {
    // If it's a metadata field or a standard vital sign field, store in standardData
    if (metadataFields.includes(key) || standardFields.includes(key)) {
      standardData[key] = data[key];
    } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
      // Store non-standard fields in dynamicVitals
      dynamicData[key] = data[key];
    }
  }
  
  return { standardData, dynamicData };
};

// Helper function to merge dynamic vitals back into the response
const mergeDynamicVitals = (factor) => {
  const factorJson = factor.toJSON ? factor.toJSON() : factor;
  const dynamicVitals = factorJson.dynamicVitals || {};
  
  // Merge dynamic vitals into the main object
  return {
    ...factorJson,
    ...dynamicVitals
  };
};

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
      // Separate standard fields from dynamic fields
      const { standardData, dynamicData } = separateFields(factorData);
      
      // Prepare data for creation
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

      // Merge dynamic vitals back into response
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
    
    // Merge dynamic vitals into each factor
    const factorsWithDynamicVitals = factors.map(factor => mergeDynamicVitals(factor));
    res.json(factorsWithDynamicVitals);
  } catch (error) {
    console.error("Error fetching critical factors:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateCriticalFactors = async (req, res) => {
  console.log(
    "[DEBUG] updateCriticalFactors called for id:",
    req.params.criticalFactorId
  );
  const t = await sequelize.transaction();
  try {
    const { criticalFactorId } = req.params;
    console.log(
      "[DEBUG] Looking for CriticalFactor with id:",
      criticalFactorId
    );

    let factor = await CriticalFactor.findByPk(criticalFactorId, {
      transaction: t,
    });
    console.log("[DEBUG] factor found with transaction:", factor);

    if (!factor) {
      factor = await CriticalFactor.findByPk(criticalFactorId);
      console.log("[DEBUG] factor found without transaction:", factor);
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

    // Separate standard fields from dynamic fields
    const { standardData, dynamicData } = separateFields(updatedData);
    
    // Prepare update data
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
    // Merge dynamic vitals back into response
    res.json(mergeDynamicVitals(factor));
  } catch (error) {
    await t.rollback();
    console.error("Error updating critical factors:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

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

// Helper function to check if a value is outside normal range
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

export async function getCriticalPatients(req, res) {
  try {
    // Fetch active vital signs configuration to get dynamic normal ranges
    const vitalSignsConfigs = await VitalSignsConfig.findAll({
      where: { isActive: true },
      order: [["displayOrder", "ASC"]],
    });

    // Build dynamic query conditions based on vital signs config
    // Get valid database column fields dynamically from the model
    const validCriticalFactorFields = getStandardFields();
    
    const criticalConditions = [];
    const dynamicFieldConfigs = new Map(); // Store configs for dynamic fields
    
    for (const config of vitalSignsConfigs) {
      const fieldName = config.name;
      
      // Check if field exists as a database column (can be queried directly)
      if (validCriticalFactorFields.includes(fieldName)) {
        // Standard field - add to query conditions
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
        // Dynamic field (stored in JSON) - store config for post-query filtering
        dynamicFieldConfigs.set(fieldName, config);
      }
    }

    // No hardcoded fallback - all vital signs are managed dynamically by super admin
    // If no config exists, return empty array (no critical patients)

    // Fetch all recent critical factors (for standard fields)
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
    
    // Also fetch recent factors that might have critical dynamic vitals
    // We'll check all recent factors (last 24 hours) for dynamic field critical values
    if (dynamicFieldConfigs.size > 0) {
      const recentFactors = await CriticalFactor.findAll({
        where: {
          recordedAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
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
      
      // Check dynamic vitals for critical values
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
          // Add to critical factors if not already included
          const alreadyIncluded = criticalFactors.some(cf => cf.id === factor.id);
          if (!alreadyIncluded) {
            criticalFactors.push(factor);
          }
        }
      }
    }

    // Group by patient and get the latest critical factors
    const criticalPatients = [];
    const patientMap = new Map();

    criticalFactors.forEach((factor) => {
      // Merge dynamic vitals into the factor object
      const factorWithDynamic = mergeDynamicVitals(factor);
      const patientId = factor.patientId;
      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          patientId: factor.patient.id,
          patientNumber: factor.patient.patientNumber,
          patientName: factor.patient.fullName,
          bedNumber: "N/A", // We'll get bed info separately if needed
          criticalFactors: [],
        });
      }

      const patient = patientMap.get(patientId);
      // Include all vital signs including dynamic ones
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
      
      // Add dynamic vitals (all fields that are not standard)
      const dynamicVitals = factor.dynamicVitals || {};
      for (const key in dynamicVitals) {
        if (dynamicVitals[key] !== null && dynamicVitals[key] !== undefined && dynamicVitals[key] !== '') {
          criticalFactorData[key] = dynamicVitals[key];
        }
      }
      
      patient.criticalFactors.push(criticalFactorData);
    });

    // Convert map to array
    const criticalPatientsArray = [];
    patientMap.forEach((patient) => {
      criticalPatientsArray.push(patient);
    });

    // Fetch bed information for each critical patient
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

export async function acknowledgeAlert(req, res) {
  const t = await sequelize.transaction();
  try {
    // Check if req.body exists
    if (!req.body) {
      await t.rollback();
      return res.status(400).json({
        message: "Failed to acknowledge alert",
        error: "Request body is missing"
      });
    }

    const { alertId, alertType, patientId, bedNumber, acknowledgedBy } = req.body;
    const userId = req.user.id;

    // Validate required fields
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

    // Create audit message based on alert type
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

    // Log the acknowledgment
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
