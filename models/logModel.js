const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const logSchema = new Schema({
    logMessage: {
        type: String,
        required: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now, // Auto-add timestamps for logs
    },
});

module.exports = mongoose.model('Log', logSchema);