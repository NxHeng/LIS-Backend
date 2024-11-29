const dashboardService = require('../services/dashboardService');

// Get all statistics
const getStatistics = async (req, res) => {
    const { _id, role } = req.user;
    console.log(_id);
    try {
        const statistics = await dashboardService.getStatistics(_id, role);
        res.status(200).json(statistics);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


module.exports = {
    getStatistics,
};
