// routes/fieldsRoutes.js
const express = require('express');
const fieldController = require('../controllers/fieldController');

const router = express.Router();

// Create a new field
router.post('/createField', fieldController.createField);

// Get all fields
router.get('/getAllFields', fieldController.getAllFields);

// Get a field by ID
router.get('/getField/:id', fieldController.getFieldById);

// Update a field
router.patch('/updateField/:id', fieldController.updateField);

// Delete a field
router.delete('/deleteField/:id', fieldController.deleteField);

module.exports = router;
