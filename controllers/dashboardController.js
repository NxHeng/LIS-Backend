const dashboardService = require('../services/dashboardService');

// Get all statistics
const getStatistics = async (req, res) => {
    try {
        const statistics = await dashboardService.getStatistics();
        res.status(200).json(statistics);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


module.exports = {
    getStatistics,
};
