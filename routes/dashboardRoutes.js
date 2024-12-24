const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const {
    getStatistics,
    getCaseAnalysis,
    getOverallStatus,
    getMonthlyReport,
    getYearlyReport
} = require('../controllers/dashboardController');

const router = express.Router();

//Category Routes
router.get('/getStatistics', authMiddleware, getStatistics);
router.get('/getCaseAnalysis', getCaseAnalysis);

router.get('/getOverallStatus', authMiddleware, getOverallStatus);
router.get('/getMonthlyReport', authMiddleware, getMonthlyReport);
router.get('/getYearlyReport', authMiddleware, getYearlyReport);

module.exports = router;