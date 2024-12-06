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

const getCaseAnalysis = async (req, res) => {
    try {
        const { category, month, year } = req.query;
        
        // Ensure the required parameters are provided
        if (!year || !month) {
            return res.status(400).json({ error: 'Year and Month are required' });
        }

        // Pass the query params to the service
        const caseAnalysis = await dashboardService.getCaseAnalysis({
            category,
            month,
            year
        });

        return res.status(200).json(caseAnalysis); // Ensure response is sent here

    } catch (error) {
        // Handle errors more explicitly
        console.error('Error fetching case analysis:', error);
        return res.status(400).json({ error: error.message });
    }
};



module.exports = {
    getStatistics,
    getCaseAnalysis
};
