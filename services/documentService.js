// /services/fileService.js
const File  = require('../models/fileModel');
const Folder = require('../models/folderModel');
const path = require('path');
const fs = require('fs');

// Service to handle file upload
const uploadFile = async (file, folderId, uploadedBy, caseId) => {
    if (!file) {
        throw new Error('No file uploaded.');
    }

    let folder;
    if (folderId) {
        folder = await Folder.findById(folderId);
        if (!folder || folder.caseId.toString() !== caseId.toString()) {
            throw new Error('Folder not found or does not belong to this case.');
        }
    } else {
        // Handle root folder case
        folder = { path: 'uploads/root' }; // Adjust this path as needed
    }
    const filePath = path.join(folder.folderPath, file.filename);

    const newFile = new File({
        fileName: file.filename,
        filePath: filePath,
        fileType: file.mimetype,
        fileSize: file.size,
        folderId: folderId || null, // Set to null if no folderId is provided
        uploadedBy: uploadedBy,
        caseId: caseId
    });

    await newFile.save();
    return newFile;
};

// Service to handle folder creation
const createFolder = async (folderName, parentFolderId, caseId) => {
    let folderPath = '';

    // Validate the case ID
    if (!caseId) {
        throw new Error('Case ID is required.');
    }

    if (parentFolderId) {
        const parentFolder = await Folder.findById(parentFolderId);
        if (!parentFolder || parentFolder.caseId.toString() !== caseId.toString()) {
            throw new Error('Parent folder not found or does not belong to this case.');
        }
        folderPath = path.join(parentFolder.path, folderName);
    } else {
        folderPath = path.join('root', folderName); // Root level folder path
    }

    const newFolder = new Folder({
        folderName: folderName,
        parentFolderId: parentFolderId || null,
        folderPath: folderPath,
        caseId: caseId
    });

    await newFolder.save();
    return newFolder;
};

// Service to list files and folders in a directory
const listContents = async (folderId, caseId) => {
    const folder = await Folder.findById(folderId);
    if (!folder || folder.caseId.toString() !== caseId.toString()) {
        throw new Error('Folder not found or does not belong to this case.');
    }

    const files = await File.find({ folderId: folderId, caseId: caseId });
    const folders = await Folder.find({ parentFolderId: folderId, caseId: caseId });

    return { folder, files, folders };
};

// Service to download a file
const downloadFile = async (fileId, caseId) => {
    try {
        const file = await File.findById(fileId);
        if (!file || file.caseId.toString() !== caseId.toString()) {
            throw new Error('File not found or does not belong to this case.');
        }
        return file;
    } catch (error) {
        throw new Error(`Error downloading file: ${error.message}`);
    }
};


// Service to delete a file
const deleteFile = async (fileId, caseId) => {
    try {
        const file = await File.findById(fileId);
        if (!file || file.caseId.toString() !== caseId.toString()) {
            throw new Error('File not found or does not belong to this case.');
        }
        await file.deleteOne();
        return { message: 'File deleted successfully!' };
    } catch (error) {
        throw new Error(`Error deleting file: ${error.message}`);
    }
};

module.exports = {
    uploadFile,
    createFolder,
    listContents,
    downloadFile,
    deleteFile
};