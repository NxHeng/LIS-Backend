const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const {
    getNotificationsForUser,
    deleteSingleNotification,
    deleteAllNotificationsForUser
} = require('../controllers/notificationController');

const router = express.Router();

// Notification Routes
router.get('/getNotifications', authMiddleware, getNotificationsForUser);
router.delete('/deleteSingleNotification/:notificationId', authMiddleware, deleteSingleNotification);
router.delete('/deleteAllNotifications', authMiddleware, deleteAllNotificationsForUser);

module.exports = router;