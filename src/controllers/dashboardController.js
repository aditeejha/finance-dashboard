const dashboardService = require("../services/dashboardService");

const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const data = await dashboardService.getCategoryBreakdown();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const data = await dashboardService.getMonthlyTrends(months);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const data = await dashboardService.getRecentActivity(limit);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getRecentActivity };
