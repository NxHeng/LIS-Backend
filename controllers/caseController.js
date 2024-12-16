const caseService = require('../services/caseService');
const notificationService = require('../services/notificationService');
const notificationSettingService = require('../services/notificationSettingService');

// Get all cases
const getCases = async (req, res) => {
    try {
        const cases = await caseService.getCases();
        res.status(200).json(cases);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getMyCases = async (req, res) => {
    const id = req.params.id;
    try {
        const cases = await caseService.getMyCases(id);
        res.status(200).json(cases);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const getCasesByClient = async (req, res) => {
    const ic = req.params.ic;
    try {
        const cases = await caseService.getCasesByClient(ic);
        res.status(200).json(cases);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

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
        //Fetch notifcation settings for new case
        const sendNotification = await notificationSettingService.shouldSendNotification('new_case');
        if (sendNotification) {
            // Notify solicitor and clerk
            const { solicitorInCharge, clerkInCharge, matterName } = caseItem;
            const usersNotified = [solicitorInCharge, clerkInCharge];
            let notificationType = 'new_case';
            let notificationMessage = `New case "${matterName}" has been created!`;
            try {
                await notificationService.createAndEmitNotification(req.io, {
                    type: notificationType,
                    message: notificationMessage,
                    caseId: caseItem,
                    usersNotified
                });
            } catch (notifyError) {
                console.error('Notification failed:', notifyError.message);
            }
        }
        const sendEmail = await notificationSettingService.shouldSendEmail('new_case');
        if (sendEmail) {
            try {
                await caseService.sendNewCaseEmail(caseItem._id);
            } catch (error) {
                console.error('Email notification failed:', error.message);
            }
        }

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
        const { updatedCase, originalStatus } = await caseService.updateCase(id, caseData);

        // Notify solicitor and clerk of the case update
        const { solicitorInCharge, clerkInCharge, matterName, status } = updatedCase;
        const usersNotified = [solicitorInCharge, clerkInCharge];


        // default to detail_update
        let notificationType = 'detail_update';
        let notificationMessage = `Details for case "${matterName}" have been updated!`;
        // Check if the status changed to 'closed'
        if (status !== originalStatus && status === 'closed') {
            notificationType = 'status_change';
            notificationMessage = `Case "${matterName}" has been closed!`;
            // update the closedAt field and save the case
            updatedCase.closedAt = new Date();
            await updatedCase.save();
        }
        const sendNotification = await notificationSettingService.shouldSendNotification(notificationType);
        if (sendNotification) {
            try {
                await notificationService.createAndEmitNotification(req.io, {
                    type: notificationType,
                    message: notificationMessage,
                    caseId: updatedCase,
                    usersNotified
                });
            } catch (notifyError) {
                console.error('Notification failed:', notifyError.message);
            }
        }
        const sendEmail = await notificationSettingService.shouldSendEmail(notificationType);
        if (sendEmail && notificationType === 'detail_update') {
            try {
                await caseService.sendUpdateDetailEmail(updatedCase._id);
            } catch (error) {
                console.error('Email notification failed:', error.message);
            }
        } else if (sendEmail && notificationType === 'status_change') {
            try {
                await caseService.sendCaseClosedEmail(updatedCase._id);
            } catch (error) {
                console.error('Email notification failed:', error.message);
            }
        }

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

        // if task changed to completed, update the completedAt field
        // if (taskData.status === 'Completed') {
        //     updatedTask.completedAt = new Date();
        //     await updatedTask.save();
        // }

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send({ message: error.message });
    }
}

const updateTasksOrder = async (req, res) => {
    const { caseId } = req.params;
    const tasksData = req.body;
    try {
        if (!caseId) {
            return res.status(400).send({ message: "Missing case ID" });
        }
        if (!tasksData || !Array.isArray(tasksData)) {
            return res.status(400).json({ message: 'Invalid task data' });
        }
        const updatedTasks = await caseService.updateTasksOrder(caseId, tasksData);
        res.status(200).json(updatedTasks);
    } catch (error) {
        console.error('Error updating tasks order:', error);
        res.status(500).send({ message: error.message });
    }
}

const getTasksByStaff = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) {
            return res.status(400).send({ message: "Missing staff ID" });
        }
        const tasks = await caseService.getTasksByStaff(id);
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error getting tasks:', error);
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

const addLog = async (req, res) => {
    const { caseId } = req.params;
    const logData = req.body;
    try {
        if (!caseId) {
            return res.status(400).send({ message: "Missing case ID" });
        }
        const newLog = await caseService.addLog(caseId, logData);
        res.status(201).json(newLog);
    } catch (error) {
        console.error('Error adding log:', error);
        res.status(500).send({ message: error.message });
    }
}

const editLog = async (req, res) => {
    const { caseId, logId } = req.params;
    const logData = req.body;
    try {
        if (!caseId || !logId) {
            return res.status(400).send({ message: "Missing case ID or log ID" });
        }
        const updatedLog = await caseService.editLog(caseId, logId, logData);
        res.status(200).json(updatedLog);
    } catch (error) {
        console.error('Error updating log:', error);
        res.status(500).send({ message: error.message });
    }
}

const deleteLog = async (req, res) => {
    const { caseId, logId } = req.params;
    try {
        if (!caseId || !logId) {
            return res.status(400).send({ message: "Missing case ID or log ID" });
        }
        const deletedLog = await caseService.deleteLog(caseId, logId);
        res.status(200).json(deletedLog);
    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).send({ message: error.message });
    }
}

module.exports = {
    getCases,
    getMyCases,
    getCasesByClient,
    getCase,
    createCase,
    addTask,
    updateCase,
    updateTask,
    updateTasksOrder,
    getTasksByStaff,
    deleteTask,
    addLog,
    editLog,
    deleteLog
};
