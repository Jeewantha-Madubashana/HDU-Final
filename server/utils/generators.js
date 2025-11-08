import { Patient } from "../config/mysqlDB.js";
import { Op } from "sequelize";

export const generatePatientNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `PT-${currentYear}-`;
  const latestPatient = await Patient.findOne({
    where: {
      patientNumber: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [["patientNumber", "DESC"]],
  });

  let nextNumber = 1;

  if (latestPatient) {
    const latestNumber = latestPatient.patientNumber.split("-")[2];
    nextNumber = parseInt(latestNumber, 10) + 1;
  }
  const paddedNumber = nextNumber.toString().padStart(4, "0");
  return `${prefix}${paddedNumber}`;
};

/**
 * Generates a unique urgent patient name
 * Format: "Urgent Admitted Patient #1", "Urgent Admitted Patient #2", etc.
 * @returns {Promise<string>} Unique urgent patient name
 */
export const generateUrgentPatientName = async () => {
  const prefix = "Urgent Admitted Patient #";
  
  const latestUrgentPatient = await Patient.findOne({
    where: {
      fullName: {
        [Op.like]: `${prefix}%`,
      },
      isUrgentAdmission: true,
    },
    order: [["createdAt", "DESC"]],
  });

  let nextNumber = 1;

  if (latestUrgentPatient) {
    const latestNumberStr = latestUrgentPatient.fullName.replace(prefix, "");
    const latestNumber = parseInt(latestNumberStr, 10);
    if (!isNaN(latestNumber)) {
      nextNumber = latestNumber + 1;
    }
  }

  return `${prefix}${nextNumber}`;
};
