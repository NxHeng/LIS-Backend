const Notification = require('../models/notificationModel');
const { emitNotification, emitAnnouncement } = require('../utils/notificationUtils');

const createAndEmitNotification = async (io, notificationData) => {
    try {
        const { type, message, taskId, caseId, usersNotified } = notificationData;
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

const createAndEmitAnnouncement = async (io, notificationData) => {
    try {
        const { type, message, announcementId, usersNotified } = notificationData;
        console.log("notificationData:", notificationData);
        // Save the notification in the database
        const notification = new Notification({
            type,
            message,
            announcementId,
            usersNotified
        });

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
        // Optional: Add pagination or limit results if necessary
        const notifications = await Notification.find({ usersNotified: userId })
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

module.exports = {
    createAndEmitNotification,
    getNotificationsForUser,
    createAndEmitAnnouncement
};
