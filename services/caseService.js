const mongoose = require('mongoose');
const CaseModel = require('../models/caseModel');
const CategoryModel = require('../models/categoryModel');
const Task = require('../models/taskModel');

// Get all categories
const getCases = async () => {
    try {
        const cases = await CaseModel.find({})
            .sort({ createdAt: -1 })
            .populate('solicitorInCharge', 'username _id')
            .populate('clerkInCharge', 'username _id')
            .populate('category', 'categoryName _id')
            .exec();

        const sortedTasksCases = cases.map(caseItem => {
            caseItem.tasks = caseItem.tasks.sort((a, b) => a.order - b.order);
            // Or, to sort by creation date:
            // caseItem.tasks = caseItem.tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            return caseItem;
        });

        return sortedTasksCases;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getMyCases = async (id) => {
    try {
        const cases = await CaseModel.find({
            $or: [
                { solicitorInCharge: id },
                { clerkInCharge: id }
            ]
        })
            .sort({ createdAt: -1 })
            .populate('solicitorInCharge', 'username _id')
            .populate('clerkInCharge', 'username _id')
            .populate('category', 'categoryName _id')
            .exec();

        const sortedTasksCases = cases.map(caseItem => {
            caseItem.tasks = caseItem.tasks.sort((a, b) => a.order - b.order);
            // Or, to sort by creation date:
            // caseItem.tasks = caseItem.tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            return caseItem;
        });

        return sortedTasksCases;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getCase = async (id) => {
    // Check id format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Case not found');
    }
    // Find case by id
    try {
        const caseItem = await CaseModel.findById(id)
            .populate('solicitorInCharge', 'username _id')
            .populate('clerkInCharge', 'username _id')
            .populate('category', 'categoryName _id')
            .exec();

        caseItem.tasks = caseItem.tasks.sort((a, b) => a.order - b.order);

        if (!caseItem) {
            throw new Error('Case not found');
        }

        return caseItem;
    } catch (error) {
        throw new Error(error.message);
    }
};

const createCase = async (body) => {
    try {
        const {
            categoryId,
            matterName,
            fileReference,
            solicitorInCharge,
            clerkInCharge,
            clients,
            fieldValues
        } = body;
        // check id format
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new Error('Invalid category ID');
        }
        if (!mongoose.Types.ObjectId.isValid(solicitorInCharge)) {
            throw new Error('Invalid solicitor ID');
        }
        if (!mongoose.Types.ObjectId.isValid(clerkInCharge)) {
            throw new Error('Invalid clerk ID');
        }

        const category = await CategoryModel.findById(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }
        // Map the field values to the template fields
        const fields = category.fields.map((templateField, index) => {
            const value = fieldValues[index] || '';
            return {
                name: templateField.name,
                type: templateField.type,
                value: value // Include the value in the field object
            };
        });

        // Create new tasks with unique IDs
        const tasks = category.tasks.map(task => {
            return {
                ...task.toObject(),  // Copy the task object
                _id: new mongoose.Types.ObjectId(),  // Generate a new unique ObjectId
            };
        });

        const newCase = new CaseModel({
            matterName,
            fileReference,
            solicitorInCharge,
            clerkInCharge,
            clients,
            category: categoryId,
            fields: fields,
            tasks: tasks
        });
        const caseItem = await newCase.save();
        return caseItem;
    } catch (error) {
        throw new Error(error.message);
    }
}

const addTask = async (caseId, body) => {
    try {
        // Validate the case ID
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            throw new Error('Invalid case ID');
        }
        // Retrieve the case document
        const caseDocument = await CaseModel.findById(caseId);
        if (!caseDocument) {
            throw new Error('Case not found');
        }
        // Define the new task
        const newTask = {
            description: body.description,
            initiationDate: body.initiationDate ? new Date(body.initiationDate) : null,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            reminder: body.reminder ? new Date(body.reminder) : null,
            remark: body.remark,
            status: body.status || 'Awaiting Initiation',
            order: body.order || 0
        };
        caseDocument.tasks.push(newTask);
        await caseDocument.save();
        return newTask;
    } catch (error) {
        console.error('Error adding task:', error);
        throw new Error('Error adding task');
    }
}

const updateCase = async (id, body) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid case ID');
        }

        const caseItem = await CaseModel.findById(id);
        if (!caseItem) {
            throw new Error('Case not found');
        }

        const originalStatus = caseItem.status; // Save original status before update

        caseItem.matterName = body.matterName || caseItem.matterName;
        caseItem.fileReference = body.fileReference || caseItem.fileReference;
        caseItem.solicitorInCharge = body.solicitorInCharge || caseItem.solicitorInCharge;
        caseItem.clerkInCharge = body.clerkInCharge || caseItem.clerkInCharge;
        caseItem.clients = body.clients || caseItem.clients;
        caseItem.category = body.category || caseItem.category;
        caseItem.fields = body.fields || caseItem.fields;
        caseItem.tasks = body.tasks || caseItem.tasks;
        caseItem.status = body.status || caseItem.status;

        await caseItem.save();
        return { updatedCase: caseItem, originalStatus };
    } catch (error) {
        console.error('Error updating case:', error);
        throw new Error('Error updating case');
    }
}

// update one of the task from a case
const updateTask = async (caseId, taskId, body) => {
    try {
        // Check if the case ID is valid
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            throw new Error('Invalid case ID');
        }

        // Retrieve the case document
        const caseDocument = await CaseModel.findById(caseId);
        if (!caseDocument) {
            throw new Error('Case not found');
        }

        // Find the task within the case
        const task = caseDocument.tasks.id(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        // Update the task properties
        task.description = body.description || task.description;
        task.initiationDate = body.initiationDate || task.initiationDate;
        task.dueDate = body.dueDate || task.dueDate;
        task.reminder = body.reminder || task.reminder;
        task.remark = body.remark || task.remark;
        task.status = body.status || task.status;
        task.order = body.order || task.order;

        // Save the case document to update the embedded task
        await caseDocument.save();

        return task;
    } catch (error) {
        console.error('Failed to update task:', error);
        throw new Error('Error updating task');
    }
}

const updateTasksOrder = async (caseId, tasks) => {
    try {
        // Check if the case ID is valid
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            throw new Error('Invalid case ID');
        }
        const bulkOperations = tasks.map(task => ({
            updateOne: {
                filter: { 'tasks._id': task._id }, // Find the task by its _id
                update: { 'tasks.$.order': task.order }, // Update the order
            }
        }));

        // Execute bulkWrite operation on the CaseModel
        const newOrderTasks = await CaseModel.bulkWrite(bulkOperations);

        return newOrderTasks;
    } catch (error) {
        console.error('Failed to update tasks order:', error);
        throw new Error('Error updating tasks order');
    }
}

const getTasksByStaff = async (userId) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid user ID');
        }
        // Find all cases where the solicitorInCharge or clerkInCharge matches the given userId
        const cases = await CaseModel.find({
            $or: [
                { solicitorInCharge: userId },
                { clerkInCharge: userId }
            ]
        })
            .populate('solicitorInCharge', 'username _id')
            .populate('clerkInCharge', 'username _id')
            .populate('category', 'categoryName _id')
            .exec();

        // Extract all tasks from the retrieved cases
        const tasks = cases.reduce((acc, caseItem) => {
            const caseTasks = caseItem.tasks.map(task => ({
                ...task.toObject(),
                caseId: caseItem._id, // Attach the caseId to each task
                clients: caseItem.clients, // Attach the clients to each task
                matterName: caseItem.matterName, // Attach the matterName to each task
            }));
            return acc.concat(caseTasks);
        }, []);

        return tasks;
    } catch (error) {
        throw new Error(error.message);
    }
};



const deleteTask = async (caseId, taskId) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            throw new Error('Invalid case ID');
        }

        const caseDocument = await CaseModel.findById(caseId);
        if (!caseDocument) {
            throw new Error('Case not found');
        }

        // Remove the task from the array using pull
        caseDocument.tasks.pull({ _id: taskId });  // Assuming taskId is the correct and valid ObjectId
        await caseDocument.save();

        return { caseDocument };
    } catch (error) {
        console.error('Failed to delete task:', error);
        throw new Error('Error deleting task');
    }
}

// const checkTaskDueDates = async () => {
//     const currentDate = new Date();

//     // Find all cases that have tasks
//     const cases = await CaseModel.find({ "tasks.dueDate": { $exists: true } });

//     cases.forEach(caseDocument => {
//         caseDocument.tasks.forEach(async (task) => {
//             // Check if the task is due within the next 24 hours and has not been notified yet
//             if (task.dueDate && task.dueDate <= new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)) {

//                 // Example: Send notification only if task status is 'Awaiting Initiation' (or define other logic)
//                 if (task.status === 'Pending') {
//                     emitNotification(`Task "${task.description}" for case "${caseDocument._id}" is due soon!`);

//                     // Optionally update task status or any other logic
//                     // task.status = 'Due Soon';
//                 }
//             }
//         });

//         // Save the updated case with modified task statuses if needed
//         caseDocument.markModified('tasks'); // Mark the tasks array as modified for Mongoose
//         caseDocument.save();
//     });
// };

// Schedule the cron job to run every minute
// cron.schedule('* * * * *', () => {
//     console.log('Checking task due dates within case documents...');
//     checkTaskDueDates();
// });

module.exports = {
    getCases,
    getMyCases,
    getCase,
    createCase,
    updateCase,
    updateTasksOrder,
    addTask,
    updateTask,
    getTasksByStaff,
    deleteTask
};
