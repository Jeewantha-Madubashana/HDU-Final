import { Patient, BedMySQL, CriticalFactor, Admission, VitalSignsConfig } from "../config/mysqlDB.js";
import { Op } from "sequelize";

export async function getPatientAnalytics(req, res) {
  try {
    // Get total patients
    const totalPatients = await Patient.count();
    
    // Get gender distribution
    const genderDistributionRaw = await Patient.findAll({
      attributes: [
        'gender',
        [Patient.sequelize.fn('COUNT', Patient.sequelize.col('id')), 'count']
      ],
      group: ['gender']
    });
    
    // Format gender distribution
    const genderDistribution = genderDistributionRaw.map(item => ({
      label: item.gender || 'Unknown',
      value: parseInt(item.dataValues.count),
      color: item.gender === 'Male' ? '#2196F3' : item.gender === 'Female' ? '#E91E63' : '#9E9E9E'
    }));
    
    // Get age groups distribution
    const patientsWithAge = await Patient.findAll({
      attributes: ['id', 'dateOfBirth', 'age'],
      where: {
        [Op.or]: [
          { age: { [Op.ne]: null } },
          { dateOfBirth: { [Op.ne]: null } }
        ]
      }
    });
    
    // Calculate age groups
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
    
    // Format age groups
    const ageGroupsFormatted = [
      { label: '0-30', value: ageGroups['0-30'], color: '#2196F3' },
      { label: '30-40', value: ageGroups['30-40'], color: '#4CAF50' },
      { label: '40-50', value: ageGroups['40-50'], color: '#FF9800' },
      { label: '50-60', value: ageGroups['50-60'], color: '#F44336' },
      { label: '60+', value: ageGroups['60+'], color: '#9C27B0' }
    ].filter(item => item.value > 0);
    
    // Get vital signs trends (last 12 records for each vital sign)
    const vitalSignsTrends = {
      heartRate: [],
      bloodPressure: [],
      temperature: [],
      spO2: []
    };
    
    // Get last 12 critical factors records
    const recentFactors = await CriticalFactor.findAll({
      attributes: ['heartRate', 'bloodPressureSystolic', 'bloodPressureDiastolic', 'temperature', 'spO2', 'recordedAt'],
      where: {
        recordedAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      order: [['recordedAt', 'DESC']],
      limit: 12
    });
    
    // Process vital signs data
    recentFactors.forEach(factor => {
      if (factor.heartRate) vitalSignsTrends.heartRate.push(factor.heartRate);
      if (factor.bloodPressureSystolic) vitalSignsTrends.bloodPressure.push(factor.bloodPressureSystolic);
      if (factor.temperature) vitalSignsTrends.temperature.push(parseFloat(factor.temperature));
      if (factor.spO2) vitalSignsTrends.spO2.push(factor.spO2);
    });
    
    // Reverse to show chronological order
    vitalSignsTrends.heartRate = vitalSignsTrends.heartRate.reverse();
    vitalSignsTrends.bloodPressure = vitalSignsTrends.bloodPressure.reverse();
    vitalSignsTrends.temperature = vitalSignsTrends.temperature.reverse();
    vitalSignsTrends.spO2 = vitalSignsTrends.spO2.reverse();
    
    // Get critical patients using dynamic vital signs configuration
    // Fetch active vital signs configuration to get dynamic normal ranges
    const vitalSignsConfigs = await VitalSignsConfig.findAll({
      where: { isActive: true },
      order: [["displayOrder", "ASC"]],
    });

    // Get valid database column fields dynamically from the CriticalFactor model
    // These are fields that can be queried directly (not stored in JSON)
    const metadataFields = ['id', 'patientId', 'recordedAt', 'recordedBy', 'isAmended', 
      'amendedBy', 'amendedAt', 'amendmentReason', 'dynamicVitals', 'createdAt', 'updatedAt'];
    const modelAttributes = Object.keys(CriticalFactor.rawAttributes || {});
    const validCriticalFactorFields = modelAttributes.filter(attr => !metadataFields.includes(attr));
    
    const criticalConditions = [];
    
    for (const config of vitalSignsConfigs) {
      const fieldName = config.name;
      
      // Only process fields that exist as database columns (can be queried directly)
      // Dynamic fields (stored in JSON) are handled separately in getCriticalPatients
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
    
    // Get critical patients (only if we have conditions from dynamic config)
    let criticalPatients = [];
    if (criticalConditions.length > 0) {
      criticalPatients = await CriticalFactor.findAll({
        where: {
          [Op.or]: criticalConditions
        },
        include: {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'fullName', 'patientNumber']
        }
      });
    }
    
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
        }
      } catch (error) {
        console.warn("Could not deassign bed:", error.message);
      }
    }

    // Create discharge record in database (you might need to create a Discharge model)

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