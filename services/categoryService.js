const mongoose = require('mongoose');
const CategoryModel = require('../models/categoryModel');

// Get all categories
const getCategories = async () => {
    try {
        const categories = await CategoryModel.find({}).sort({ createdAt: -1 }).populate('fields').populate('tasks');
        return categories;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Get a single category
const getCategory = async (id) => {
    // Check id format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Category not found');
    }
    // Find category by id
    const category = await CategoryModel.findById(id).populate('fields').populate('tasks');
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
};

// Create a new category
const createCategory = async (categoryName, fields, tasks) => {
    try {
        const categoryModel = await CategoryModel.create({ categoryName, fields, tasks });
        return categoryModel;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Update a category
const updateCategory = async (id, updateData) => {
    // Check id format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Category not found');
    }
    // Find category by id and update
    const category = await CategoryModel.findOneAndUpdate({ _id: id }, updateData, { new: true });
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
};

// Update a field
const updateField = async (categoryId, fieldId, updateData) => {
    // Check id format
    if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(fieldId)) {
        throw new Error('Category not found');
    }
    // Use $set to update specific field within the array
    const update = {
        $set: { 'fields.$[elem].type': updateData.type }
    };

    // Array filter to target the correct field
    const options = {
        arrayFilters: [{ 'elem._id': fieldId }],
        new: true
    };
    const category = await CategoryModel.findByIdAndUpdate(categoryId, update, options);
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
}

// Update a task
const updateTask = async (categoryId, taskId, updateData) => {
    // Check id format
    if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw new Error('Category not found');
    }
    // Use $set to update specific task within the array
    const update = {
        $set: { 'tasks.$[elem].description': updateData.description }
    };

    // Array filter to target the correct task
    const options = {
        arrayFilters: [{ 'elem._id': taskId }],
        new: true
    };
    const category = await CategoryModel.findByIdAndUpdate(categoryId, update, options);
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
}

// Delete a category
const deleteCategory = async (id) => {
    // Check id format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Category not found');
    }
    // Find category by id and delete
    const category = await CategoryModel.findOneAndDelete({ _id: id });
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
}

module.exports = {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    updateField,
    updateTask,
    deleteCategory
};
