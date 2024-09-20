const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Folder Schema
const folderSchema = new Schema({
    folderName: {
        type: String,
        required: true
    },
    parentFolderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    }, // Refers to the parent folder
    folderPath: {
        type: String,
        required: true
    }, // Path to folder for easy navigation
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true
    }, // Associated case
});

// Export models
module.exports = mongoose.model('Folder', folderSchema);
