require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const socketUtils = require('./utils/socketUtils');

const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const caseRoutes = require('./routes/caseRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const linkRoutes = require('./routes/linkRoutes');
const notificationSettingRoutes = require('./routes/notificationSettingRoutes');

const { initializeCronJob } = require('./cron/cronJobs');

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://lis-frontend-ten.vercel.app'] // Production frontend URL
  : ['http://localhost:5173', 'http://localhost:5174']; // Local development URLs

//express app
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        // credentials: true
        transports: ['websocket', 'polling'],
    }
});


//middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(req.path, req.method);
    req.io = io;
    next();
});

//routes
app.use('/user', userRoutes);
app.use('/create', categoryRoutes);
app.use('/case', caseRoutes);
app.use('/field', fieldRoutes);
app.use('/task', taskRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/announcement', announcementRoutes);
app.use('/document', documentRoutes);
app.use('/notification', notificationRoutes);
app.use('/link', linkRoutes);
app.use('/notificationSetting', notificationSettingRoutes);

// After socket setup
socketUtils.setupIo(io);

// Initialize the cron job with the io instance
initializeCronJob(io);


//connect to db
mongoose.connect(process.env.MONGO_URI)
    .then((result) => {
        console.log('Connected to db');
        //listen for requests
        server.listen(process.env.PORT, () => {
            console.log('Server is running on port 5000');
        });
    })
    .catch((err) => {
        console.log(err);
    });