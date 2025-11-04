import { AuditLog, UserMySQLModel as User } from "../config/mysqlDB.js";
import { Op } from "sequelize";

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

export const getAlertAnalytics = async (req, res) => {
  try {
    const { timeRange = '7' } = req.query; // Default to 7 days
    const daysAgo = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all alert acknowledgments
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

    // Process the data for analytics
    const analytics = {
      totalAlerts: alertAcknowledgments.length,
      alertsByType: {},
      alertsByUser: {},
      alertsByDay: {},
      alertsByHour: {},
      responseTimeAnalysis: {
        averageResponseTime: 0, // This would need to be calculated based on alert creation vs acknowledgment
        quickResponses: 0, // < 5 minutes
        slowResponses: 0, // > 30 minutes
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

    // Group by alert type
    alertAcknowledgments.forEach(log => {
      const alertType = log.newValues?.alertType || 'Unknown';
      analytics.alertsByType[alertType] = (analytics.alertsByType[alertType] || 0) + 1;
    });

    // Group by user
    alertAcknowledgments.forEach(log => {
      const userName = log.user?.nameWithInitials || 'Unknown';
      const userRole = log.user?.role || 'Unknown';
      const userKey = `${userName} (${userRole})`;
      analytics.alertsByUser[userKey] = (analytics.alertsByUser[userKey] || 0) + 1;
    });

    // Group by day (last 7 days)
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

    // Group by hour of day (0-23)
    for (let hour = 0; hour < 24; hour++) {
      analytics.alertsByHour[hour] = 0;
    }

    alertAcknowledgments.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      analytics.alertsByHour[hour]++;
    });

    // Calculate some basic stats
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
