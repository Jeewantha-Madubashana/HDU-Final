import { Router } from "express";
const router = Router();
import { 
  register, 
  login, 
  getConsultants, 
  getPendingUsers, 
  getAllUsers, 
  approveUser, 
  rejectUser 
} from "../controllers/authController.js";
import { authenticateJWT as protect, authorize } from "../middleware/auth.js";

router.post("/register", register);

router.post("/login", login);

// Get all consultants
router.get("/consultants", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getConsultants);

// Super Admin routes
router.get("/pending-users", protect, authorize(["Super Admin"]), getPendingUsers);
router.get("/all-users", protect, authorize(["Super Admin"]), getAllUsers);
router.put("/approve/:userId", protect, authorize(["Super Admin"]), approveUser);
router.put("/reject/:userId", protect, authorize(["Super Admin"]), rejectUser);

export default router;
