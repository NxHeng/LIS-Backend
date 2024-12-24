const mongoose = require('mongoose');
const CaseModel = require('../models/caseModel');
const CategoryModel = require('../models/categoryModel');
const Task = require('../models/taskModel');
const nodemailer = require('nodemailer');
const userService = require('./userService');
const moment = require('moment-timezone');

const localTimeZone = 'Asia/Kuala_Lumpur';

// Get all categories
const getCases = async () => {
    try {
        const cases = await CaseModel.find({})
            .sort({ createdAt: -1 })
            .populate('solicitorInCharge', 'username _id')
            .populate('clerkInCharge', 'username _id')
            .populate('category', 'categoryName _id')
            .populate('logs', 'logMessage _id')
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
            .populate('logs', 'logMessage _id')
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

const getCasesByClient = async (icNumber) => {
    try {
        const cases = await CaseModel.find({
            clients: {
                $elemMatch: { icNumber } // Match IC number in the clients array
            }
        })
            .sort({ createdAt: -1 }) // Sort by creation date
            .populate('solicitorInCharge', 'username _id') // Populate solicitorInCharge field
            .populate('clerkInCharge', 'username _id') // Populate clerkInCharge field
            .populate('category', 'categoryName _id') // Populate category field
            .lean() // Convert Mongoose document to plain JavaScript object
            .exec();

        // Filter, sort and select only required fields from tasks
        cases.forEach(caseItem => {
            caseItem.tasks = caseItem.tasks
                // .filter(task => task.status === 'Completed') // Only include completed tasks
                .sort((a, b) => a.order - b.order) // Sort by task order
                .map(task => ({
                    description: task.description,
                    status: task.status,
                    order: task.order
                })); // Map tasks to include only required fields
        });

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

        const category = await CategoryModel.findById(categoryId).populate('fields').populate('tasks');
        if (!category) {
            throw new Error('Category not found');
        }
        // Map the field values to the template fields
        const fields = category.fields.map((templateField, index) => {
            const body = fieldValues[index] || '';
            return {
                name: templateField.name,
                type: templateField.type,
                value: body.value,
                remarks: body.remarks,
                tel: body.tel,
                email: body.email,
                fax: body.fax
            };
        });
        console.log('fields:', fields);
        // Create new tasks with unique IDs with order from 0 to n
        let index = 0;
        const tasks = category.tasks.map(task => {
            return {
                ...task.toObject(),  // Copy the task object
                _id: new mongoose.Types.ObjectId(),  // Generate a new unique ObjectId
                status: 'Awaiting Initiation',  // Set the default status
                order: index++  // Set the order from 0 to n
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

        const caseItem = await CaseModel.findById(id)
            .populate('category')
            .populate('solicitorInCharge')
            .populate('clerkInCharge');

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

        // console.log('caseItem:', caseItem);
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

        // Check if the `dueDate` or `reminder` has been changed
        if (body.dueDate && body.dueDate !== task.dueDate?.toISOString()) {
            task.dueDate = body.dueDate;
            task.dueDateNotificationSent = false;
        }
        if (body.reminder && body.reminder !== task.reminder?.toISOString()) {
            task.reminder = body.reminder;
            task.reminderNotificationSent = false;
        }

        // Update other task properties
        task.description = body.description || task.description;
        task.initiationDate = body.initiationDate || task.initiationDate;
        task.remark = body.remark || task.remark;
        task.status = body.status || task.status;
        task.order = body.order || task.order;

        // if the task has been updated to status 'Completed', update the task's completedAt field
        console.log(task.status, task.completedAt);
        if (task.status === 'Completed' && task.completedAt === null) {
            task.completedAt = new Date();
            console.log('task.completedAt:', task.completedAt);
        } else if (task.status !== 'Completed') {
            task.completedAt = null;
        }
        console.log('task:', task);
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
        // Find all cases where the solicitorInCharge or clerkInCharge matches the given userId, and the case is not closed
        const cases = await CaseModel.find({
            $or: [{ solicitorInCharge: userId }, { clerkInCharge: userId }],
            status: { $ne: 'closed' }
        })
            .populate('solicitorInCharge', 'username _id')
            .populate('clerkInCharge', 'username _id')
            .populate('category', 'categoryName _id')
            .exec();

        // Extract and group tasks by matterId (or matterName)
        const tasksGroupedByMatter = cases.reduce((acc, caseItem) => {
            const caseTasks = caseItem.tasks.map(task => ({
                ...task.toObject(),
                caseId: caseItem._id, // Attach the caseId to each task
                clients: caseItem.clients, // Attach the clients to each task
                matterName: caseItem.matterName, // Attach the matterName to each task
            }));

            // Use caseId as the key for grouping, and include matterName in the group object
            if (!acc[caseItem._id]) {
                acc[caseItem._id] = {
                    matterName: caseItem.matterName, // Attach the matterName for display
                    tasks: [] // Initialize the tasks array
                };
            }
            acc[caseItem._id].tasks.push(...caseTasks);

            return acc;
        }, {});

        return tasksGroupedByMatter;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getAllTasks = async () => {
    try {
        // find all active cases and their tasks
        const cases = await CaseModel.find({ status: { $ne: 'closed' } })
            .populate('solicitorInCharge', 'username _id')
            .populate('clerkInCharge', 'username _id')
            .populate('category', 'categoryName _id')
            .exec();

        // Extract and group tasks by matterId (or matterName)
        const tasksGroupedByMatter = cases.reduce((acc, caseItem) => {
            const caseTasks = caseItem.tasks.map(task => ({
                ...task.toObject(),
                caseId: caseItem._id, // Attach the caseId to each task
                clients: caseItem.clients, // Attach the clients to each task
                matterName: caseItem.matterName, // Attach the matterName to each task
            }));

            // Use caseId as the key for grouping, and include matterName in the group object
            if (!acc[caseItem._id]) {
                acc[caseItem._id] = {
                    matterName: caseItem.matterName, // Attach the matterName for display
                    tasks: [] // Initialize the tasks array
                };
            }
            acc[caseItem._id].tasks.push(...caseTasks);

            return acc;
        }, {});

        return tasksGroupedByMatter;
    } catch (error) {
        throw new Error(error.message);
    }
};

const getAllTasksAndUpdateOverdue = async () => {
    try {
        // Fetch all active cases and their tasks
        const cases = await CaseModel.find({ status: { $ne: 'closed' } })
            .populate('solicitorInCharge', 'username _id')
            .populate('clerkInCharge', 'username _id')
            .populate('category', 'categoryName _id')
            .exec();

        const currentLocalTime = moment().tz(localTimeZone); // Get current time in the local time zone

        // Loop through cases and update overdue tasks
        for (const caseItem of cases) {
            let isCaseModified = false; // Track whether the case document is modified

            for (const task of caseItem.tasks) {
                const taskDueDateLocal = moment(task.dueDate).tz(localTimeZone); // Convert task due date to local time

                if (
                    task.status !== 'Overdue' && // Task is not already marked as overdue
                    task.dueDate && // Task has a due date
                    taskDueDateLocal.isBefore(currentLocalTime) // Task's due date is before the current local time
                ) {
                    task.status = 'Overdue'; // Update task status to overdue
                    isCaseModified = true; // Mark case as modified
                }
            }

            // Save the case only if it has been modified
            if (isCaseModified) {
                await caseItem.save();
            }
        }

        console.log('All overdue tasks have been updated.');
    } catch (error) {
        console.error('Error updating overdue tasks:', error.message);
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

const addLog = async (caseId, logData) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            throw new Error('Invalid case ID');
        }

        const updatedCase = await CaseModel.findByIdAndUpdate(
            caseId,
            {
                $push: {
                    logs: { logMessage: logData.logMessage, createdBy: logData.createdBy },
                },
            },
            { new: true }
        );

        if (!updatedCase) {
            throw new Error('Case not found');
        }

        return updatedCase;
    } catch (error) {
        console.error('Error adding log:', error);
        throw error;
    }
};


const editLog = async (caseId, logId, logMessage) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(caseId) || !mongoose.Types.ObjectId.isValid(logId)) {
            throw new Error('Invalid ID');
        }

        const caseItem = await CaseModel.findById(caseId);
        if (!caseItem) {
            throw new Error('Case not found');
        }

        const log = caseItem.logs.id(logId);
        if (!log) {
            throw new Error('Log not found');
        }

        log.message = logMessage;
        await caseItem.save();

        return caseItem;
    } catch (error) {
        console.error('Error editing log:', error);
        throw error;
    }
};


const deleteLog = async (caseId, logId) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(caseId) || !mongoose.Types.ObjectId.isValid(logId)) {
            throw new Error('Invalid ID');
        }

        const updatedCase = await CaseModel.findByIdAndUpdate(
            caseId,
            {
                $pull: { logs: { _id: logId } },
            },
            { new: true }
        );

        if (!updatedCase) {
            throw new Error('Case not found');
        }

        return updatedCase;
    } catch (error) {
        console.error('Error deleting log:', error);
        throw error;
    }
};

const sendNewCaseEmail = async (caseId) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            throw new Error('Invalid case ID');
        }
        // Get the case details
        const caseItem = await CaseModel.findById(caseId)
            .populate('solicitorInCharge', 'username email _id')
            .populate('clerkInCharge', 'username email _id')
            .populate('category', 'categoryName _id')
            .exec();
        // Send email to solicitorInCharge
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const caseDetailsUrl = `${process.env.FRONTEND_URL}/cases/details/${caseId}`;
        console.log('caseDetailsUrl:', caseDetailsUrl);
        console.log(process.env.EMAIL_USER);
        console.log(`${caseItem.solicitorInCharge.email}, ${caseItem.clerkInCharge.email}`);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: `${caseItem.solicitorInCharge.email}, ${caseItem.clerkInCharge.email}`,
            subject: 'New Case Created (Legal Information System)',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Legal Information System</h1>
                <p style="margin: 0;">New Case Created</p>
            </div>
            <div style="padding: 20px; line-height: 1.6; color: #333;">
                <p>Hello,</p>
                <p>
                    A new case titled "<strong>${caseItem.matterName}</strong>" has been created in the system.
                    The solicitor assigned to this case is <strong>${caseItem.solicitorInCharge.username}</strong>. While the clerk assigned is <strong>${caseItem.clerkInCharge.username}</strong>.
                    The case is under the category of <strong>${caseItem.category.categoryName}</strong>.
                </p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${caseDetailsUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
                        View Case Details
                    </a>
                </div>
                <p>If the button above does not work, please copy and paste the following link into your browser:</p>
                <p style="word-break: break-all; color: #4CAF50;">${caseDetailsUrl}</p>
                <p>
                    If you have any questions or require further assistance, please contact the system administrator.
                </p>
                <p>Thank you,<br>The Legal Information System Team</p>
            </div>
            <div style="background-color: #f4f4f4; color: #666; padding: 10px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Legal Information System. All Rights Reserved.</p>
            </div>
        </div>
    `,
        };

        return transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email: ", error);
            } else {
                console.log("Email sent: ", info.response);
            }
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending email');
    }
};

const sendUpdateDetailEmail = async (caseId) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            throw new Error('Invalid case ID');
        }
        // Get the case details
        const caseItem = await CaseModel.findById(caseId)
            .populate('solicitorInCharge', 'username email _id')
            .populate('clerkInCharge', 'username email _id')
            .populate('category', 'categoryName _id')
            .exec();

        // Fetch all admin users
        const adminUsers = await userService.getAdminList();
        const adminEmails = adminUsers.map(admin => admin.email);
        const normalizeEmail = (email) => email?.toLowerCase().trim();
        const usersNotifiedSet = new Set(
            [
                caseItem.solicitorInCharge?.email,
                caseItem.clerkInCharge?.email,
                ...adminEmails
            ].map(normalizeEmail)
        );
        const usersNotified = Array.from(usersNotifiedSet).filter(Boolean);

        // Send email to solicitorInCharge and clerkInCharge
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const caseDetailsUrl = `${process.env.FRONTEND_URL}/cases/details/${caseId}`;
        console.log('caseDetailsUrl:', caseDetailsUrl);
        console.log(process.env.EMAIL_USER);
        console.log(usersNotified.join(', '));

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: usersNotified.join(', '),
            subject: 'Case Details Updated (Legal Information System)',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Legal Information System</h1>
                <p style="margin: 0;">Case Details Updated</p>
            </div>
            <div style="padding: 20px; line-height: 1.6; color: #333;">
                <p>Hello,</p>
                <p>
                    The details for the case titled "<strong>${caseItem.matterName}</strong>" have been updated in the system.
                </p>
                <p>
                    Solicitor in Charge: <strong>${caseItem.solicitorInCharge.username}</strong><br>
                    Clerk in Charge: <strong>${caseItem.clerkInCharge.username}</strong><br>
                    Category: <strong>${caseItem.category?.categoryName || "N/A"}</strong>
                </p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${caseDetailsUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
                        View Updated Case Details
                    </a>
                </div>
                <p>If the button above does not work, please copy and paste the following link into your browser:</p>
                <p style="word-break: break-all; color: #4CAF50;">${caseDetailsUrl}</p>
                <p>
                    If you have any questions or require further assistance, please contact the system administrator.
                </p>
                <p>Thank you,<br>The Legal Information System Team</p>
            </div>
            <div style="background-color: #f4f4f4; color: #666; padding: 10px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Legal Information System. All Rights Reserved.</p>
            </div>
        </div>
    `,
        };

        return transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email: ", error);
            } else {
                console.log("Email sent: ", info.response);
            }
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending email');
    }
};

const sendCaseClosedEmail = async (caseId) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            throw new Error('Invalid case ID');
        }
        // Get the case details
        const caseItem = await CaseModel.findById(caseId)
            .populate('solicitorInCharge', 'username email _id')
            .populate('clerkInCharge', 'username email _id')
            .populate('category', 'categoryName _id')
            .exec();

        // Fetch all admin users
        const adminUsers = await userService.getAdminList();
        const adminEmails = adminUsers.map(admin => admin.email);
        const normalizeEmail = (email) => email?.toLowerCase().trim();
        const usersNotifiedSet = new Set(
            [
                caseItem.solicitorInCharge?.email,
                caseItem.clerkInCharge?.email,
                ...adminEmails
            ].map(normalizeEmail)
        );
        const usersNotified = Array.from(usersNotifiedSet).filter(Boolean);

        // Send email to solicitorInCharge and clerkInCharge
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const caseDetailsUrl = `${process.env.FRONTEND_URL}/cases/details/${caseId}`;
        console.log('caseDetailsUrl:', caseDetailsUrl);
        console.log(process.env.EMAIL_USER);
        console.log(usersNotified.join(', '));

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: usersNotified.join(', '),
            subject: `Case Closed (Legal Information System)`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background-color: #D32F2F; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Legal Information System</h1>
                <p style="margin: 0;">Case Closed</p>
            </div>
            <div style="padding: 20px; line-height: 1.6; color: #333;">
                <p>Hello,</p>
                <p>
                    The case titled "<strong>${caseItem.matterName}</strong>" has been marked as <strong>Closed</strong>.
                </p>
                <p>
                    Solicitor in Charge: <strong>${caseItem.solicitorInCharge.username}</strong><br>
                    Clerk in Charge: <strong>${caseItem.clerkInCharge.username}</strong><br>
                    Category: <strong>${caseItem.category?.categoryName || "N/A"}</strong>
                </p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${caseDetailsUrl}" style="display: inline-block; padding: 10px 20px; background-color: #D32F2F; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
                        View Case Details
                    </a>
                </div>
                <p>If the button above does not work, please copy and paste the following link into your browser:</p>
                <p style="word-break: break-all; color: #D32F2F;">${caseDetailsUrl}</p>
                <p>
                    If you have any questions or require further assistance, please contact the system administrator.
                </p>
                <p>Thank you,<br>The Legal Information System Team</p>
            </div>
            <div style="background-color: #f4f4f4; color: #666; padding: 10px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Legal Information System. All Rights Reserved.</p>
            </div>
        </div>
    `,
        };

        return transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email: ", error);
            } else {
                console.log("Email sent: ", info.response);
            }
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending email');
    }
};

const sendDeadlineEmail = async (caseId, task) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            throw new Error('Invalid case ID');
        }
        // Get the case details
        const caseItem = await CaseModel.findById(caseId)
            .populate('solicitorInCharge', 'username email _id')
            .populate('clerkInCharge', 'username email _id')
            .populate('category', 'categoryName _id')
            .exec();

        // Fetch all admin users
        const adminUsers = await userService.getAdminList();
        const adminEmails = adminUsers.map(admin => admin.email);
        const normalizeEmail = (email) => email?.toLowerCase().trim();
        const usersNotifiedSet = new Set(
            [
                caseItem.solicitorInCharge?.email,
                caseItem.clerkInCharge?.email,
                ...adminEmails
            ].map(normalizeEmail)
        );
        const usersNotified = Array.from(usersNotifiedSet).filter(Boolean);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const caseDetailsUrl = `${process.env.FRONTEND_URL}/cases/details/${caseId}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: usersNotified.join(', '),
            subject: `Task Deadline Reminder (Legal Information System)`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Legal Information System</h1>
                <p style="margin: 0;">Task Deadline Approaching</p>
            </div>
            <div style="padding: 20px; line-height: 1.6; color: #333;">
                <p>Hello,</p>
                <p>
                    The task "<strong>${task.description}</strong>" in the case "<strong>${caseItem.matterName}</strong>" is due soon.
                </p>
                <p>
                    Task Description: <strong>${task.description}</strong><br>
                    Due Date: <strong>${task.dueDate}</strong><br>
                </p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${caseDetailsUrl}" style="display: inline-block; padding: 10px 20px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
                        View Case Details
                    </a>
                </div>
                <p>If the button above does not work, please copy and paste the following link into your browser:</p>
                <p style="word-break: break-all; color: #FF9800;">${caseDetailsUrl}</p>
                <p>
                    If you have any questions or require further assistance, please contact the system administrator.
                </p>
                <p>Thank you,<br>The Legal Information System Team</p>
            </div>
            <div style="background-color: #f4f4f4; color: #666; padding: 10px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Legal Information System. All Rights Reserved.</p>
            </div>
        </div>
    `,
        };

        return transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email: ", error);
            } else {
                console.log("Email sent: ", info.response);
            }
        }
        );
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending email');
    }
};

const sendReminderEmail = async (caseId, task) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            throw new Error('Invalid case ID');
        }
        // Get the case details
        const caseItem = await CaseModel.findById(caseId)
            .populate('solicitorInCharge', 'username email _id')
            .populate('clerkInCharge', 'username email _id')
            .populate('category', 'categoryName _id')
            .exec();

        // Fetch all admin users
        const adminUsers = await userService.getAdminList();
        const adminEmails = adminUsers.map(admin => admin.email);
        const normalizeEmail = (email) => email?.toLowerCase().trim();
        const usersNotifiedSet = new Set(
            [
                caseItem.solicitorInCharge?.email,
                caseItem.clerkInCharge?.email,
                ...adminEmails
            ].map(normalizeEmail)
        );
        const usersNotified = Array.from(usersNotifiedSet).filter(Boolean);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const caseDetailsUrl = `${process.env.FRONTEND_URL}/cases/details/${caseId}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: usersNotified.join(', '),
            subject: `Task Deadline Reminder (Legal Information System)`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Legal Information System</h1>
                <p style="margin: 0;">Task Reminder</p>
            </div>
            <div style="padding: 20px; line-height: 1.6; color: #333;">
                <p>Hello,</p>
                <p>
                    You have a reminder for the task "<strong>${task.description}</strong>" in the case "<strong>${caseItem.matterName}</strong>".
                </p>
                <p>
                    Task Description: <strong>${task.description}</strong><br>
                    Due Date: <strong>${task.dueDate}</strong><br>
                    Reminder Date: <strong>${task.reminder}</strong><br>
                </p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${caseDetailsUrl}" style="display: inline-block; padding: 10px 20px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
                        View Case Details
                    </a>
                </div>
                <p>If the button above does not work, please copy and paste the following link into your browser:</p>
                <p style="word-break: break-all; color: #FF9800;">${caseDetailsUrl}</p>
                <p>
                    If you have any questions or require further assistance, please contact the system administrator.
                </p>
                <p>Thank you,<br>The Legal Information System Team</p>
            </div>
            <div style="background-color: #f4f4f4; color: #666; padding: 10px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Legal Information System. All Rights Reserved.</p>
            </div>
        </div>
    `,
        };

        return transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email: ", error);
            } else {
                console.log("Email sent: ", info.response);
            }
        }
        );
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending email');
    }
};


module.exports = {
    getCases,
    getMyCases,
    getCasesByClient,
    getCase,
    createCase,
    updateCase,
    updateTasksOrder,
    addTask,
    updateTask,
    getTasksByStaff,
    getAllTasks,
    deleteTask,
    addLog,
    editLog,
    deleteLog,
    sendNewCaseEmail,
    sendUpdateDetailEmail,
    sendCaseClosedEmail,
    sendDeadlineEmail,
    sendReminderEmail,
    getAllTasksAndUpdateOverdue,
};
