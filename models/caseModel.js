const mongoose = require('mongoose');
const Task = require('./taskModel');
const Field = require('./fieldModel');

const Schema = mongoose.Schema;

const caseSchema = new Schema({
    matterName: {
        type: String,
        required: true
    },
    fileReference: {
        type: String,
        required: true
    },
    solicitorInCharge: {
        type: String,
        required: true
    },
    clerkInCharge: {
        type: String,
        required: true
    },
    clients: {
        type: [String], //
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    fields: [{
        name: String, // Name of the field
        value: Schema.Types.Mixed // Dynamic value that can be of any type
    }],
    tasks: [Task.schema],
    status: {
        type: String,
        default: 'Active'
    }

}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema)