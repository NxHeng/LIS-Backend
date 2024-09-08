const mongoose = require('mongoose');
const Task = require('./taskModel');
const Field = require('./fieldModel');

const Schema = mongoose.Schema;

const categorySchema = new Schema({
    categoryName: {
        type: String,
        required: true
    },
    fields: [Field.schema],
    tasks: [Task.schema]
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema)