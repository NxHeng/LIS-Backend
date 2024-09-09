const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const taskSchema = new Schema({
    description: {
        type: String,
        required: true
    },
    initiationDate: {
        type: Date,
    },
    dueDate: {
        type: Date,
    },
    reminder: {
        type: Date,
    },
    remark: {
        type: String
    },
    status: {
        type: String,
        default: 'Awaiting Initiation'
    },
    order: { 
        type: Number, 
        default: 0 
    },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema)