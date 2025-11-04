import { genSalt, hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import UserRepository from "../repositories/userRepository.js";
import { UserMySQLModel as User } from "../config/mysqlDB.js";

const { sign } = jwt;

export async function register(req, res) {
  const {
    username,
    password,
    email,
    registrationNumber,
    ward,
    mobileNumber,
    sex,
    role,
    nameWithInitials,
    speciality,
    grade,
  } = req.body;

  try {
    let user = await UserRepository.findByUsername(username);
    if (user) return res.status(400).json({ msg: "Username already exists" });

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(400).json({ msg: "Email already exists" });

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    // Set status as pending for all new registrations (except Super Admin)
    const status = role === "Super Admin" ? "approved" : "pending";

    user = await UserRepository.createUser({
      username,
      password: hashedPassword,
      email,
      registrationNumber,
      ward,
      mobileNumber,
      sex,
      role,
      status,
      nameWithInitials,
      speciality,
      grade,
    });

    // Return success message but no token - user needs approval
    res.status(201).json({ 
      msg: "Registration successful. Your account is pending approval by Super Admin.",
      status: "pending",
      requiresApproval: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}

export async function login(req, res) {
  const { username, password } = req.body;

  try {
    let user = await UserRepository.findByUsername(username);
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // Check if user is approved
    if (user.status !== "approved") {
      if (user.status === "pending") {
        return res.status(403).json({ 
          msg: "⏳ Account Pending Approval",
          detail: "Your account registration is pending approval by the Super Admin. You will be able to access the system once your account has been approved. Please wait for approval or contact the system administrator.",
          status: "pending",
          requiresApproval: true,
          userInfo: {
            username: user.username,
            email: user.email,
            role: user.role,
            registeredAt: user.createdAt
          }
        });
      } else if (user.status === "rejected") {
        return res.status(403).json({ 
          msg: "❌ Account Rejected",
          detail: "Your account registration has been rejected by the Super Admin. Please contact the system administrator for more information or to request a review of your account.",
          status: "rejected",
          requiresApproval: true,
          userInfo: {
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      }
    }

    const payload = { user: { id: user.id, role: user.role } };

    sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token, 
        id: user.id,
        role: user.role,
        user: {
          id: user.id,
          role: user.role,
          username: user.username
        }
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}

export async function getConsultants(req, res) {
  try {
    const consultants = await User.findAll({
      where: {
        role: 'Consultant',
        status: 'approved'
      },
      attributes: ['id', 'nameWithInitials', 'speciality', 'ward'],
      order: [['nameWithInitials', 'ASC']]
    });

    res.json(consultants);
  } catch (err) {
    console.error("Error fetching consultants:", err);
    res.status(500).json({ 
      msg: "Server error", 
      error: err.message 
    });
  }
}

// Super Admin endpoints
export async function getPendingUsers(req, res) {
  try {
    const pendingUsers = await UserRepository.getPendingUsers();
    res.json(pendingUsers);
  } catch (err) {
    console.error("Error fetching pending users:", err);
    res.status(500).json({ 
      msg: "Server error", 
      error: err.message 
    });
  }
}

export async function getAllUsers(req, res) {
  try {
    const users = await UserRepository.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({ 
      msg: "Server error", 
      error: err.message 
    });
  }
}

export async function approveUser(req, res) {
  try {
    const { userId } = req.params;
    const user = await UserRepository.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    await UserRepository.updateStatus(userId, "approved");
    
    res.json({ 
      msg: "User approved successfully",
      user: {
        id: user.id,
        username: user.username,
        status: "approved"
      }
    });
  } catch (err) {
    console.error("Error approving user:", err);
    res.status(500).json({ 
      msg: "Server error", 
      error: err.message 
    });
  }
}

export async function rejectUser(req, res) {
  try {
    const { userId } = req.params;
    const user = await UserRepository.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    await UserRepository.updateStatus(userId, "rejected");
    
    res.json({ 
      msg: "User rejected successfully",
      user: {
        id: user.id,
        username: user.username,
        status: "rejected"
      }
    });
  } catch (err) {
    console.error("Error rejecting user:", err);
    res.status(500).json({ 
      msg: "Server error", 
      error: err.message 
    });
  }
}
