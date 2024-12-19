const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    fileURI: {
        type: String
    },
    fileName: {
        type: String
    }
});

module.exports = mongoose.model('Announcement', announcementSchema);
