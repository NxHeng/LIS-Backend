require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const createRoutes = require('./routes/create');

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
app.use('/create', createRoutes);

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