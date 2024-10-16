const express = require('express');
const {
    getNotificationsForUser ,
} = require('../controllers/notificationController');

const router = express.Router();

// Notification Routes
router.get('/getNotifications', getNotificationsForUser);

module.exports = router;