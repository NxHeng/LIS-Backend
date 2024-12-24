const socketUtils = require('./socketUtils');

// const emitNotification = (io, notification) => {
//     const { usersNotified } = notification;
//     console.log('Emitting notification:', notification);

//     // Emit notification to each user based on their socket ID
//     usersNotified.forEach(userId => {
//         console.log('Checking userId:', userId);
//         const user = socketUtils.getUser(userId);
//         if (user && user.socketId) {
//             console.log('Found user with socketId:', user.socketId);
//             io.to(user.socketId).emit('newNotification', notification);
//         } else {
//             console.warn(`No socket ID found for user: ${userId}`);
//         }
//     });
// };

const emitNotification = (io, notification) => {
    const { userId } = notification; // Single user for this notification

    if (!userId) {
        console.warn('Notification has no userId. Skipping emit.');
        return;
    }

    console.log('Emitting notification:', notification);

    // Find the user's socket ID and emit the notification
    const user = socketUtils.getUser(userId);
    if (user && user.socketId) {
        console.log(`Found user with socketId: ${user.socketId}. Emitting notification.`);
        io.to(user.socketId).emit('newNotification', notification);
    } else {
        console.warn(`No socket ID found for user: ${userId}`);
    }
};


const emitAnnouncement = (io, announcement) => {
    const { usersNotified } = announcement;
    console.log('Emitting announcement:', announcement);

    // Emit announcement to each user based on their socket ID
    usersNotified.forEach(userId => {
        console.log('Checking userId:', userId);
        const user = socketUtils.getUser(userId);
        if (user && user.socketId) {
            console.log('Found user with socketId:', user.socketId);
            io.to(user.socketId).emit('newAnnouncement', announcement);
        } else {
            console.warn(`No socket ID found for user: ${userId}`);
        }
    });
}

module.exports = {
    emitNotification,
    emitAnnouncement
};
