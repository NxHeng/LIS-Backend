const express = require('express');
const {
    getStatistics
} = require('../controllers/dashboardController');

const router = express.Router();

//Category Routes
router.get('/getStatistics', getStatistics);

module.exports = router;