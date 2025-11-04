import { UserMySQLModel } from "../config/mysqlDB.js";

class UserRepository {
  async findByUsername(username) {
    return await UserMySQLModel.findOne({ where: { username } });
  }

  async createUser(userData) {
    return await UserMySQLModel.create(userData);
  }

  async findById(id) {
    return await UserMySQLModel.findByPk(id);
  }

  async updateStatus(id, status) {
    return await UserMySQLModel.update(
      { status },
      { where: { id } }
    );
  }

  async getPendingUsers() {
    return await UserMySQLModel.findAll({
      where: { status: "pending" },
      attributes: [
        "id",
        "username",
        "email",
        "registrationNumber",
        "ward",
        "mobileNumber",
        "sex",
        "role",
        "nameWithInitials",
        "speciality",
        "grade",
        "status",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  async getAllUsers() {
    return await UserMySQLModel.findAll({
      attributes: [
        "id",
        "username",
        "email",
        "registrationNumber",
        "ward",
        "mobileNumber",
        "sex",
        "role",
        "nameWithInitials",
        "speciality",
        "grade",
        "status",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });
  }
}

export default new UserRepository();
