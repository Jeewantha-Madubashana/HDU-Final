import { VitalSignsConfig } from "../config/mysqlDB.js";
import { connectMySql } from "../config/mysqlDB.js";

const defaultVitalSigns = [
  {
    name: "heartRate",
    label: "Heart Rate",
    unit: "bpm",
    normalRangeMin: 60,
    normalRangeMax: 100,
    dataType: "integer",
    isActive: true,
    displayOrder: 1,
    description: "Number of heartbeats per minute",
  },
  {
    name: "respiratoryRate",
    label: "Respiratory Rate",
    unit: "breaths/min",
    normalRangeMin: 12,
    normalRangeMax: 20,
    dataType: "integer",
    isActive: true,
    displayOrder: 2,
    description: "Number of breaths per minute",
  },
  {
    name: "bloodPressureSystolic",
    label: "Blood Pressure (Systolic)",
    unit: "mmHg",
    normalRangeMin: 90,
    normalRangeMax: 120,
    dataType: "integer",
    isActive: true,
    displayOrder: 3,
    description: "Systolic blood pressure",
  },
  {
    name: "bloodPressureDiastolic",
    label: "Blood Pressure (Diastolic)",
    unit: "mmHg",
    normalRangeMin: 60,
    normalRangeMax: 80,
    dataType: "integer",
    isActive: true,
    displayOrder: 4,
    description: "Diastolic blood pressure",
  },
  {
    name: "spO2",
    label: "SpO2",
    unit: "%",
    normalRangeMin: 95,
    normalRangeMax: 100,
    dataType: "integer",
    isActive: true,
    displayOrder: 5,
    description: "Oxygen saturation level",
  },
  {
    name: "temperature",
    label: "Temperature",
    unit: "°C",
    normalRangeMin: 36.1,
    normalRangeMax: 37.2,
    dataType: "decimal",
    isActive: true,
    displayOrder: 6,
    description: "Body temperature",
  },
  {
    name: "glasgowComaScale",
    label: "Glasgow Coma Scale",
    unit: "",
    normalRangeMin: 13,
    normalRangeMax: 15,
    dataType: "integer",
    isActive: true,
    displayOrder: 7,
    description: "Glasgow Coma Scale score",
  },
  {
    name: "painScale",
    label: "Pain Scale",
    unit: "/10",
    normalRangeMin: 0,
    normalRangeMax: 3,
    dataType: "integer",
    isActive: true,
    displayOrder: 8,
    description: "Pain level on a scale of 0-10",
  },
  {
    name: "bloodGlucose",
    label: "Blood Glucose",
    unit: "mg/dL",
    normalRangeMin: 70,
    normalRangeMax: 140,
    dataType: "integer",
    isActive: true,
    displayOrder: 9,
    description: "Blood glucose level",
  },
  {
    name: "urineOutput",
    label: "Urine Output",
    unit: "mL/kg/hr",
    normalRangeMin: 0.5,
    normalRangeMax: 2.0,
    dataType: "decimal",
    isActive: true,
    displayOrder: 10,
    description: "Urine output per kilogram per hour",
  },
];

const initializeVitalSignsConfig = async () => {
  try {
    await connectMySql();
    console.log("Initializing vital signs configuration...");

    for (const vitalSign of defaultVitalSigns) {
      const existing = await VitalSignsConfig.findOne({
        where: { name: vitalSign.name },
      });

      if (!existing) {
        await VitalSignsConfig.create(vitalSign);
        console.log(`✅ Created vital sign: ${vitalSign.label}`);
      } else {
        console.log(`ℹ️  Vital sign already exists: ${vitalSign.label}`);
      }
    }

    console.log("✅ Vital signs configuration initialization completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing vital signs configuration:", error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('initializeVitalSignsConfig')) {
  initializeVitalSignsConfig()
    .then(() => {
      console.log("✅ Initialization completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Initialization failed:", error);
      process.exit(1);
    });
}

export default initializeVitalSignsConfig;

