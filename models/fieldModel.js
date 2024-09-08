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
    } // e.g., 'String', 'Number', 'Date', etc.
});

module.exports = mongoose.model('Field', fieldSchema);