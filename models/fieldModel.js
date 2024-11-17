const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const fieldSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }, // e.g., 'String', 'Number', 'Date', etc.
    value: {
        type: Schema.Types.Mixed, // Mixed type allows for flexibility (e.g., String, Number, Date)
        required: false // Optional if fields may initially lack a value
    },
    remarks: {
        type: String,
        required: false
    },
    tel: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    fax: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('Field', fieldSchema);