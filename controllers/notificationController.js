const Notification = require('../models/notificationModel');
const notificationService = require('../services/notificationService');

const getNotificationsForUser = async (req, res) => {
    // console.log(req.user);
    try {
        const { userId } = req.query; // Assume you have user ID from authentication middleware
        // const notifications = await Notification.find({ usersNotified: userId }).sort({ createdAt: -1 });
        const notifications = await notificationService.getNotificationsForUser(userId);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve notifications' });
    }
};

module.exports = {
    getNotificationsForUser
};
