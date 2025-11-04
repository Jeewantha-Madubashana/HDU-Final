import { Router } from "express";
const router = Router();
import { register, login, getConsultants } from "../controllers/authController.js";
import { authenticateJWT as protect, authorize } from "../middleware/auth.js";

router.post("/register", register);

router.post("/login", login);

// Get all consultants
router.get("/consultants", protect, authorize(["Nurse", "Medical Officer", "Consultant", "House Officer"]), getConsultants);

export default router;
