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
    getAllTasks,
    getCasesByClient,
    deleteTask,
    addLog,
    editLog,
    deleteLog
} = require('../controllers/caseController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

//Case Routes
router.get('/getCases', authMiddleware, getCases);
router.get('/getMyCases/:id', authMiddleware, getMyCases);
router.get('/getCasesByClient/:ic', authMiddleware, getCasesByClient);
router.get('/getCase/:id', authMiddleware, getCase);
router.post('/createCase', authMiddleware, createCase);
router.post('/addTask/:caseId', authMiddleware, addTask);
router.patch('/updateTask/:caseId/:taskId', authMiddleware, updateTask);
router.patch('/updateTasksOrder/:caseId', authMiddleware, updateTasksOrder);
router.get('/getTasksByStaff/:id', authMiddleware, getTasksByStaff);
router.get('/getAllTasks', authMiddleware, getAllTasks);
router.delete('/deleteTask/:caseId/:taskId', authMiddleware, deleteTask);
router.patch('/updateCase/:id', authMiddleware, updateCase);
router.post('/addLog/:caseId', authMiddleware, addLog);
router.patch('/editLog/:caseId/:logId', authMiddleware, editLog);
router.delete('/deleteLog/:caseId/:logId', authMiddleware, deleteLog);

// router.delete('/deleteCase/:id', );
module.exports = router;