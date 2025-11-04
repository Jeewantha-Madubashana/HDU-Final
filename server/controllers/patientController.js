import { Patient, BedMySQL, CriticalFactor, Admission } from "../config/mysqlDB.js";
import { Op } from "sequelize";

export async function getPatientAnalytics(req, res) {
  try {
    // Get total patients
    const totalPatients = await Patient.count();
    
    // Get gender distribution
    const genderDistribution = await Patient.findAll({
      attributes: [
        'gender',
        [Patient.sequelize.fn('COUNT', Patient.sequelize.col('id')), 'count']
      ],
      group: ['gender']
    });
    
    // Get critical patients (patients with critical vital signs)
    const criticalPatients = await CriticalFactor.findAll({
      where: {
        [Op.or]: [
          { bloodPressure: { [Op.gte]: 140 } },
          { heartRate: { [Op.gte]: 100 } },
          { temperature: { [Op.gte]: 38 } },
          { oxygenSaturation: { [Op.lte]: 95 } }
        ]
      },
      include: {
        model: Patient,
        as: 'Patient',
        attributes: ['id', 'fullName', 'patientNumber']
      }
    });
    
    // Get bed occupancy
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
          attributes: ['id', 'bloodPressure', 'heartRate', 'temperature', 'oxygenSaturation', 'createdAt']
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    res.json(patient);
  } catch (err) {
    console.error("getPatientById Error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
}

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

export async function getAverageLengthOfStay(req, res) {
  try {
    // Calculate ALOS for discharged patients
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

    // Calculate ALOS for currently admitted patients
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

    // Get ALOS by department
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

    // Find the patient
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

    // Create discharge record
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

    // Update admission status to discharged
    if (patient.admissions && patient.admissions.length > 0) {
      const currentAdmission = patient.admissions[0];
      await currentAdmission.update({
        status: 'Discharged',
        dischargeDateTime: new Date(),
        dischargeNotes: doctorComments
      });
    }

    // Deassign the bed
    if (bedId) {
      try {
        const bed = await BedMySQL.findOne({ where: { id: bedId } });
        if (bed) {
          await bed.update({ patientId: null });
          console.log(`Bed ${bedId} deassigned successfully`);
        }
      } catch (error) {
        console.warn("Could not deassign bed:", error.message);
      }
    }

    // Create discharge record in database (you might need to create a Discharge model)
    // For now, we'll log it and return success
    console.log("Discharge Record:", dischargeRecord);

    res.json({
      msg: "Patient discharged successfully",
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