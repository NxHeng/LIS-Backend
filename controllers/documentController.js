// /controllers/fileController.js
const documentService = require('../services/documentService');
const path = require('path');
const Folder = require('../models/folderModel');

// Controller to upload a file
const uploadFile = async (req, res) => {
    try {
        const { folderId, caseId, uploadedBy } = req.body;
        const file = req.file;
        // const userId = req.userId; // Assuming req.userId contains the ID of the uploader

        if (!caseId) {
            return res.status(400).send('Case ID is required.');
        }

        const newFile = await documentService.uploadFile(file, folderId, uploadedBy, caseId);
        res.status(201).json({ message: 'File uploaded successfully!', file: newFile });
    } catch (error) {
        res.status(400).send(error.message);
    }
};

// Controller to create a new folder (supports nested folders)
const createFolder = async (req, res) => {
    try {
        console.log(req.body);
        const { folderName, parentFolderId, caseId } = req.body;

        if (!caseId) {
            console.log(req.body);
            return res.status(400).send('Case ID is required.');
        }

        const newFolder = await documentService.createFolder(folderName, parentFolderId, caseId);
        res.status(201).json({ message: 'Folder created successfully!', folder: newFolder });
    } catch (error) {
        res.status(400).send(error.message);
    }
};

// Controller to list files and folders in a directory
const listContents = async (req, res) => {
    try {
        const { folderId, caseId } = req.query;

        if (!caseId) {
            return res.status(400).send('Case ID is required.');
        }

        const contents = await documentService.listContents(folderId, caseId);
        res.status(200).json(contents);
    } catch (error) {
        res.status(404).send(error.message);
    }
};

// Controller to download a file
const downloadFile = async (req, res) => {
    try {
        const { fileId, caseId } = req.query;
        const file = await documentService.downloadFile(fileId, caseId);

        // Implement download logic based on file storage (local/cloud)
        const filePath = path.join('uploads/', file.fileName);
        res.download(filePath, file.fileName, (err) => {
            if (err) {
                res.status(500).send({
                    message: "Could not download the file. " + err,
                });
            }
        });
    } catch (error) {
        res.status(404).send(error.message);
    }
};

// Controller to delete a file
const deleteFile = async (req, res) => {
    try {
        const { fileId, caseId } = req.body;
        await documentService.deleteFile(fileId, caseId);

        res.status(200).json({ message: 'File deleted successfully!' });
    } catch (error) {
        res.status(400).send(error.message);
    }
};


module.exports = {
    uploadFile,
    createFolder,
    listContents,
    downloadFile,
    deleteFile
};