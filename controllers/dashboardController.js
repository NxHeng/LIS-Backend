const dashboardService = require('../services/dashboardService');

// Get all statistics
const getStatistics = async (req, res) => {
    try {
        const { _id, role } = req.user;

        if (!role) {
            return res.status(400).json({ error: 'Authentication is required' });
        }

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

const getOverallStatus = async (req, res) => {
    try {
        const { role } = req.user;
        console.log(role);
        if (!role || role !== 'admin') {
            return res.status(400).json({ error: 'Authentication is required' });
        }
        const overallStatus = await dashboardService.getOverallStatus();
        res.status(200).json(overallStatus);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const getMonthlyReport = async (req, res) => {
    try {
        const { role } = req.user;
        const { category, month, year } = req.query;

        if (!role || role !== 'admin') {
            return res.status(400).json({ error: 'Authentication is required' });
        }

        // Ensure the required parameters are provided
        if (!year || !month) {
            return res.status(400).json({ error: 'Year and Month are required' });
        }

        const monthlyReport = await dashboardService.getMonthlyReport({
            category,
            month,
            year
        });

        res.status(200).json(monthlyReport);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const getYearlyReport = async (req, res) => {
    try {
        const { role } = req.user;
        const { category, year } = req.query;

        if (!role || role !== 'admin') {
            return res.status(400).json({ error: 'Authentication is required' });
        }

        // Ensure the required parameters are provided
        if (!year) {
            return res.status(400).json({ error: 'Year is required' });
        }

        const yearlyReport = await dashboardService.getYearlyReport({
            category,
            year
        });

        res.status(200).json(yearlyReport);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


module.exports = {
    getStatistics,
    getCaseAnalysis,
    getOverallStatus,
    getMonthlyReport,
    getYearlyReport
};
