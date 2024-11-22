const express = require('express');
const {
    getCases,
    getMyCases,
    getCase,
    createCase,
    addTask,
    updateCase,
    updateTask,
    updateTasksOrder,
    getTasksByStaff,
    getCasesByClient,
    // getTasksByClient,
    deleteTask
} = require('../controllers/caseController');

const router = express.Router();

//Case Routes
router.get('/getCases', getCases);
router.get('/getMyCases/:id', getMyCases);
router.get('/getCasesByClient/:ic', getCasesByClient);
router.get('/getCase/:id', getCase);
router.post('/createCase', createCase);
router.post('/addTask/:caseId', addTask);
router.patch('/updateTask/:caseId/:taskId', updateTask);
router.patch('/updateTasksOrder/:caseId', updateTasksOrder);
router.get('/getTasksByStaff/:id', getTasksByStaff);
router.delete('/deleteTask/:caseId/:taskId', deleteTask);
router.patch('/updateCase/:id', updateCase);
// router.delete('/deleteCase/:id', );
// router.get('/getTasksByClient/:id', getTasksByClient);

module.exports = router;