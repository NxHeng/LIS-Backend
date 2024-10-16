const cron = require('node-cron');
const Case = require('../models/caseModel');
const notificationService = require('../services/notificationService');
const moment = require('moment');

// Schedule cron job to run every day at midnight
const taskNotificationJob = cron.schedule('* * * * *', async () => {
    try {
        // const now = new Date();
        const cases = await Case.find().populate('tasks');

        for (const caseItem of cases) {
            const { solicitorInCharge, clerkInCharge, matterName } = caseItem;
            const usersNotified = [solicitorInCharge, clerkInCharge];

            for (const task of caseItem.tasks) {
                if (task.dueDate && moment(task.dueDate).isSameOrBefore(moment().add(1, 'day'))) {
                    // Send deadline notification
                    await notificationService.createAndEmitNotification(req.io, {
                        type: 'deadline',
                        message: `Task is due soon!`,
                        taskId: task._id,
                        caseId: caseItem._id,
                        usersNotified
                    });
                }

                if (task.reminder && moment(task.reminder).isSameOrBefore(moment().add(1, 'day'))) {
                    // Send reminder notification
                    await notificationService.createAndEmitNotification(req.io, {
                        type: 'reminder',
                        message: `Reminder for task "${task.description}"`,
                        taskId: task._id,
                        caseId: caseItem._id,
                        usersNotified
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error running cron job:', error);
    }
});

module.exports = {
    taskNotificationJob
};
