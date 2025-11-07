import { VitalSignsConfig } from "../config/mysqlDB.js";
import { Op } from "sequelize";

// Get all vital signs configurations
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

// Get active vital signs configurations only
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

// Get a single vital sign configuration by ID
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

// Create a new vital signs configuration
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

    // Validate required fields
    if (!name || !label) {
      return res.status(400).json({
        message: "Name and label are required",
      });
    }

    // Check if name already exists
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

// Update a vital signs configuration
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

    // Update fields (name cannot be changed)
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

// Delete a vital signs configuration
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

// Toggle active status
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

