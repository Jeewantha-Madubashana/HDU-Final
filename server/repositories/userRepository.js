import { UserMySQLModel } from "../config/mysqlDB.js";

class UserRepository {
  async findByUsername(username) {
    return await UserMySQLModel.findOne({ where: { username } });
  }

  async createUser(userData) {
    return await UserMySQLModel.create(userData);
  }
}

export default new UserRepository();
