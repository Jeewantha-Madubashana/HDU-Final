import {
  CriticalFactor,
  Patient,
  UserMySQLModel as User,
  AuditLog,
  sequelize,
  BedMySQL,
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
      const newFactor = await CriticalFactor.create(
        {
          ...factorData,
          patientId,
          recordedBy: userId,
          recordedAt: new Date(),
        },
        { transaction: t }
      );

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

      createdFactors.push(createdFactor);
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
    res.json(factors);
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

    updatedData.isAmended = true;
    updatedData.amendedBy = userId;
    updatedData.amendedAt = new Date();
    updatedData.amendmentReason = amendmentReason;

    await factor.update(updatedData, { transaction: t });

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
    res.json(factor);
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

export async function getCriticalPatients(req, res) {
  try {
    const criticalFactors = await CriticalFactor.findAll({
      where: {
        // Define critical thresholds
        [Op.or]: [
          { heartRate: { [Op.gt]: 120 } },
          { heartRate: { [Op.lt]: 60 } },
          { respiratoryRate: { [Op.gt]: 25 } },
          { respiratoryRate: { [Op.lt]: 12 } },
          { bloodPressureSystolic: { [Op.gt]: 140 } },
          { bloodPressureSystolic: { [Op.lt]: 90 } },
          { bloodPressureDiastolic: { [Op.gt]: 90 } },
          { bloodPressureDiastolic: { [Op.lt]: 60 } },
          { spO2: { [Op.lt]: 95 } },
          { temperature: { [Op.gt]: 38.5 } },
          { temperature: { [Op.lt]: 35.5 } },
          { glasgowComaScale: { [Op.lt]: 13 } },
          { painScale: { [Op.gt]: 7 } },
          { bloodGlucose: { [Op.gt]: 200 } },
          { bloodGlucose: { [Op.lt]: 70 } },
        ],
      },
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "patientNumber", "fullName", "gender", "contactNumber"],
        },
      ],
      order: [["recordedAt", "DESC"]],
    });

    // Group by patient and get the latest critical factors
    const criticalPatients = [];
    const patientMap = new Map();

    criticalFactors.forEach((factor) => {
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
      patient.criticalFactors.push({
        id: factor.id,
        recordedAt: factor.recordedAt,
        heartRate: factor.heartRate,
        respiratoryRate: factor.respiratoryRate,
        bloodPressureSystolic: factor.bloodPressureSystolic,
        bloodPressureDiastolic: factor.bloodPressureDiastolic,
        spO2: factor.spO2,
        temperature: factor.temperature,
        glasgowComaScale: factor.glasgowComaScale,
        painScale: factor.painScale,
        bloodGlucose: factor.bloodGlucose,
        urineOutput: factor.urineOutput,
      });
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
