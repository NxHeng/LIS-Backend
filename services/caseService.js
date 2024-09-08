const mongoose = require('mongoose');
const CaseModel = require('../models/caseModel');
const CategoryModel = require('../models/categoryModel');

// Get all categories
const getCases = async () => {
    try {
        const cases = await CaseModel.find({})
            .sort({ createdAt: -1 })
            .populate('solicitorInCharge', 'username _id')
            .populate('clerkInCharge', 'username _id')
            .populate('category', 'categoryName _id')
            .exec();

        return cases;
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

        return cases;
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

        const newCase = new CaseModel({
            matterName,
            fileReference,
            solicitorInCharge,
            clerkInCharge,
            clients,
            category: categoryId,
            fields: fields,
            tasks: category.tasks
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
            status: body.status || 'Awaiting Initiation'
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
        return caseItem;
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

        // Save the case document to update the embedded task
        await caseDocument.save();

        return task;
    } catch (error) {
        console.error('Failed to update task:', error);
        throw new Error('Error updating task');
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
                caseId: caseItem._id // Attach the caseId to each task
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

module.exports = {
    getCases,
    getMyCases,
    getCase,
    createCase,
    updateCase,
    addTask,
    updateTask,
    getTasksByStaff,
    deleteTask
};
