const CaseModel = require('../models/caseModel');

const getStatistics = async (_id, role) => {

    const userId = _id;
    // Filter based on the user role
    const filter = {
        $or: [
            { solicitorInCharge: userId },
            { clerkInCharge: userId }
        ]
    };


    // Total cases for the user
    const totalCases = await CaseModel.countDocuments(filter);

    // Active cases for the user
    const activeCases = await CaseModel.countDocuments({ ...filter, status: 'Active' });

    // Closed cases for the user
    const closedCases = await CaseModel.countDocuments({ ...filter, status: 'closed' });

    // Aggregate total number of non-completed tasks
    const userCases = await CaseModel.find({ ...filter, status: 'Active' }, 'tasks');
    const totalTasks = userCases.reduce((acc, caseItem) => acc + caseItem.tasks.length, 0);

    const pendingTasks = userCases.reduce((acc, caseItem) => {
        const count = caseItem.tasks.filter(task => task.status === 'Pending').length;
        return acc + count;
    }, 0);

    const dueTasks = userCases.reduce((acc, caseItem) => {
        const count = caseItem.tasks.filter(task => task.status !== 'Completed' && task.dueDate && new Date(task.dueDate) <= new Date()).length;
        return acc + count;
    }, 0);

    const completedTasks = userCases.reduce((acc, caseItem) => {
        const count = caseItem.tasks.filter(task => task.status === 'Completed').length;
        return acc + count;
    }, 0);

    // New tasks (Awaiting Initiation)
    const newTasks = userCases.reduce((acc, caseItem) => {
        const count = caseItem.tasks.filter(task => task.status === 'Awaiting Initiation').length;
        return acc + count;
    }, 0);

    // Active cases grouped by category
    const casesByCategory = await CaseModel.aggregate([
        { $match: { ...filter, status: 'Active' } },
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'categoryDetails'
            }
        },
        {
            $unwind: "$categoryDetails"
        },
        {
            $project: {
                categoryName: "$categoryDetails.categoryName",
                count: 1
            }
        }
    ]);

    // Calculate progress (percentage)
    const completedPercentage = (completedTasks / totalTasks) * 100;
    const pendingPercentage = (pendingTasks / totalTasks) * 100;
    const newTasksPercentage = (newTasks / totalTasks) * 100;

    return {
        totalCases,
        activeCases,
        closedCases,
        casesByCategory,
        totalTasks,
        pendingTasks,
        dueTasks,
        completedTasks,
        newTasks,   
        completedPercentage,
        pendingPercentage,
        newTasksPercentage,

    };
};

module.exports = { getStatistics };

