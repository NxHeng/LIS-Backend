require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const caseRoutes = require('./routes/caseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const documentRoutes = require('./routes/documentRoutes');

//express app
const app = express();
const cors = require('cors');

//middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

//routes
app.use('/user', userRoutes);
app.use('/create', categoryRoutes);
app.use('/case', caseRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/announcement', announcementRoutes);
app.use('/document', documentRoutes);

//connect to db
mongoose.connect(process.env.MONGO_URI)
    .then((result) => {
        console.log('Connected to db');
        //listen for requests
        app.listen(process.env.PORT, () => {
            console.log('Server is running on port 5000');
        });
    })
    .catch((err) => {
        console.log(err);
    });