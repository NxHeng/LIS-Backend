const cron = require('node-cron');
const Case = require('../models/caseModel');
const notificationService = require('../services/notificationService');
const moment = require('moment-timezone'); // Use moment-timezone for time zone handling

// Set your local time zone (for example, Malaysia)
const localTimeZone = 'Asia/Kuala_Lumpur';

// Declare the io variable
let io;

// Function to initialize the cron job
const initializeCronJob = (socketIoInstance) => {
    io = socketIoInstance; // Set the io instance

    // Schedule cron job to run every minute (or adjust as needed)
    const taskNotificationJob = cron.schedule('* * * * *', async () => {
        console.log('Cron job running at:', moment().tz(localTimeZone).format());
        try {
            // Fetch all cases with their tasks
            const cases = await Case.find().populate('tasks');

            // Get the current time in the local time zone
            const currentLocalTime = moment().tz(localTimeZone);

            for (const caseItem of cases) {
                const { solicitorInCharge, clerkInCharge } = caseItem;
                const usersNotified = [solicitorInCharge, clerkInCharge];

                let caseModified = false; // Track if the case has been modified

                for (const task of caseItem.tasks) {
                    // Convert the task dates to the local time zone
                    const taskDueDateLocal = moment(task.dueDate).tz(localTimeZone);
                    const taskReminderLocal = moment(task.reminder).tz(localTimeZone);

                    // Check if the task is due within the next 24 hours
                    if (task.dueDate && taskDueDateLocal.isSameOrBefore(currentLocalTime.add(1, 'day')) && !task.dueDateNotificationSent) {
                        // Send deadline notification
                        await notificationService.createAndEmitNotification(io, {
                            type: 'deadline',
                            message: `Task "${task.description}" is due tomorrow!`,
                            taskId: task._id,
                            caseId: caseItem,
                            usersNotified
                        });

                        // Update task to mark notification as sent
                        console.log(task.dueDateNotificationSent);
                        task.dueDateNotificationSent = true;
                        caseModified = true;
                    }

                    // Check if the reminder is within the next 24 hours
                    if (task.reminder && taskReminderLocal.isSameOrBefore(currentLocalTime.add(1, 'day')) && !task.reminderNotificationSent) {
                        // Send reminder notification
                        await notificationService.createAndEmitNotification(io, {
                            type: 'reminder',
                            message: `Reminder for task "${task.description}"`,
                            taskId: task._id,
                            caseId: caseItem,
                            usersNotified
                        });
  
                        // Update task to mark notification as sent
                        console.log(task.reminderNotificationSent);
                        task.reminderNotificationSent = true;
                        caseModified = true;
                    }
                }
                // Save the parent Case document if it has been modified
                if (caseModified) {
                    await caseItem.save(); // Save the entire case, including the modified tasks
                }
            }
        } catch (error) {
            console.error('Error running cron job:', error);
        }
    });

    // Start the cron job
    taskNotificationJob.start();
};

module.exports = {
    initializeCronJob
};
