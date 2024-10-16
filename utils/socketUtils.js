let io;
let connectedUsers = []; // Map of userId -> socketId

const addNewUser = (userId, socketId) => {
    const userIdStr = userId.toString(); // Ensure userId is a string
    if (!connectedUsers.some((user) => user.userId === userIdStr)) {
        connectedUsers.push({ userId: userIdStr, socketId });
    }
};


const removeUser = (socketId) => {
    connectedUsers = connectedUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
    const userIdStr = userId.toString(); // Convert userId to string for comparison
    console.log('Looking for user with ID:', userIdStr);
    console.log('Current connected users:', connectedUsers);
    return connectedUsers.find((user) => user.userId === userIdStr);
};


const setupIo = (socketIoInstance) => {
    io = socketIoInstance;

    io.on('connection', (socket) => {
        // console.log(`Socket ${socket.id} connected`);
        // console.log(`${connectedUsers.length}`);

        socket.on('register', (userId) => {
            addNewUser(userId, socket.id);
            console.log(".");
            console.log(".");
            console.log(".");
            console.log(`User ${userId} connected with socket ID ${socket.id}`);
            console.log(`Total clients connected: ${io.engine.clientsCount}`);
            console.log(connectedUsers);
        });

        // Handle the disconnecting event
        socket.on('disconnect', (reason) => {
            console.log("^");
            console.log("^");
            console.log("^");
            console.log(`Socket ${socket.id} disconnected due to ${reason}`);
            console.log(`Total clients connected: ${io.engine.clientsCount}`);
            removeUser(socket.id);
        });
    });
};

const getSocketIdForUser = (userId) => connectedUsers[userId];

module.exports = {
    setupIo,
    getSocketIdForUser,
    getUser,
};
