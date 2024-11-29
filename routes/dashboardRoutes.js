const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const {
    getStatistics
} = require('../controllers/dashboardController');

const router = express.Router();

//Category Routes
router.get('/getStatistics', authMiddleware, getStatistics);

module.exports = router;