import { VitalSignsConfig } from "../config/mysqlDB.js";
import { Op } from "sequelize";

/**
 * Retrieves all vital signs configurations (active and inactive)
 * Super Admin only endpoint
 * @route GET /api/vital-signs-config/all
 * @access Private (Super Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllVitalSignsConfig = async (req, res) => {
  try {
    const configs = await VitalSignsConfig.findAll({
      order: [["displayOrder", "ASC"], ["label", "ASC"]],
    });
    res.json(configs);
  } catch (error) {
    console.error("Error fetching vital signs config:", error);
    res.status(500).json({
      message: "Failed to fetch vital signs configuration",
      error: error.message,
    });
  }
};

/**
 * Retrieves only active vital signs configurations
 * Used by forms and displays to show available vital signs
 * @route GET /api/vital-signs-config/active
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getActiveVitalSignsConfig = async (req, res) => {
  try {
    const configs = await VitalSignsConfig.findAll({
      where: { isActive: true },
      order: [["displayOrder", "ASC"], ["label", "ASC"]],
    });
    res.json(configs);
  } catch (error) {
    console.error("Error fetching active vital signs config:", error);
    res.status(500).json({
      message: "Failed to fetch active vital signs configuration",
      error: error.message,
    });
  }
};

/**
 * Retrieves a single vital sign configuration by ID
 * Super Admin only endpoint
 * @route GET /api/vital-signs-config/:id
 * @access Private (Super Admin only)
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.id - ID of the vital sign configuration
 * @param {Object} res - Express response object
 */
export const getVitalSignsConfigById = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await VitalSignsConfig.findByPk(id);

    if (!config) {
      return res.status(404).json({
        message: "Vital signs configuration not found",
      });
    }

    res.json(config);
  } catch (error) {
    console.error("Error fetching vital signs config:", error);
    res.status(500).json({
      message: "Failed to fetch vital signs configuration",
      error: error.message,
    });
  }
};

/**
 * Creates a new vital sign configuration
 * Super Admin only endpoint
 * @route POST /api/vital-signs-config
 * @access Private (Super Admin only)
 * @param {Object} req - Express request object
 * @param {Object} req.body - Vital sign configuration data
 * @param {string} req.body.name - Unique field name (e.g., "heartRate")
 * @param {string} req.body.label - Display label (e.g., "Heart Rate (HR)")
 * @param {string} [req.body.unit] - Unit of measurement (e.g., "bpm")
 * @param {number} [req.body.normalRangeMin] - Minimum normal value
 * @param {number} [req.body.normalRangeMax] - Maximum normal value
 * @param {string} [req.body.dataType] - Data type ("integer", "decimal", "text")
 * @param {boolean} [req.body.isActive] - Whether the vital sign is active
 * @param {number} [req.body.displayOrder] - Display order in forms
 * @param {string} [req.body.description] - Description of the vital sign
 * @param {Object} res - Express response object
 */
export const createVitalSignsConfig = async (req, res) => {
  try {
    const {
      name,
      label,
      unit,
      normalRangeMin,
      normalRangeMax,
      dataType,
      isActive,
      displayOrder,
      description,
    } = req.body;

    if (!name || !label) {
      return res.status(400).json({
        message: "Name and label are required",
      });
    }

    const existing = await VitalSignsConfig.findOne({
      where: { name },
    });

    if (existing) {
      return res.status(400).json({
        message: "A vital sign with this name already exists",
      });
    }

    const config = await VitalSignsConfig.create({
      name,
      label,
      unit: unit || null,
      normalRangeMin: normalRangeMin !== undefined ? parseFloat(normalRangeMin) : null,
      normalRangeMax: normalRangeMax !== undefined ? parseFloat(normalRangeMax) : null,
      dataType: dataType || "integer",
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0,
      description: description || null,
    });

    res.status(201).json({
      message: "Vital signs configuration created successfully",
      config,
    });
  } catch (error) {
    console.error("Error creating vital signs config:", error);
    res.status(500).json({
      message: "Failed to create vital signs configuration",
      error: error.message,
    });
  }
};

/**
 * Updates an existing vital sign configuration
 * Name cannot be changed after creation
 * Super Admin only endpoint
 * @route PUT /api/vital-signs-config/:id
 * @access Private (Super Admin only)
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.id - ID of the vital sign configuration
 * @param {Object} req.body - Updated vital sign configuration data
 * @param {Object} res - Express response object
 */
export const updateVitalSignsConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      label,
      unit,
      normalRangeMin,
      normalRangeMax,
      dataType,
      isActive,
      displayOrder,
      description,
    } = req.body;

    const config = await VitalSignsConfig.findByPk(id);

    if (!config) {
      return res.status(404).json({
        message: "Vital signs configuration not found",
      });
    }

    const updateData = {};
    if (label !== undefined) updateData.label = label;
    if (unit !== undefined) updateData.unit = unit;
    if (normalRangeMin !== undefined) updateData.normalRangeMin = normalRangeMin ? parseFloat(normalRangeMin) : null;
    if (normalRangeMax !== undefined) updateData.normalRangeMax = normalRangeMax ? parseFloat(normalRangeMax) : null;
    if (dataType !== undefined) updateData.dataType = dataType;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);
    if (description !== undefined) updateData.description = description;

    await config.update(updateData);

    res.json({
      message: "Vital signs configuration updated successfully",
      config,
    });
  } catch (error) {
    console.error("Error updating vital signs config:", error);
    res.status(500).json({
      message: "Failed to update vital signs configuration",
      error: error.message,
    });
  }
};

/**
 * Deletes a vital sign configuration
 * Super Admin only endpoint
 * @route DELETE /api/vital-signs-config/:id
 * @access Private (Super Admin only)
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.id - ID of the vital sign configuration to delete
 * @param {Object} res - Express response object
 */
export const deleteVitalSignsConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await VitalSignsConfig.findByPk(id);

    if (!config) {
      return res.status(404).json({
        message: "Vital signs configuration not found",
      });
    }

    await config.destroy();

    res.json({
      message: "Vital signs configuration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vital signs config:", error);
    res.status(500).json({
      message: "Failed to delete vital signs configuration",
      error: error.message,
    });
  }
};

/**
 * Toggles the active status of a vital sign configuration
 * Super Admin only endpoint
 * @route PATCH /api/vital-signs-config/:id/toggle
 * @access Private (Super Admin only)
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.id - ID of the vital sign configuration
 * @param {Object} res - Express response object
 */
export const toggleVitalSignsConfigStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await VitalSignsConfig.findByPk(id);

    if (!config) {
      return res.status(404).json({
        message: "Vital signs configuration not found",
      });
    }

    config.isActive = !config.isActive;
    await config.save();

    res.json({
      message: `Vital signs configuration ${config.isActive ? "activated" : "deactivated"} successfully`,
      config,
    });
  } catch (error) {
    console.error("Error toggling vital signs config status:", error);
    res.status(500).json({
      message: "Failed to toggle vital signs configuration status",
      error: error.message,
    });
  }
};

