const CaseModel = require('../models/caseModel');

const getStatistics = async () => {
    const totalCases = await CaseModel.countDocuments();
    
    const activeCases = await CaseModel.countDocuments({ status: 'Active' });
    const closedCases = await CaseModel.countDocuments({ status: 'closed' });

    // Aggregate total number of non-completed tasks
    const activeCasesList = await CaseModel.find({ status: 'Active' }, 'tasks');
    const totalTasks = activeCasesList.reduce((acc, caseItem) => {
        const nonCompletedTasks = caseItem.tasks.filter(task => task.status !== 'Completed');
        return acc + nonCompletedTasks.length;
    }, 0);

    const casesByCategory = await CaseModel.aggregate([
        { $match: { status: 'Active' } },
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


    return {
        totalCases,
        activeCases,
        closedCases,
        casesByCategory,
        totalTasks,
    };
};

module.exports = { getStatistics };
