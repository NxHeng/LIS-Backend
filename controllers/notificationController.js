const notificationService = require('../services/notificationService');

const getNotificationsForUser = async (req, res) => {
    // console.log(req.user);
    try {
        const { _id } = req.user; // Assume you have user ID from authentication middleware
        // const notifications = await Notification.find({ usersNotified: userId }).sort({ createdAt: -1 });
        const notifications = await notificationService.getNotificationsForUser(_id);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve notifications' });
    }
};

const deleteSingleNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        await notificationService.deleteSingleNotification(notificationId);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

const deleteAllNotificationsForUser = async (req, res) => {
    try {
        const { _id } = req.user;
        await notificationService.deleteAllNotificationsForUser(_id);
        res.json({ message: 'All notifications deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notifications' });
    }
};

module.exports = {
    getNotificationsForUser,
    deleteSingleNotification,
    deleteAllNotificationsForUser,

};
