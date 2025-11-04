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
