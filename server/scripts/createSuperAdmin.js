import { sequelize } from "../config/mysqlDB.js";
import { UserMySQLModel } from "../config/mysqlDB.js";
import { genSalt, hash, compare } from "bcryptjs";

const createOrUpdateSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    const superAdminUsername = "SUPER_ADMIN";
    const superAdminPassword = 'zV38~6m{~3"';
    
    // Check if super admin exists
    let existingSuperAdmin = await UserMySQLModel.findOne({
      where: { username: superAdminUsername },
    });

    const salt = await genSalt(10);
    const hashedPassword = await hash(superAdminPassword, salt);

    if (existingSuperAdmin) {
      // Update existing Super Admin
      await UserMySQLModel.update(
        {
          password: hashedPassword,
          status: "approved",
          role: "Super Admin",
        },
        {
          where: { username: superAdminUsername },
        }
      );
      console.log("✅ Super Admin updated successfully");
    } else {
      // Create new Super Admin
      await UserMySQLModel.create({
        username: superAdminUsername,
        password: hashedPassword,
        email: "superadmin@hospital.lk",
        registrationNumber: "SA001",
        ward: "System",
        mobileNumber: "+94 11 000 0000",
        sex: "Other",
        role: "Super Admin",
        status: "approved",
        nameWithInitials: "Super Admin",
      });
      console.log("✅ Super Admin created successfully");
    }

    // Verify the password works
    const verifyAdmin = await UserMySQLModel.findOne({
      where: { username: superAdminUsername },
    });

    if (verifyAdmin) {
      const passwordMatch = await compare(superAdminPassword, verifyAdmin.password);
      if (passwordMatch) {
        console.log("✅ Password verification: SUCCESS");
      } else {
        console.log("❌ Password verification: FAILED");
      }
    }

    console.log("\n📋 Super Admin Credentials:");
    console.log(`   Username: ${superAdminUsername}`);
    console.log(`   Password: ${superAdminPassword}`);
    console.log(`   Status: ${verifyAdmin?.status || "N/A"}`);
    console.log(`   Role: ${verifyAdmin?.role || "N/A"}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating/updating Super Admin:", error);
    process.exit(1);
  }
};

createOrUpdateSuperAdmin();

