const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const {
    getStatistics,
    getCaseAnalysis,

} = require('../controllers/dashboardController');

const router = express.Router();

//Category Routes
router.get('/getStatistics', authMiddleware, getStatistics);
router.get('/getCaseAnalysis', getCaseAnalysis);

module.exports = router;