// services/fieldsService.js
const Field = require('../models/fieldModel');
const mongoose = require('mongoose');

// Create a new field
const createField = async (fieldData) => {
    try {

        if (fieldData.type === undefined || fieldData.name === undefined) {
            throw new Error('Field type and name are required.');
        }

        fieldData.value = null;
        fieldData.tel = null;
        fieldData.email = null;
        fieldData.fax = null;
        fieldData.remarks = null;

        const field = new Field(fieldData);
        return await field.save();
    } catch (error) {
        console.error('Error creating field:', error);
        throw new Error('Failed to create field.');
    }
};

// Get all fields
const getAllFields = async () => {
    try {
        return await Field.find();
    } catch (error) {
        console.error('Error retrieving fields:', error);
        throw new Error('Failed to retrieve fields.');
    }
};

// Get a field by ID
const getFieldById = async (id) => {
    try {

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Field ID.');
        }

        const field = await Field.findById(id);

        if (!field) {
            throw new Error('Field not found.');
        }
        return field;
    } catch (error) {
        console.error('Error retrieving field by ID:', error);
        throw new Error('Failed to retrieve field by ID.');
    }
};

// Update a field
const updateField = async (id, updateData) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Field ID.');
        }

        if (updateData.type === undefined || updateData.name === undefined) {
            throw new Error('Field type and name are required.');
        }

        const updatedField = await Field.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updatedField) {
            throw new Error('Field not found for update.');
        }
        return updatedField;
    } catch (error) {
        console.error('Error updating field:', error);
        throw new Error('Failed to update field.');
    }
};

// Delete a field
const deleteField = async (id) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Field ID.');
        }

        const deletedField = await Field.findByIdAndDelete(id);
        if (!deletedField) {
            throw new Error('Field not found for deletion.');
        }
        return deletedField;
    } catch (error) {
        console.error('Error deleting field:', error);
        throw new Error('Failed to delete field.');
    }
};

module.exports = {
    createField,
    getAllFields,
    getFieldById,
    updateField,
    deleteField,
};
