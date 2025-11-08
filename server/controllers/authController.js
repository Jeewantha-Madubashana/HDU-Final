import { genSalt, hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import UserRepository from "../repositories/userRepository.js";
import { UserMySQLModel as User } from "../config/mysqlDB.js";

const { sign } = jwt;

/**
 * Registers a new user account
 * All new accounts (except Super Admin) are set to "pending" status and require approval
 * @route POST /api/auth/register
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} req.body - User registration data
 * @param {string} req.body.username - Unique username
 * @param {string} req.body.password - User password (will be hashed)
 * @param {string} req.body.email - User email address
 * @param {string} req.body.role - User role (Nurse, Consultant, etc.)
 * @param {Object} res - Express response object
 */
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

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(400).json({ msg: "Email already exists" });

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

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

/**
 * Authenticates a user and returns JWT token if approved
 * Rejects login for pending or rejected accounts with detailed error messages
 * @route POST /api/auth/login
 * @access Public
 * @param {Object} req - Express request object
 * @param {Object} req.body - Login credentials
 * @param {string} req.body.username - User username
 * @param {string} req.body.password - User password
 * @param {Object} res - Express response object
 */
export async function login(req, res) {
  const { username, password } = req.body;

  try {
    let user = await UserRepository.findByUsername(username);
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

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

/**
 * Retrieves all approved consultants for dropdown/selection purposes
 * @route GET /api/auth/consultants
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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

/**
 * Retrieves all users with pending approval status
 * Super Admin only endpoint
 * @route GET /api/auth/pending-users
 * @access Private (Super Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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

/**
 * Retrieves all users in the system
 * Super Admin only endpoint
 * @route GET /api/auth/all-users
 * @access Private (Super Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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

/**
 * Approves a pending user account
 * Super Admin only endpoint
 * @route POST /api/auth/approve/:userId
 * @access Private (Super Admin only)
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.userId - ID of the user to approve
 * @param {Object} res - Express response object
 */
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

/**
 * Rejects a pending user account
 * Super Admin only endpoint
 * @route POST /api/auth/reject/:userId
 * @access Private (Super Admin only)
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.userId - ID of the user to reject
 * @param {Object} res - Express response object
 */
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
