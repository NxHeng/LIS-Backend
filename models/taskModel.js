const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const taskSchema = new Schema({
    description: {
        type: String,
        required: true
    },
    initiationDate: {
        type: Date,
        default: null,
    },
    dueDate: {
        type: Date,
        default: null,
    },
    reminder: {
        type: Date,
        default: null,
    },
    remark: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        default: 'Awaiting Initiation' 
        // 'Awaiting Initiation', 'Pending', 'Completed', 'Overdue', 'On Hold'
    },
    order: {
        type: Number,
        default: 0
    },
    dueDateNotificationSent: {
        type: Boolean,
        default: false
    },
    reminderNotificationSent: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema)