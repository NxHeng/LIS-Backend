const Task = require('../models/taskModel');
const mongoose = require('mongoose');

// Create a new task
const createTask = async (taskData) => {
    try {

        if (taskData.description === undefined) {
            throw new Error('Task description is required.');
        }

        taskData.initiationDate = null;
        taskData.dueDate = null;
        taskData.reminder = null;
        taskData.remark = null;
        taskData.status = null;
        // taskData.order = null;吗
        taskData.dueDateNotificationSent = null;
        taskData.reminderNotificationSent = null;
        taskData.completedAt = null;

        const task = new Task(taskData);
        return await task.save();
    } catch (error) {
        console.error('Error creating task:', error);
        throw new Error('Failed to create task.');
    }
};

// Get all tasks
const getAllTasks = async () => {
    try {
        return await Task.find();
    } catch (error) {
        console.error('Error retrieving tasks:', error);
        throw new Error('Failed to retrieve tasks.');
    }
};

// Get a task by ID
const getTaskById = async (id) => {
    try {

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Task ID.');
        }

        const task = await Task.findById(id);

        if (!task) {
            throw new Error('Task not found.');
        }
        return task;
    } catch (error) {
        console.error('Error retrieving task by ID:', error);
        throw new Error('Failed to retrieve task by ID.');
    }
};

// Update a task
const updateTask = async (id, updateData) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Task ID.');
        }

        if (updateData.description === undefined) {
            throw new Error('Task description is required.');
        }

        const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updatedTask) {
            throw new Error('Task not found for update.');
        }
        return updatedTask;
    } catch (error) {
        console.error('Error updating task:', error);
        throw new Error('Failed to update task.');
    }
};

// Delete a task
const deleteTask = async (id) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Task ID.');
        }

        const deletedTask = await Task.findByIdAndDelete(id);
        if (!deletedTask) {
            throw new Error('Task not found for deletion.');
        }
        return deletedTask;
    } catch (error) {
        console.error('Error deleting task:', error);
        throw new Error('Failed to delete task.');
    }
};

module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
};
