import { BedMySQL, PatientMySQL } from "../config/mysqlDB.js";

class BedRepository {
  async getAllBeds() {
    return await BedMySQL.findAll({ include: PatientMySQL });
  }

  async assignBed(bedId, patientData) {
    const bed = await BedMySQL.findOne({ where: { id: bedId } });

    if (!bed) {
      throw new Error("Bed not found");
    }

    if (bed.patientId !== null) {
      throw new Error("Bed is already occupied");
    }

    const patient = await PatientMySQL.create(patientData);

    await BedMySQL.update({ patientId: patient.id }, { where: { id: bedId } });

    return {
      message: "Bed successfully assigned to patient",
      patientId: patient.id,
    };
  }

  async deAssignBed(bedId) {
    const bed = await BedMySQL.findOne({ where: { id: bedId } });

    if (!bed) {
      throw new Error("Bed not found");
    }

    if (bed.patientId === null) {
      throw new Error("Bed is already unoccupied");
    }

    await BedMySQL.update({ patientId: null }, { where: { id: bedId } });

    return { message: "Bed successfully deassigned" };
  }
}

export default new BedRepository();
