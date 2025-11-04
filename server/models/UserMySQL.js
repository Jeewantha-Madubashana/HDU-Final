import { DataTypes } from "sequelize";

const defineUser = (sequelize) => {
  const UserMySQL = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      username: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      registrationNumber: { type: DataTypes.STRING, allowNull: false },
      ward: { type: DataTypes.STRING, allowNull: true },
      mobileNumber: { type: DataTypes.STRING, allowNull: false },
      sex: {
        type: DataTypes.ENUM("Male", "Female", "Other"),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM(
          "House Officer",
          "Medical Officer",
          "Nurse",
          "Consultant"
        ),
        allowNull: false,
      },
      nameWithInitials: { type: DataTypes.STRING, allowNull: true },
      speciality: { type: DataTypes.STRING, allowNull: true },
      grade: { type: DataTypes.STRING, allowNull: true },
    },
    { timestamps: true, tableName: "users" }
  );

  return UserMySQL;
};

export default defineUser;
