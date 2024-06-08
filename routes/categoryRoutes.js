const express = require('express');
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    updateField,
    updateTask,
    deleteCategory
} = require('../controllers/categoryController');

const router = express.Router();

//Category Routes
router.get('/getCategories', getCategories);
router.get('/getCategory/:id', getCategory);
router.post('/category', createCategory);
router.patch('/updateCategory/:id', updateCategory);
router.patch('/category/:categoryId/updateField/:fieldId', updateField)
router.patch('/category/:categoryId/updateTask/:taskId', updateTask)
router.delete('/deleteCategory/:id', deleteCategory);

module.exports = router;