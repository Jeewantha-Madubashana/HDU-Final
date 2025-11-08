import {
  Patient,
  EmergencyContact,
  MedicalRecord,
  Admission,
  PatientDocument,
  sequelize,
} from "../config/mysqlDB.js";
import { generatePatientNumber, generateUrgentPatientName } from "../utils/generators.js";

class PatientRepository {
  async createPatient(patientData) {
    const transaction = await sequelize.transaction();

    try {
      const patientNumber = await generatePatientNumber();
      const {
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
      } = patientData;

      // Normalize dateOfBirth - convert empty strings or invalid dates to null
      let normalizedDateOfBirth = null;
      if (dateOfBirth) {
        const date = new Date(dateOfBirth);
        if (!isNaN(date.getTime())) {
          normalizedDateOfBirth = date;
        }
      }

      // Normalize age - convert empty strings to null
      const normalizedAge = age && age !== '' ? (typeof age === 'string' ? parseInt(age) : age) : null;

      // For normal admission, fullName and gender are required
      if (!fullName || !gender) {
        throw new Error("Full name and gender are required for normal admission");
      }

      const patient = await Patient.create(
        {
          patientNumber,
          fullName,
          nicPassport: nicPassport || null,
          dateOfBirth: normalizedDateOfBirth,
          age: normalizedAge,
          gender,
          maritalStatus: maritalStatus || "Unknown",
          contactNumber: contactNumber || null,
          email: email || null,
          address: address || null,
        },
        { transaction }
      );

      if (emergencyContactName && emergencyContactNumber) {
        await EmergencyContact.create(
          {
            patientId: patient.id,
            name: emergencyContactName,
            relationship: emergencyContactRelationship,
            contactNumber: emergencyContactNumber,
            isPrimary: true,
          },
          { transaction }
        );
      }

      await MedicalRecord.create(
        {
          patientId: patient.id,
          knownAllergies: knownAllergies || null,
          medicalHistory: medicalHistory || null,
          currentMedications: currentMedications || null,
          pregnancyStatus: pregnancyStatus || "Not Applicable",
          bloodType: bloodType || "Unknown",
          initialDiagnosis: initialDiagnosis || null,
        },
        { transaction }
      );

      // Normalize admissionDateTime
      let normalizedAdmissionDateTime = new Date();
      if (admissionDateTime) {
        const date = new Date(admissionDateTime);
        if (!isNaN(date.getTime())) {
          normalizedAdmissionDateTime = date;
        }
      }

      const admission = await Admission.create(
        {
          patientId: patient.id,
          admissionDateTime: normalizedAdmissionDateTime,
          department: department || "HDU",
          consultantInCharge: consultantInCharge || null,
          status: "Active",
        },
        { transaction }
      );

      await transaction.commit();

      return {
        patient,
        admission,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Creates an urgent patient admission with minimal data
   * Generates a temporary name like "Urgent Admitted Patient #1"
   * @param {Object} patientData - Minimal patient data (optional)
   * @returns {Promise<Object>} Created patient and admission
   */
  async createUrgentPatient(patientData = {}) {
    const transaction = await sequelize.transaction();

    try {
      const patientNumber = await generatePatientNumber();
      const urgentName = await generateUrgentPatientName();

      const {
        department = "HDU",
        consultantInCharge,
        admissionDateTime,
        initialDiagnosis,
      } = patientData;

      const patient = await Patient.create(
        {
          patientNumber,
          fullName: urgentName,
          nicPassport: null,
          dateOfBirth: null,
          age: null,
          gender: null,
          maritalStatus: "Unknown",
          contactNumber: null,
          email: null,
          address: null,
          isUrgentAdmission: true,
          isIncomplete: true,
        },
        { transaction }
      );

      await MedicalRecord.create(
        {
          patientId: patient.id,
          knownAllergies: null,
          medicalHistory: null,
          currentMedications: null,
          pregnancyStatus: "Not Applicable",
          bloodType: "Unknown",
          initialDiagnosis: initialDiagnosis || null,
        },
        { transaction }
      );

      const admission = await Admission.create(
        {
          patientId: patient.id,
          admissionDateTime: admissionDateTime || new Date(),
          department,
          consultantInCharge: consultantInCharge || null,
          status: "Active",
        },
        { transaction }
      );

      await transaction.commit();

      return {
        patient,
        admission,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async createAdmissionForExistingPatient(patientId, patientData) {
    const transaction = await sequelize.transaction();

    try {
      const {
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
      } = patientData;

      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        throw new Error("Patient not found");
      }

      if (emergencyContactName && emergencyContactNumber) {
        const existingContact = await EmergencyContact.findOne({
          where: { patientId: patient.id, isPrimary: true }
        });

        if (existingContact) {
          await existingContact.update({
            name: emergencyContactName,
            relationship: emergencyContactRelationship,
            contactNumber: emergencyContactNumber,
          }, { transaction });
        } else {
          await EmergencyContact.create(
            {
              patientId: patient.id,
              name: emergencyContactName,
              relationship: emergencyContactRelationship,
              contactNumber: emergencyContactNumber,
              isPrimary: true,
            },
            { transaction }
          );
        }
      }

      const existingMedicalRecord = await MedicalRecord.findOne({
        where: { patientId: patient.id }
      });

      if (existingMedicalRecord) {
        await existingMedicalRecord.update({
          knownAllergies: knownAllergies || existingMedicalRecord.knownAllergies,
          medicalHistory: medicalHistory || existingMedicalRecord.medicalHistory,
          currentMedications: currentMedications || existingMedicalRecord.currentMedications,
          pregnancyStatus: pregnancyStatus || existingMedicalRecord.pregnancyStatus,
          bloodType: bloodType || existingMedicalRecord.bloodType,
          initialDiagnosis: initialDiagnosis || existingMedicalRecord.initialDiagnosis,
        }, { transaction });
      } else {
        await MedicalRecord.create(
          {
            patientId: patient.id,
            knownAllergies: knownAllergies || null,
            medicalHistory: medicalHistory || null,
            currentMedications: currentMedications || null,
            pregnancyStatus: pregnancyStatus || "Not Applicable",
            bloodType: bloodType || "Unknown",
            initialDiagnosis,
          },
          { transaction }
        );
      }

      const admission = await Admission.create(
        {
          patientId: patient.id,
          admissionDateTime: admissionDateTime || new Date(),
          department,
          consultantInCharge,
          status: "Active",
        },
        { transaction }
      );

      await transaction.commit();

      return {
        patient,
        admission,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getPatientById(patientId, includeAll = false) {
    const options = {
      where: { id: patientId },
    };

    if (includeAll) {
      options.include = [
        { model: EmergencyContact },
        { model: MedicalRecord },
        { model: Admission },
        { model: PatientDocument },
      ];
    }

    return await Patient.findOne(options);
  }

  
  async getAllPatients(options = {}) {
    const queryOptions = {
      include: [
        {
          model: EmergencyContact,
          where: { isPrimary: true },
          required: false,
        },
        { model: MedicalRecord, required: false },
        { model: Admission, where: { status: "Active" }, required: false },
      ],
      order: [["createdAt", "DESC"]],
    };

    if (options.limit) {
      queryOptions.limit = options.limit;
    }

    if (options.offset) {
      queryOptions.offset = options.offset;
    }

    return await Patient.findAll(queryOptions);
  }
}

export default new PatientRepository();
