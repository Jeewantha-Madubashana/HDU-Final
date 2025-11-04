import { DataTypes } from "sequelize";

const defineBed = (sequelize) => {
  const BedMySQL = sequelize.define(
    "Bed",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      bedNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      patientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "patients", key: "id" },
      },
    },
    { timestamps: true, tableName: "beds" }
  );

  return BedMySQL;
};

export default defineBed;
