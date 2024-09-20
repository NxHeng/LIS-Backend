const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// File Schema
const fileSchema = new Schema({
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    }, // Relative path to the file in cloud/local storage
    fileType: {
        type: String
    },
    fileSize: {
        type: Number
    }, // Size in bytes
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    }, // Refers to the folder it's in
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }, // User who uploaded the file
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true
    }, // Associated case
    createdAt: {
        type: Date,
        default: Date.now
    }
});


// Export models
module.exports = mongoose.model('File', fileSchema);
