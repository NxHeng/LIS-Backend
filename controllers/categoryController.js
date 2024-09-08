const categoryService = require('../services/categoryService');

// Get all categories
const getCategories = async (req, res) => {
    try {
        const categories = await categoryService.getCategories();
        res.status(200).json(categories);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get a single category
const getCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await categoryService.getCategory(id);
        res.status(200).json(category);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

// Create a new category
const createCategory = async (req, res) => {
    const { categoryName, fields, tasks } = req.body;
    try {
        const categoryTemplate = await categoryService.createCategory(categoryName, fields, tasks);
        res.status(200).json(categoryTemplate);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a category
const updateCategory = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
        const category = await categoryService.updateCategory(id, updateData);
        res.status(200).json(category);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a field
const updateField = async (req, res) => {
    const { categoryId, fieldId } = req.params;
    const updateData = req.body;
    try {
        const category = await categoryService.updateField(categoryId, fieldId, updateData);
        res.status(200).json(category);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a task
const updateTask = async (req, res) => {
    const { categoryId, taskId } = req.params;
    const updateData = req.body;
    try {
        const category = await categoryService.updateTask(categoryId, taskId, updateData);
        res.status(200).json(category);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a category
const deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await categoryService.deleteCategory(id);
        res.status(200).json(category);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
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
