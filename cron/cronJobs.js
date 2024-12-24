const cron = require('node-cron');
const Case = require('../models/caseModel');
const userService = require('../services/userService');
const notificationService = require('../services/notificationService');
const notificationSettingService = require('../services/notificationSettingService');
const caseService = require('../services/caseService');
const moment = require('moment-timezone'); // Use moment-timezone for time zone handling

// Set your local time zone 
const localTimeZone = 'Asia/Kuala_Lumpur';

// Declare the io variable
let io;

// Function to initialize the cron job
const initializeCronJob = (socketIoInstance) => {
    io = socketIoInstance; // Set the io instance

    // Schedule cron job to run every minute (or adjust as needed)
    // The cron job will run every 15 minutes between 8 AM and 5 PM (*/15 8-17 * * *)
    const taskNotificationJob = cron.schedule('* * * * *', async () => {
        console.log('Task Notification Job running at:', moment().tz(localTimeZone).format());
        try {
            // Check notification and email settings
            const sendDeadlineNotification = await notificationSettingService.shouldSendNotification('deadline');
            const sendReminderNotification = await notificationSettingService.shouldSendNotification('reminder');
            const sendDeadlineEmail = await notificationSettingService.shouldSendEmail('deadline');
            const sendReminderEmail = await notificationSettingService.shouldSendEmail('reminder');

            if (sendDeadlineNotification || sendReminderNotification || sendDeadlineEmail || sendReminderEmail) {
                // Fetch all cases with tasks requiring notifications
                const cases = await Case.find({
                    $or: [
                        { 'tasks.dueDateNotificationSent': false },
                        { 'tasks.reminderNotificationSent': false }
                    ]
                });

                // Get the current time in the local time zone
                const currentLocalTime = moment().tz(localTimeZone);

                // Fetch all admin users
                const adminUsers = await userService.getAdminList();
                const adminIds = adminUsers.map(admin => admin._id);
                const normalizeUserId = (id) => id?.toString().trim();

                for (const caseItem of cases) {
                    const { solicitorInCharge, clerkInCharge } = caseItem;
                    // Normalize and deduplicate user IDs
                    const usersNotifiedSet = new Set(
                        [solicitorInCharge, clerkInCharge, ...adminIds].map(normalizeUserId)
                    );
                    const usersNotified = Array.from(usersNotifiedSet).filter(Boolean);

                    let caseModified = false; // Track if the case has been modified

                    for (const task of caseItem.tasks) {
                        try {
                            // Convert task dates to local time
                            const taskDueDateLocal = moment(task.dueDate).tz(localTimeZone);
                            const taskReminderLocal = moment(task.reminder).tz(localTimeZone);

                            // Deadline notification and email logic
                            if (task.dueDate &&
                                taskDueDateLocal.isSameOrBefore(currentLocalTime.clone().add(1, 'day')) &&
                                !task.dueDateNotificationSent
                            ) {
                                if (sendDeadlineNotification) {
                                    await notificationService.createAndEmitNotification(io, {
                                        type: 'deadline',
                                        message: `Task "${task.description}" is due tomorrow!`,
                                        taskId: task._id,
                                        caseId: caseItem,
                                        usersNotified
                                    });
                                }

                                if (sendDeadlineEmail) {
                                    await caseService.sendDeadlineEmail(caseItem._id, task);
                                }

                                task.dueDateNotificationSent = true;
                                caseModified = true;
                            }

                            // Reminder notification and email logic
                            if (task.reminder &&
                                taskReminderLocal.isSameOrBefore(currentLocalTime.clone().add(1, 'day')) &&
                                !task.reminderNotificationSent
                            ) {
                                if (sendReminderNotification) {
                                    await notificationService.createAndEmitNotification(io, {
                                        type: 'reminder',
                                        message: `Reminder for task "${task.description}"`,
                                        taskId: task._id,
                                        caseId: caseItem,
                                        usersNotified
                                    });
                                }

                                if (sendReminderEmail) {
                                    await caseService.sendReminderEmail(caseItem._id, task);
                                }

                                task.reminderNotificationSent = true;
                                caseModified = true;
                            }
                        } catch (taskError) {
                            console.error(`Error processing task ${task._id}:`, taskError);
                        }
                    }

                    // Save the parent Case document if it has been modified
                    if (caseModified) {
                        try {
                            await caseItem.save();
                        } catch (saveError) {
                            console.error(`Error saving case ${caseItem._id}:`, saveError);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error running cron job:', error);
        }
    });

    // taskDueJob that runs only once every day at 08:00 AM
    const taskDueJob = cron.schedule('0 8 * * *', async () => {
        console.log('Task Due Job running at:', moment().tz(localTimeZone).format());
        try {
            await caseService.getAllTasksAndUpdateOverdue();
        } catch (error) {
            console.error('Error in overdue task cron job:', error);
        }
    });


    // Start the cron job
    taskNotificationJob.start();
    taskDueJob.start();
};

module.exports = {
    initializeCronJob
};
