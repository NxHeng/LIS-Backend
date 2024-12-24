const Notification = require('../models/notificationModel');
const { emitNotification, emitAnnouncement } = require('../utils/notificationUtils');

const createAndEmitNotification = async (io, notificationData) => {
    try {
        const { type, message, taskId, caseId, usersNotified } = notificationData;

        if (!Array.isArray(usersNotified) || usersNotified.length === 0) {
            throw new Error('usersNotified must be a non-empty array');
        }

        const notifications = [];

        // Create a notification for each user
        for (const userId of usersNotified) {
            const notification = new Notification({
                type,
                message,
                taskId,
                caseId,
                usersNotified,
                userId // Adding userId to each notification
            });
            notifications.push(notification);
        }

        // Save all notifications in the database
        await Notification.insertMany(notifications);

        // Emit notifications to each user
        notifications.forEach(notification => {
            emitNotification(io, notification);
        });
    } catch (error) {
        console.error('Failed to create and emit notifications:', error);
        throw new Error('Failed to create and emit notifications');
    }
};

const createAndEmitAnnouncement = async (io, notificationData) => {
    try {
        const { type, message, announcementId, usersNotified } = notificationData;
        // Save the notification in the database
        const notification = new Notification({
            type,
            message,
            announcementId,
            usersNotified,
        });
        // console.log("Emit Announcement Here", notification);
        // Emit notification using socket.io to the users
        emitAnnouncement(io, notification);
    }
    catch (error) {
        console.error('Failed to create and emit announcement:', error);
        throw new Error('Failed to create and emit announcement');
    }
}

const getNotificationsForUser = async (userId) => {
    try {
        const notifications = await Notification.find({ userId: userId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'caseId',
                populate: [
                    { path: 'solicitorInCharge', select: 'username _id' },
                    { path: 'clerkInCharge', select: 'username _id' },
                    { path: 'category', select: 'categoryName _id' }
                ]
            });
        return notifications;
    } catch (error) {
        console.error('Failed to retrieve notifications:', error);
        throw new Error('Failed to retrieve notifications');
    }
};

const deleteSingleNotification = async (notificationId) => {
    try {
        await Notification.findByIdAndDelete(notificationId);
    } catch (error) {
        console.error('Failed to delete notification:', error);
        throw new Error('Failed to delete notification');
    }
};

const deleteAllNotificationsForUser = async (userId) => {
    try {
        await Notification.deleteMany({ userId: userId });
    } catch (error) {
        console.error('Failed to delete notifications:', error);
        throw new Error('Failed to delete notifications');
    }
}

module.exports = {
    createAndEmitNotification,
    getNotificationsForUser,
    createAndEmitAnnouncement,
    deleteSingleNotification,
    deleteAllNotificationsForUser,

};
