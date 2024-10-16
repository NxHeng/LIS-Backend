const socketUtils = require('./socketUtils');

const emitNotification = (io, notification) => {
    const { usersNotified } = notification;
    console.log('Emitting notification:', notification);

    // Emit notification to each user based on their socket ID
    usersNotified.forEach(userId => {
        console.log('Checking userId:', userId);
        const user = socketUtils.getUser(userId);
        if (user && user.socketId) {
            console.log('Found user with socketId:', user.socketId);
            io.to(user.socketId).emit('newNotification', notification);
        } else {
            console.warn(`No socket ID found for user: ${userId}`);
        }
    });
};

module.exports = {
    emitNotification
};
