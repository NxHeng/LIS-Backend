const CaseModel = require('../models/caseModel');
const mongoose = require('mongoose');

const getStatistics = async (_id, role) => {

    const userId = _id;
    // Filter based on the user role if not admin
    const filter = role === 'admin' ? {} : {
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

const getCaseAnalysis = async (filters) => {
    try {
        const { category, month, year } = filters || {};
        console.log(category, month, year);

        // Validate month and year
        if (!month || !year) throw new Error('Month and Year are required');

        // Adjust the date calculation for zero-based months (Jan=0, Dec=11)
        const currentMonthStart = new Date(year, month - 1, 1); // First day of the month
        const currentMonthEnd = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month

        const categoryFilter = category ? { category: new mongoose.Types.ObjectId(category) } : {};

        // Active cases
        const activeCases = await CaseModel.countDocuments({
            status: 'Active',
            ...categoryFilter,
        });

        // Cases created this month
        const casesThisMonth = await CaseModel.countDocuments({
            createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
            ...categoryFilter,
        });

        // Cases closed this month
        const casesClosedThisMonth = await CaseModel.countDocuments({
            closedAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
            ...categoryFilter,
        });

        // Tasks completed this month
        const tasksCompletedThisMonthResult = await CaseModel.aggregate([
            { $match: { ...categoryFilter, closedAt: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
            { $project: { tasks: 1 } },
            { $unwind: '$tasks' },
            { $match: { 'tasks.status': 'Completed' } },
            { $group: { _id: null, totalCompletedTasks: { $sum: 1 } } }
        ]);
        // Extract the totalCompletedTasks as a number or default to 0
        const tasksCompletedThisMonth = tasksCompletedThisMonthResult.length > 0
            ? tasksCompletedThisMonthResult[0].totalCompletedTasks
            : 0;

        // Cases by staff
        const casesByStaff = await CaseModel.aggregate([
            { $match: { createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd }, ...categoryFilter } },
            { $project: { staff: ['$solicitorInCharge', '$clerkInCharge'] } },
            { $unwind: '$staff' },
            { $group: { _id: '$staff', count: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staffDetails' } },
            { $project: { staffName: { $arrayElemAt: ['$staffDetails.username', 0] }, count: 1 } }
        ]);

        // Cases by category
        const casesByCategory = await CaseModel.aggregate([
            { $match: { createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd }, ...categoryFilter } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryDetails' } },
            { $unwind: '$categoryDetails' },
            { $project: { categoryName: '$categoryDetails.categoryName', count: 1 } }
        ]);

        // Cases over time
        const casesOverTime = await CaseModel.aggregate([
            { $match: { ...categoryFilter } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Cases turnaround time
        const casesTurnaroundTime = await CaseModel.aggregate([
            {
                $match: {
                    closedAt: { $ne: null },
                    ...categoryFilter,
                },
            },
            {
                $project: {
                    year: { $year: '$closedAt' },
                    month: { $month: '$closedAt' },
                    turnaroundTime: {
                        $divide: [
                            { $subtract: ['$closedAt', '$createdAt'] },
                            1000 * 60 * 60 * 24, // Convert milliseconds to days
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: { year: '$year', month: '$month' },
                    turnaroundTimes: { $push: '$turnaroundTime' },
                },
            },
            {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1,
                },
            },
            {
                $project: {
                    month: '$_id.month',
                    year: '$_id.year',
                    turnaroundTimes: 1,
                    min: { $min: '$turnaroundTimes' },
                    max: { $max: '$turnaroundTimes' },
                    median: {
                        $let: {
                            vars: {
                                sorted: { $sortArray: { input: '$turnaroundTimes', sortBy: 1 } },
                                size: { $size: '$turnaroundTimes' },
                            },
                            in: {
                                $cond: {
                                    if: { $eq: [{ $mod: ['$$size', 2] }, 0] },
                                    then: {
                                        $avg: [
                                            { $arrayElemAt: ['$$sorted', { $divide: ['$$size', 2] }] },
                                            { $arrayElemAt: ['$$sorted', { $subtract: [{ $divide: ['$$size', 2] }, 1] }] },
                                        ],
                                    },
                                    else: {
                                        $arrayElemAt: ['$$sorted', { $floor: { $divide: ['$$size', 2] } }],
                                    },
                                },
                            },
                        },
                    },
                    q1: {
                        $let: {
                            vars: {
                                sorted: { $sortArray: { input: '$turnaroundTimes', sortBy: 1 } },
                                size: { $size: '$turnaroundTimes' },
                            },
                            in: {
                                $arrayElemAt: ['$$sorted', { $floor: { $divide: ['$$size', 4] } }],
                            },
                        },
                    },
                    q3: {
                        $let: {
                            vars: {
                                sorted: { $sortArray: { input: '$turnaroundTimes', sortBy: 1 } },
                                size: { $size: '$turnaroundTimes' },
                            },
                            in: {
                                $arrayElemAt: ['$$sorted', { $floor: { $multiply: [{ $divide: ['$$size', 4] }, 3] } }],
                            },
                        },
                    },
                },
            },
        ]);


        return {
            activeCases,
            casesThisMonth,
            casesClosedThisMonth,
            tasksCompletedThisMonth,
            casesByStaff,
            casesByCategory,
            casesOverTime,
            casesTurnaroundTime,
        };

    } catch (error) {
        console.error('Error fetching case analysis:', error);
        throw error;
    }
};


const getOverallStatus = async () => {
    try {
        // Active Cases By Category
        const activeCasesByCategory = await CaseModel.aggregate([
            { $match: { status: 'Active' } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryDetails' } },
            { $unwind: '$categoryDetails' },
            { $project: { categoryName: '$categoryDetails.categoryName', count: 1 } },
        ]);

        // Cases Initiated Overtime
        const casesInitiatedOvertime = await CaseModel.aggregate([
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            {
                $project: {
                    year: '$_id.year',
                    month: '$_id.month',
                    count: 1,
                },
            },
        ]);

        // Total Pending Tasks
        const activeCasesWithTasks = await CaseModel.find({ status: 'Active' }, 'tasks');
        const totalPendingTasks = activeCasesWithTasks.reduce((acc, caseItem) => {
            const count = caseItem.tasks.filter(task => task.status === 'Pending').length;
            return acc + count;
        }, 0);

        // Total Due Tasks
        const totalDueTasks = activeCasesWithTasks.reduce((acc, caseItem) => {
            const count = caseItem.tasks.filter(task => task.status !== 'Completed' && task.dueDate && new Date(task.dueDate) <= new Date()).length;
            return acc + count;
        }, 0);

        // Total Active Cases
        const totalActiveCases = await CaseModel.countDocuments({ status: 'Active' });

        return {
            overview: {
                totalActiveCases,
                totalPendingTasks,
                totalDueTasks,
            },
            charts: {
                activeCasesByCategory, // Data for bar chart
                casesInitiatedOvertime, // Data for line graph
            },
        };
    } catch (error) {
        console.error('Error fetching overall status:', error);
        throw error;
    }
};

const getMonthlyReport = async (filters) => {
    try {
        const { category, month, year } = filters || {};

        if (!month || !year) throw new Error('Month and Year are required');

        const monthStart = new Date(year, month - 1, 1); // Start of the month
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999); // End of the month

        const categoryFilter = category ? { category: new mongoose.Types.ObjectId(category) } : {};

        // Cases by Category
        const casesByCategory = await CaseModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: monthStart, $lte: monthEnd },
                    ...categoryFilter,
                },
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryDetails',
                },
            },
            { $unwind: '$categoryDetails' },
            {
                $project: {
                    categoryName: '$categoryDetails.categoryName',
                    count: 1,
                },
            },
        ]);

        // Cases Initiated (Current Month)
        const casesInitiatedCurrentMonth = await CaseModel.countDocuments({
            createdAt: { $gte: monthStart, $lte: monthEnd },
            ...categoryFilter,
        });

        const casesHandledByStaff = await CaseModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: monthStart, $lte: monthEnd },
                    ...categoryFilter, // Apply category filter if provided
                },
            },
            {
                $project: {
                    staff: ['$solicitorInCharge', '$clerkInCharge'], // Combine solicitor and clerk into an array
                    createdAt: 1,
                    closedAt: 1,
                    category: 1, // Include category ID
                },
            },
            { $unwind: '$staff' }, // Flatten the staff array
            {
                $group: {
                    _id: { staff: '$staff', category: '$category' }, // Group by staff and category
                    casesInCategory: { $sum: 1 }, // Count cases in each category for the staff
                    totalTurnaroundTime: {
                        $sum: {
                            $cond: [
                                { $and: ['$closedAt', '$createdAt'] },
                                { $subtract: ['$closedAt', '$createdAt'] },
                                0,
                            ],
                        },
                    }, // Sum turnaround time
                },
            },
            {
                $group: {
                    _id: '$_id.staff', // Group by staff
                    casesHandled: { $sum: '$casesInCategory' }, // Total cases handled by staff
                    avgTurnaroundTime: {
                        $avg: {
                            $cond: [
                                { $gt: ['$casesInCategory', 0] },
                                { $divide: ['$totalTurnaroundTime', '$casesInCategory'] },
                                0,
                            ],
                        },
                    }, // Average turnaround time
                    categories: {
                        $push: {
                            category: '$_id.category', // Category ID
                            count: '$casesInCategory', // Number of cases in the category
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'users', // Match staff with User collection
                    localField: '_id',
                    foreignField: '_id',
                    as: 'staffDetails',
                },
            },
            {
                $lookup: {
                    from: 'categories', // Match categories with Category collection
                    localField: 'categories.category',
                    foreignField: '_id',
                    as: 'categoryDetails',
                },
            },
            {
                $project: {
                    staffName: { $arrayElemAt: ['$staffDetails.username', 0] }, // Extract staff name
                    casesHandled: 1, // Total cases handled
                    avgTurnaroundTime: 1, // Average turnaround time
                    categories: {
                        $map: {
                            input: '$categories',
                            as: 'cat',
                            in: {
                                categoryName: {
                                    $arrayElemAt: [
                                        '$categoryDetails.categoryName',
                                        { $indexOfArray: ['$categoryDetails._id', '$$cat.category'] },
                                    ],
                                }, // Map category names
                                count: '$$cat.count', // Count of cases in the category
                            },
                        },
                    }, // Finalize category breakdown
                },
            },
            { $sort: { casesHandled: -1 } }, // Sort by total cases handled
        ]);


        // Cases turnaround time for a specific created month and year
        const casesTurnaroundTime = await CaseModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(year, month - 1, 1), // Start of the month
                        $lt: new Date(year, month, 1), // Before the start of the next month
                    },
                    closedAt: { $ne: null }, // Only consider cases that have been closed
                    ...categoryFilter, // Apply any additional filters
                },
            },
            {
                $project: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    turnaroundTime: {
                        $divide: [
                            { $subtract: ['$closedAt', '$createdAt'] },
                            1000 * 60 * 60 * 24, // Convert milliseconds to days
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null, // No grouping by month and year, as we only want stats for the given month/year
                    turnaroundTimes: { $push: '$turnaroundTime' },
                },
            },
            {
                $project: {
                    turnaroundTimes: 1,
                    min: { $min: '$turnaroundTimes' },
                    max: { $max: '$turnaroundTimes' },
                    median: {
                        $let: {
                            vars: {
                                sorted: { $sortArray: { input: '$turnaroundTimes', sortBy: 1 } },
                                size: { $size: '$turnaroundTimes' },
                            },
                            in: {
                                $cond: {
                                    if: { $eq: [{ $mod: ['$$size', 2] }, 0] },
                                    then: {
                                        $avg: [
                                            { $arrayElemAt: ['$$sorted', { $divide: ['$$size', 2] }] },
                                            { $arrayElemAt: ['$$sorted', { $subtract: [{ $divide: ['$$size', 2] }, 1] }] },
                                        ],
                                    },
                                    else: {
                                        $arrayElemAt: ['$$sorted', { $floor: { $divide: ['$$size', 2] } }],
                                    },
                                },
                            },
                        },
                    },
                    q1: {
                        $let: {
                            vars: {
                                sorted: { $sortArray: { input: '$turnaroundTimes', sortBy: 1 } },
                                size: { $size: '$turnaroundTimes' },
                            },
                            in: {
                                $arrayElemAt: ['$$sorted', { $floor: { $divide: ['$$size', 4] } }],
                            },
                        },
                    },
                    q3: {
                        $let: {
                            vars: {
                                sorted: { $sortArray: { input: '$turnaroundTimes', sortBy: 1 } },
                                size: { $size: '$turnaroundTimes' },
                            },
                            in: {
                                $arrayElemAt: ['$$sorted', { $floor: { $multiply: [{ $divide: ['$$size', 4] }, 3] } }],
                            },
                        },
                    },
                },
            },
        ]);

        // The `casesTurnaroundTime` output should now include the statistics for the specific month:
        const turnaroundStats = casesTurnaroundTime[0] || {};
        const outliers = turnaroundStats.turnaroundTimes
            ? turnaroundStats.turnaroundTimes.filter(
                (time) => time < turnaroundStats.q1 || time > turnaroundStats.q3
            )
            : [];

        return {
            barChart: casesByCategory,
            kpis: {
                casesInitiatedCurrentMonth,
            },
            table: casesHandledByStaff,
            boxPlot: {
                monthYear: `${month}-${year}`, // Include the selected month and year for display
                min: turnaroundStats.min,
                max: turnaroundStats.max,
                median: turnaroundStats.median,
                q1: turnaroundStats.q1,
                q3: turnaroundStats.q3,
                outliers: outliers,
            },
        };
    } catch (error) {
        console.error('Error fetching monthly report:', error);
        throw error;
    }
};

const getYearlyReport = async (filters) => {
    try {
        const { category, year } = filters || {};

        if (!year) throw new Error('Year is required');

        const yearStart = new Date(year, 0, 1); // Start of the year (January 1st)
        const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999); // End of the year (December 31st)

        const categoryFilter = category ? { category: new mongoose.Types.ObjectId(category) } : {};

        const casesInitiatedCurrentYear = await CaseModel.countDocuments({
            createdAt: { $gte: yearStart, $lte: yearEnd },
            ...categoryFilter,
        });

        // Cases by Category
        const casesByCategory = await CaseModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: yearStart, $lte: yearEnd },
                    ...categoryFilter,
                },
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryDetails',
                },
            },
            { $unwind: '$categoryDetails' },
            {
                $project: {
                    categoryName: '$categoryDetails.categoryName',
                    count: 1,
                },
            },
        ]);

        // Cases Initiated Over Time (by month)
        const casesInitiatedOvertime = await CaseModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: yearStart, $lte: yearEnd },
                    ...categoryFilter,
                },
            },
            {
                $group: {
                    _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1,
                },
            },
        ]);

        // Yearly Cases Handled by Staff
        const casesHandledByStaff = await CaseModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: yearStart, $lte: yearEnd },
                    ...categoryFilter, // Apply category filter if provided
                },
            },
            {
                $project: {
                    staff: ['$solicitorInCharge', '$clerkInCharge'], // Combine solicitor and clerk into an array
                    createdAt: 1,
                    closedAt: 1,
                    category: 1, // Include category ID
                },
            },
            { $unwind: '$staff' }, // Flatten the staff array
            {
                $group: {
                    _id: { staff: '$staff', category: '$category' }, // Group by staff and category
                    casesInCategory: { $sum: 1 }, // Count cases in each category for the staff
                    totalTurnaroundTime: {
                        $sum: {
                            $cond: [
                                { $and: ['$closedAt', '$createdAt'] },
                                { $subtract: ['$closedAt', '$createdAt'] },
                                0,
                            ],
                        },
                    }, // Sum turnaround time
                },
            },
            {
                $group: {
                    _id: '$_id.staff', // Group by staff
                    casesHandled: { $sum: '$casesInCategory' }, // Total cases handled by staff
                    avgTurnaroundTime: {
                        $avg: {
                            $cond: [
                                { $gt: ['$casesInCategory', 0] },
                                { $divide: ['$totalTurnaroundTime', '$casesInCategory'] },
                                0,
                            ],
                        },
                    }, // Average turnaround time
                    categories: {
                        $push: {
                            category: '$_id.category', // Category ID
                            count: '$casesInCategory', // Number of cases in the category
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'users', // Match staff with User collection
                    localField: '_id',
                    foreignField: '_id',
                    as: 'staffDetails',
                },
            },
            {
                $lookup: {
                    from: 'categories', // Match categories with Category collection
                    localField: 'categories.category',
                    foreignField: '_id',
                    as: 'categoryDetails',
                },
            },
            {
                $project: {
                    staffName: { $arrayElemAt: ['$staffDetails.username', 0] }, // Extract staff name
                    casesHandled: 1, // Total cases handled
                    avgTurnaroundTime: 1, // Average turnaround time
                    categories: {
                        $map: {
                            input: '$categories',
                            as: 'cat',
                            in: {
                                categoryName: {
                                    $arrayElemAt: [
                                        '$categoryDetails.categoryName',
                                        { $indexOfArray: ['$categoryDetails._id', '$$cat.category'] },
                                    ],
                                }, // Map category names
                                count: '$$cat.count', // Count of cases in the category
                            },
                        },
                    }, // Finalize category breakdown
                },
            },
            { $sort: { casesHandled: -1 } }, // Sort by total cases handled
        ]);

        // Cases turnaround time for the specific year, grouped by month
        const casesTurnaroundTime = await CaseModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: yearStart, // Start of the year
                        $lte: yearEnd, // End of the year
                    },
                    closedAt: { $ne: null }, // Only consider cases that have been closed
                    ...categoryFilter, // Apply any additional filters
                },
            },
            {
                $project: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }, // Group by month
                    turnaroundTime: {
                        $divide: [
                            { $subtract: ['$closedAt', '$createdAt'] },
                            1000 * 60 * 60 * 24, // Convert milliseconds to days
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: { year: '$year', month: '$month' }, // Group by year and month
                    turnaroundTimes: { $push: '$turnaroundTime' }, // Collect all turnaround times for that month
                },
            },
            {
                $project: {
                    turnaroundTimes: 1,
                    min: { $min: '$turnaroundTimes' }, // Minimum turnaround time
                    max: { $max: '$turnaroundTimes' }, // Maximum turnaround time
                    median: {
                        $let: {
                            vars: {
                                sorted: { $sortArray: { input: '$turnaroundTimes', sortBy: 1 } },
                                size: { $size: '$turnaroundTimes' },
                            },
                            in: {
                                $cond: {
                                    if: { $eq: [{ $mod: ['$$size', 2] }, 0] },
                                    then: {
                                        $avg: [
                                            { $arrayElemAt: ['$$sorted', { $divide: ['$$size', 2] }] },
                                            { $arrayElemAt: ['$$sorted', { $subtract: [{ $divide: ['$$size', 2] }, 1] }] },
                                        ],
                                    },
                                    else: {
                                        $arrayElemAt: ['$$sorted', { $floor: { $divide: ['$$size', 2] } }],
                                    },
                                },
                            },
                        },
                    },
                    q1: {
                        $let: {
                            vars: {
                                sorted: { $sortArray: { input: '$turnaroundTimes', sortBy: 1 } },
                                size: { $size: '$turnaroundTimes' },
                            },
                            in: {
                                $arrayElemAt: ['$$sorted', { $floor: { $divide: ['$$size', 4] } }], // 25th percentile
                            },
                        },
                    },
                    q3: {
                        $let: {
                            vars: {
                                sorted: { $sortArray: { input: '$turnaroundTimes', sortBy: 1 } },
                                size: { $size: '$turnaroundTimes' },
                            },
                            in: {
                                $arrayElemAt: ['$$sorted', { $floor: { $multiply: [{ $divide: ['$$size', 4] }, 3] } }], // 75th percentile
                            },
                        },
                    },
                },
            },
            { $sort: { '_id.month': 1 } }, // Sort by month
        ]);

        // Process the turnaround times by month for the box plot
        const monthlyBoxPlot = casesTurnaroundTime.map((monthData) => {
            const { _id, turnaroundTimes, min, max, median, q1, q3 } = monthData;
            const outliers = turnaroundTimes.filter(
                (time) => time < q1 || time > q3
            );
            return {
                month: _id.month,
                min,
                max,
                median,
                q1,
                q3,
                outliers,
            };
        });

        return {
            kpis: {
                casesInitiatedCurrentYear,
            },
            barChart: casesByCategory,
            lineChart: casesInitiatedOvertime, // Cases initiated during the year
            table: casesHandledByStaff, // Staff cases handled during the year
            boxPlot: {
                year: `${year}`, // Include the selected year for display
                monthlyStats: monthlyBoxPlot, // Monthly turnaround time stats for the year
            },
        };
    } catch (error) {
        console.error('Error fetching yearly report:', error);
        throw error;
    }
};

module.exports = {
    getStatistics,
    getCaseAnalysis,
    getOverallStatus,
    getMonthlyReport,
    getYearlyReport,

};

