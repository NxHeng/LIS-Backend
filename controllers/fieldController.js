// controllers/fieldsController.js
const fieldsService = require('../services/fieldService');

// Create a new field
const createField = async (req, res) => {
    const data = req.body;
    try {
        const field = await fieldsService.createField(data);
        res.status(201).json(field);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all fields
const getAllFields = async (req, res) => {
    try {
        const fields = await fieldsService.getAllFields();
        res.status(200).json(fields);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a field by ID
const getFieldById = async (req, res) => {
    const { id } = req.params;
    try {
        const field = await fieldsService.getFieldById(id);
        if (!field) {
            return res.status(404).json({ error: 'Field not found' });
        }
        res.status(200).json(field);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a field
const updateField = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const updatedField = await fieldsService.updateField(id, data);
        if (!updatedField) {
            return res.status(404).json({ error: 'Field not found' });
        }
        res.status(200).json(updatedField);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a field
const deleteField = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedField = await fieldsService.deleteField(id);
        if (!deletedField) {
            return res.status(404).json({ error: 'Field not found' });
        }
        res.status(200).json({ message: 'Field deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createField,
    getAllFields,
    getFieldById,
    updateField,
    deleteField,

};