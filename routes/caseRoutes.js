const express = require('express');
const {
    getCases,
    getCase,
    createCase,
    addTask,
    updateCase,
    updateTask,
    deleteTask
} = require('../controllers/caseController');

const router = express.Router();

//Case Routes
router.get('/getCases', getCases);
router.get('/getCase/:id', getCase);
router.post('/createCase', createCase);
router.post('/addTask/:caseId', addTask);
router.patch('/updateTask/:caseId/:taskId', updateTask);
router.delete('/deleteTask/:caseId/:taskId', deleteTask);
router.patch('/updateCase/:id', updateCase);
// router.delete('/deleteCase/:id', );

module.exports = router;