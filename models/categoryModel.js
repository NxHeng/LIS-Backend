const mongoose = require('mongoose');
const Task = require('./taskModel');
const Field = require('./fieldModel');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
    categoryName: {
        type: String,
        required: true
    },
    // fields: [Field.schema],
    fields: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Field'
    }],
    fieldOrders: [{
        fieldId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Field'
        },
        order: {
            type: Number,
            required: true
        }
    }],
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema)