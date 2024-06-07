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


//Case Routes
router.post('/case', (req, res) => {
    res.json({ mssg: "Create a new case" });
});


//Category Routes
router.get('/getCategories', getCategories);
router.get('/getCategory/:id', getCategory);
router.post('/category', createCategory);
router.patch('/updateCategory/:id', updateCategory);
router.patch('/category/:categoryId/updateField/:fieldId', updateField)
router.patch('/category/:categoryId/updateTask/:taskId', updateTask)
router.delete('/deleteCategory/:id', deleteCategory);


//Case template Routes
// router.get('/template', getCaseTemplates);
// router.get('/template/:id', getCaseTemplate);
// router.post('/template', createCaseTemplate);
// router.patch('/template/:id', updateCaseTemplate);
// router.delete('/template/:id', deleteCaseTemplate);


//Phase template Routes
// router.get('/template/phase', getPhaseTemplates);
// router.get('/template/phase/:id', getPhaseTemplate);
// router.post('/template/phase', createPhaseTemplate);
// router.patch('/template/phase/:id', updatePhaseTemplate);
// router.delete('/template/phase/:id', deletePhaseTemplate);


module.exports = router;