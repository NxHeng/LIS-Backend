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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clerkInCharge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // clients: {
    //     type: [String], //
    //     required: true
    // },
    clients: [
        {
            name: {
                type: String,
                required: true
            },
            icNumber: {
                type: String,
                required: true,
                // validate: {
                //     validator: function (v) {
                //         return /^\d{6}-\d{2}-\d{4}$/.test(v);
                //     },
                //     message: props => `${props.value} is not a valid IC number!`
                // }
            }
        }
    ],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    fields: [Field.schema],
    tasks: [Task.schema],
    status: {
        type: String,
        default: 'Active'
    }

}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema)