import { AuditLog, UserMySQLModel as User } from "../config/mysqlDB.js";
import { Op } from "sequelize";

/**
 * Retrieves audit history for a specific table and record
 * @route GET /api/audit/:tableName/:recordId
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.tableName - Name of the table
 * @param {number} req.params.recordId - ID of the record
 * @param {Object} res - Express response object
 */
export const getAuditHistory = async (req, res) => {
  try {
    const { tableName, recordId } = req.params;

    const auditLogs = await AuditLog.findAll({
      where: {
        tableName,
        recordId,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "nameWithInitials"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!auditLogs || auditLogs.length === 0) {
      return res.status(404).json({ message: "No audit history found" });
    }

    res.json(auditLogs);
  } catch (error) {
    console.error("Error fetching audit history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Retrieves analytics for alert acknowledgments
 * Groups alerts by type, user, day, and hour for reporting
 * @route GET /api/audit/alert-analytics
 * @access Private
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.timeRange='7'] - Number of days to analyze (default: 7)
 * @param {Object} res - Express response object
 */
export const getAlertAnalytics = async (req, res) => {
  try {
    const { timeRange = '7' } = req.query;
    const daysAgo = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const alertAcknowledgments = await AuditLog.findAll({
      where: {
        action: "ACKNOWLEDGE",
        tableName: "Alerts",
        timestamp: {
          [Op.gte]: startDate
        }
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "nameWithInitials", "role"],
        },
      ],
      order: [["timestamp", "DESC"]],
    });

    const analytics = {
      totalAlerts: alertAcknowledgments.length,
      alertsByType: {},
      alertsByUser: {},
      alertsByDay: {},
      alertsByHour: {},
      responseTimeAnalysis: {
        averageResponseTime: 0,
        quickResponses: 0,
        slowResponses: 0,
      },
      recentAlerts: alertAcknowledgments.slice(0, 10).map(log => ({
        id: log.id,
        alertId: log.newValues?.alertId,
        alertType: log.newValues?.alertType,
        patientId: log.newValues?.patientId,
        bedNumber: log.newValues?.bedNumber,
        acknowledgedBy: log.user?.nameWithInitials || 'Unknown',
        acknowledgedByRole: log.user?.role,
        acknowledgedAt: log.timestamp,
        description: log.description
      }))
    };

    alertAcknowledgments.forEach(log => {
      const alertType = log.newValues?.alertType || 'Unknown';
      analytics.alertsByType[alertType] = (analytics.alertsByType[alertType] || 0) + 1;
    });

    alertAcknowledgments.forEach(log => {
      const userName = log.user?.nameWithInitials || 'Unknown';
      const userRole = log.user?.role || 'Unknown';
      const userKey = `${userName} (${userRole})`;
      analytics.alertsByUser[userKey] = (analytics.alertsByUser[userKey] || 0) + 1;
    });

    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      analytics.alertsByDay[dateKey] = 0;
    }

    alertAcknowledgments.forEach(log => {
      const dateKey = log.timestamp.toISOString().split('T')[0];
      if (analytics.alertsByDay.hasOwnProperty(dateKey)) {
        analytics.alertsByDay[dateKey]++;
      }
    });

    for (let hour = 0; hour < 24; hour++) {
      analytics.alertsByHour[hour] = 0;
    }

    alertAcknowledgments.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      analytics.alertsByHour[hour]++;
    });

    const alertTypes = Object.keys(analytics.alertsByType);
    const mostCommonAlertType = alertTypes.reduce((a, b) => 
      analytics.alertsByType[a] > analytics.alertsByType[b] ? a : b, 
      alertTypes[0] || 'None'
    );

    const users = Object.keys(analytics.alertsByUser);
    const mostActiveUser = users.reduce((a, b) => 
      analytics.alertsByUser[a] > analytics.alertsByUser[b] ? a : b, 
      users[0] || 'None'
    );

    analytics.summary = {
      mostCommonAlertType,
      mostActiveUser,
      averageAlertsPerDay: Math.round(analytics.totalAlerts / daysAgo),
      peakHour: Object.keys(analytics.alertsByHour).reduce((a, b) => 
        analytics.alertsByHour[a] > analytics.alertsByHour[b] ? a : b, '0'
      )
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching alert analytics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
