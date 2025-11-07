import express from "express";
import {
  getAllVitalSignsConfig,
  getActiveVitalSignsConfig,
  getVitalSignsConfigById,
  createVitalSignsConfig,
  updateVitalSignsConfig,
  deleteVitalSignsConfig,
  toggleVitalSignsConfigStatus,
} from "../controllers/vitalSignsConfigController.js";
import { authenticateJWT as protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all vital signs configurations (including inactive)
router.get(
  "/all",
  protect,
  authorize(["Super Admin", "Consultant", "Medical Officer"]),
  getAllVitalSignsConfig
);

// Get active vital signs configurations only
router.get(
  "/active",
  protect,
  authorize(["Nurse", "Medical Officer", "Consultant", "House Officer", "Super Admin"]),
  getActiveVitalSignsConfig
);

// Get a single vital signs configuration by ID
router.get(
  "/:id",
  protect,
  authorize(["Super Admin", "Consultant", "Medical Officer"]),
  getVitalSignsConfigById
);

// Create a new vital signs configuration
router.post(
  "/",
  protect,
  authorize(["Super Admin"]),
  createVitalSignsConfig
);

// Update a vital signs configuration
router.put(
  "/:id",
  protect,
  authorize(["Super Admin"]),
  updateVitalSignsConfig
);

// Delete a vital signs configuration
router.delete(
  "/:id",
  protect,
  authorize(["Super Admin"]),
  deleteVitalSignsConfig
);

// Toggle active status
router.patch(
  "/:id/toggle-status",
  protect,
  authorize(["Super Admin"]),
  toggleVitalSignsConfigStatus
);

export default router;

