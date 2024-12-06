const CaseModel = require('../models/caseModel');
const mongoose = require('mongoose');

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

// const getCaseAnalysis = async () => {
//     try {
//         const currentMonthStart = new Date();
//         currentMonthStart.setDate(1);
//         currentMonthStart.setHours(0, 0, 0, 0);

//         const currentMonthEnd = new Date();
//         currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
//         currentMonthEnd.setDate(0);
//         currentMonthEnd.setHours(23, 59, 59, 999);

//         // 1. Current active cases
//         const activeCases = await CaseModel.countDocuments({ status: 'Active' });

//         // 2. Cases created this month
//         const casesThisMonth = await CaseModel.countDocuments({
//             createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
//         });

//         const casesClosedThisMonth = await CaseModel.countDocuments({
//             closedAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
//         });

//         // 3. Cases handled/created by each staff (solicitorInCharge, clerkInCharge) this month
//         const casesByStaff = await CaseModel.aggregate([
//             // 1. Filter cases created this month
//             {
//                 $match: {
//                     createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
//                 },
//             },
//             // 2. Unwind both solicitor and clerk into separate entries
//             {
//                 $project: {
//                     staff: [
//                         '$solicitorInCharge',
//                         '$clerkInCharge',
//                     ], // Both solicitor and clerk are included in the 'staff' array
//                 },
//             },
//             {
//                 $unwind: '$staff', // Unwind the 'staff' array, this will create two entries for each case: one for solicitor and one for clerk
//             },
//             // 3. Group by staff and count the number of cases for each
//             {
//                 $group: {
//                     _id: '$staff', // Group by staff ID (solicitor or clerk)
//                     count: { $sum: 1 }, // Count the number of cases each staff is handling
//                 },
//             },
//             // 4. Lookup staff details (username)
//             {
//                 $lookup: {
//                     from: 'users', // User collection
//                     localField: '_id', // The staff ID
//                     foreignField: '_id', // The field in the 'User' collection
//                     as: 'staffDetails',
//                 },
//             },
//             // 5. Project the final output
//             {
//                 $project: {
//                     staffName: { $arrayElemAt: ['$staffDetails.username', 0] }, // Extract staff name
//                     count: 1, // Include case count
//                 },
//             },
//             // 6. Sort by staff name (optional)
//             {
//                 $sort: {
//                     staffName: 1, // Sort in ascending order of staff names
//                 },
//             },
//         ]);


//         // 4. Cases by category for the current month
//         const casesByCategory = await CaseModel.aggregate([
//             {
//                 $match: {
//                     createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
//                 },
//             },
//             {
//                 $group: {
//                     _id: '$category',
//                     count: { $sum: 1 },
//                 },
//             },
//             {
//                 $lookup: {
//                     from: 'categories',
//                     localField: '_id',
//                     foreignField: '_id',
//                     as: 'categoryDetails',
//                 },
//             },
//             {
//                 $unwind: '$categoryDetails',
//             },
//             {
//                 $project: {
//                     categoryName: '$categoryDetails.categoryName',
//                     count: 1,
//                 },
//             },
//         ]);

//         // 5. Cases over time (Monthly) based on createdAt
//         const casesOverTime = await CaseModel.aggregate([
//             {
//                 $group: {
//                     _id: {
//                         year: { $year: '$createdAt' },
//                         month: { $month: '$createdAt' },
//                     },
//                     count: { $sum: 1 },
//                 },
//             },
//             {
//                 $sort: {
//                     '_id.year': 1,
//                     '_id.month': 1,
//                 },
//             },
//         ]);

//         const casesTurnaroundTime = await CaseModel.aggregate([
//             // 1. Filter only closed cases
//             { $match: { closedAt: { $ne: null } } },

//             // 2. Calculate turnaround time in days
//             {
//                 $project: {
//                     year: { $year: '$closedAt' }, // Extract year from closedAt
//                     month: { $month: '$closedAt' }, // Extract month from closedAt
//                     turnaroundTime: {
//                         $divide: [
//                             { $subtract: ['$closedAt', '$createdAt'] },
//                             1000 * 60 * 60 * 24, // Convert milliseconds to days
//                         ],
//                     },
//                 },
//             },

//             // 3. Group by year and month, gather all turnaround times for each month
//             {
//                 $group: {
//                     _id: { year: '$year', month: '$month' }, // Group by year and month
//                     turnaroundTimes: { $push: '$turnaroundTime' }, // Gather all turnaround times for the month
//                 },
//             },

//             // 4. Sort by year and month to maintain chronological order
//             {
//                 $sort: {
//                     '_id.year': 1,
//                     '_id.month': 1,
//                 },
//             },

//             // 5. Calculate the min, max, median, Q1, and Q3 for each month
//             {
//                 $project: {
//                     month: '$_id.month',
//                     year: '$_id.year',
//                     turnaroundTimes: 1,
//                     _id: 0,

//                     // Calculate min, max
//                     min: { $min: '$turnaroundTimes' },
//                     max: { $max: '$turnaroundTimes' },

//                     // Calculate median (ensure index is an integer)
//                     median: {
//                         $let: {
//                             vars: {
//                                 sorted: { $sortArray: { input: '$turnaroundTimes', sortBy: 1 } },
//                                 size: { $size: '$turnaroundTimes' },
//                             },
//                             in: {
//                                 $cond: {
//                                     if: { $eq: [{ $mod: ['$$size', 2] }, 0] }, // Even number of elements
//                                     then: {
//                                         $avg: [
//                                             { $arrayElemAt: ['$$sorted', { $floor: { $divide: ['$$size', 2] } }] },
//                                             { $arrayElemAt: ['$$sorted', { $floor: { $subtract: [{ $divide: ['$$size', 2] }, 1] } }] },
//                                         ],
//                                     },
//                                     else: { 
//                                         $arrayElemAt: ['$$sorted', { $floor: { $divide: ['$$size', 2] } }] },
//                                 },
//                             },
//                         },
//                     },

//                     // Calculate Q1 (ensure index is an integer)
//                     q1: {
//                         $let: {
//                             vars: {
//                                 sorted: { $sortArray: { input: '$turnaroundTimes', sortBy: 1 } },
//                                 size: { $size: '$turnaroundTimes' },
//                             },
//                             in: {
//                                 $arrayElemAt: ['$$sorted', { $floor: { $divide: ['$$size', 4] } }],
//                             },
//                         },
//                     },

//                     // Calculate Q3 (ensure index is an integer)
//                     q3: {
//                         $let: {
//                             vars: {
//                                 sorted: { $sortArray: { input: '$turnaroundTimes', sortBy: 1 } },
//                                 size: { $size: '$turnaroundTimes' },
//                             },
//                             in: {
//                                 $arrayElemAt: ['$$sorted', { $floor: { $multiply: [{ $divide: ['$$size', 4] }, 3] } }],
//                             },
//                         },
//                     },
//                 },
//             },
//         ]);        

//         return {
//             activeCases,
//             casesThisMonth,
//             casesClosedThisMonth,
//             casesByStaff,
//             casesByCategory,
//             casesOverTime,
//             casesTurnaroundTime
//         };
//     } catch (error) {
//         console.error('Error fetching case analysis:', error);
//         throw error;
//     }
// };

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


module.exports = {
    getStatistics,
    getCaseAnalysis,

};

