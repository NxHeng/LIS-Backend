const caseService = require('../services/caseService');

// Get all cases
const getCases = async (req, res) => {
    try {
        const cases = await caseService.getCases();
        res.status(200).json(cases);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get a single case
const getCase = async (req, res) => {
    const id = req.params.id;
    try {
        const caseItem = await caseService.getCase(id);
        res.status(200).json(caseItem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createCase = async (req, res) => {
    try {
        const caseItem = await caseService.createCase(req.body);
        res.status(201).json(caseItem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const addTask = async (req, res) => {
    const { caseId } = req.params;
    const taskData = req.body;
    try {
        if (!caseId) {
            return res.status(400).send({ message: "Missing case ID" });
        }
        const newTask = await caseService.addTask(caseId, taskData);
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).send({ message: error.message });
    }
}

const updateCase = async (req, res) => {
    const { id } = req.params;
    const caseData = req.body;
    try {
        if (!id) {
            return res.status(400).send({ message: "Missing case ID" });
        }
        const updatedCase = await caseService.updateCase(id, caseData);
        res.status(200).json(updatedCase);
    } catch (error) {
        console.error('Error updating case:', error);
        res.status(500).send({ message: error.message });
    }
}

// update one of the task from a case
const updateTask = async (req, res) => {
    const { caseId, taskId } = req.params;
    const taskData = req.body;
    try {
        if (!caseId || !taskId) {
            return res.status(400).send({ message: "Missing case ID or task ID" });
        }
        const updatedTask = await caseService.updateTask(caseId, taskId, taskData);
        res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send({ message: error.message });
    }
}

const deleteTask = async (req, res) => {
    const { caseId, taskId } = req.params;
    try {
        if (!caseId || !taskId) {
            return res.status(400).send({ message: "Missing case ID or task ID" });
        }
        const deletedTask = await caseService.deleteTask(caseId, taskId);
        res.status(200).json(deletedTask);
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send({ message: error.message });
    }
}

module.exports = {
    getCases,
    getCase,
    createCase,
    addTask,
    updateCase,
    updateTask,
    deleteTask
};
