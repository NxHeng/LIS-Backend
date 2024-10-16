const Notification = require('../models/notificationModel');
const { emitNotification } = require('../utils/notificationUtils');

const createAndEmitNotification = async (io, notificationData) => {
    try {
        const { type, message, taskId, caseId, usersNotified } = notificationData;
        console.log("notificationData:", notificationData);
        // Save the notification in the database
        const notification = new Notification({
            type,
            message,
            taskId,
            caseId,
            usersNotified
        });
        // console.log("Notification:", notification);
        await notification.save();

        // Emit notification using socket.io to the users
        emitNotification(io, notification);
    }
    catch (error) {
        console.error('Failed to create and emit notification:', error);
        throw new Error('Failed to create and emit notification');
    }
};

const getNotificationsForUser = async (userId) => {
    try {
        // Optional: Add pagination or limit results if necessary
        const notifications = await Notification.find({ usersNotified: userId })
        .sort({ createdAt: -1 })
        .populate('taskId')
        .populate('caseId');
        return notifications;
    } catch (error) {
        console.error('Failed to retrieve notifications:', error);
        throw new Error('Failed to retrieve notifications');
    }
};

module.exports = {
    createAndEmitNotification,
    getNotificationsForUser,
};
