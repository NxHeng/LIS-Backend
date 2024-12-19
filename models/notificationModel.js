const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    type: { type: String, required: true }, // 'deadline', 'reminder', 'new_case', 'detail_update', 'status_change'
    message: { 
        type: String, 
        required: true 
    },
    taskId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Task', 
        default: null 
    },
    caseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Case', 
        required: false 
    },
    announcementId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Announcement', 
        default: null 
    },
    usersNotified: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }], // solicitor, clerk
    isRead: { 
        type: Boolean, 
        default: false 
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
