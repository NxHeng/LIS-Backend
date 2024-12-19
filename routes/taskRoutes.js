// routes/fieldsRoutes.js
const express = require('express');
const taskController = require('../controllers/taskController');

const router = express.Router();

// Create a new field
router.post('/createTask', taskController.createTask);

// Get all fields
router.get('/getAllTasks', taskController.getAllTasks);

// Get a field by ID
router.get('/getTask/:id', taskController.getTaskById);

// Update a field
router.patch('/updateTask/:id', taskController.updateTask);

// Delete a field
router.delete('/deleteTask/:id', taskController.deleteTask);

module.exports = router;
