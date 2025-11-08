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

router.get(
  "/all",
  protect,
  authorize(["Super Admin", "Consultant", "Medical Officer"]),
  getAllVitalSignsConfig
);

router.get(
  "/active",
  protect,
  authorize(["Nurse", "Medical Officer", "Consultant", "House Officer", "Super Admin"]),
  getActiveVitalSignsConfig
);

router.get(
  "/:id",
  protect,
  authorize(["Super Admin", "Consultant", "Medical Officer"]),
  getVitalSignsConfigById
);

router.post(
  "/",
  protect,
  authorize(["Super Admin"]),
  createVitalSignsConfig
);

router.put(
  "/:id",
  protect,
  authorize(["Super Admin"]),
  updateVitalSignsConfig
);

router.delete(
  "/:id",
  protect,
  authorize(["Super Admin"]),
  deleteVitalSignsConfig
);

router.patch(
  "/:id/toggle-status",
  protect,
  authorize(["Super Admin"]),
  toggleVitalSignsConfigStatus
);

export default router;

