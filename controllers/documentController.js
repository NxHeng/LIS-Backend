// /controllers/fileController.js
const documentService = require('../services/documentService');
const path = require('path');
const Folder = require('../models/folderModel');
const File = require('../models/fileModel');
const { Readable } = require('stream'); 

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
        res.status(200).json({
            message: 'File uploaded successfully',
            file: newFile,
        });
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

const listFolders = async (req, res) => {
    try {
        const { folderId, caseId } = req.query;

        if (!caseId) {
            return res.status(400).send('Case ID is required.');
        }

        const folders = await documentService.listFolders(folderId, caseId);
        res.status(200).json(folders);
    } catch (error) {
        res.status(404).send(error.message);
    }
}

const listEverything = async (req, res) => {
    try {
        const { caseId } = req.query;

        if (!caseId) {
            return res.status(400).send('Case ID is required.');
        }

        const everything = await documentService.listEverything(caseId);
        res.status(200).json(everything);
    } catch (error) {
        res.status(404).send(error.message);
    }
}

// Controller to download a file
// const downloadFile = async (req, res) => {
//     try {
//         const { fileId } = req.query;
//         const file = await documentService.downloadFile(fileId);

//         // Implement download logic based on file storage (local/cloud)
//         const fileURI = path.join('uploads/', file.fileURI);
//         res.download(fileURI, file.fileURI, (err) => {
//             if (err) {
//                 res.status(500).send({
//                     message: "Could not download the file. " + err,
//                 });
//             }
//         });
//     } catch (error) {
//         res.status(404).send(error.message);
//     }
// };
const downloadFile = async (req, res) => {
    try {
        const { fileId } = req.query;

        // Get the signed URL for the file in Google Cloud Storage
        const { url, fileName } = await documentService.fetchFileFromStorage(fileId);

        // Fetch the file from Google Cloud Storage using the signed URL
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch file from Google Cloud Storage');
        }

        // Set the appropriate content type and send the file back to the client
        const contentType = response.headers.get('Content-Type');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Access-Control-Allow-Origin', '*'); // or specific domain
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        // Convert ReadableStream (fetch) to Node.js Readable stream and pipe it to the response
        const bodyStream = Readable.fromWeb(response.body);
        bodyStream.pipe(res);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send({ message: "Error downloading file: " + error.message });
    }
};





// Controller to delete a file
const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.body;
        console.log(req.body);
        await documentService.deleteFile(fileId);

        res.status(200).json({ message: 'File deleted successfully!' });
    } catch (error) {
        res.status(400).send(error.message);
    }
};

const deleteFolder = async (req, res) => {
    try {
        const { folderId, caseId } = req.body;
        await documentService.deleteFolder(folderId, caseId);

        res.status(200).json({ message: 'Folder deleted successfully!' });
    } catch (error) {
        res.status(400).send(error.message);
    }
}

const renameFolder = async (req, res) => {
    try {
        const { folderId, folderName } = req.body;
        console.log(req.body);
        const updatedFolder = await Folder.findByIdAndUpdate(folderId, { folderName: folderName }, { new: true });
        res.status(200).json({ message: 'Folder renamed successfully!', folder: updatedFolder });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}

const renameFile = async (req, res) => {
    try {
        const { fileId, fileName } = req.body;
        console.log(req.body);
        const updatedFile = await File.findByIdAndUpdate(fileId, { fileName: fileName }, { new: true });
        res.status(200).json({ message: 'File renamed successfully!', file: updatedFile });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
}

// const previewFile = async (req, res) => {
//     try {
//         const { fileId } = req.query;
//         console.log(fileId);
//         const file = await documentService.previewFile(fileId);
//         // Implement download logic based on file storage (local/cloud)
//         const filePath = path.join(__dirname, '..', 'uploads', file.fileURI);
//         console.log(filePath);
//         res.sendFile(filePath, (err) => {
//             if (err) {
//                 res.status(500).send({
//                     message: "Could not preview the file. " + err,
//                 });
//             }
//         });
//     } catch (error) {
//         res.status(404).send(error.message);
//     }
// };

const previewFile = async (req, res) => {
    try {
        const { fileId } = req.query;

        // Get the signed URL from the service layer
        const { url } = await documentService.fetchFileFromStorage(fileId);
        console.log('Signed URL for file:', url); // Log the signed URL

        // Use the signed URL to fetch the file from Google Cloud Storage
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch file from Google Cloud Storage');
        }

        const contentType = response.headers.get('Content-Type');
        res.setHeader('Content-Type', contentType);
        console.log('Content-Type:', contentType);

        // Convert ReadableStream (fetch) to Node.js Readable stream
        const bodyStream = Readable.fromWeb(response.body); // Node.js >= v16.5.0 supports `fromWeb`

        // Stream the file back to the client
        bodyStream.pipe(res);
    } catch (error) {
        console.error('Error previewing file:', error);
        res.status(500).send({ message: "Error previewing file: " + error.message });
    }
};

const moveFile = async (req, res) => {
    const { fileId, newFolderId } = req.body;

    try {
        const file = await documentService.moveFile(fileId, newFolderId);
        res.status(200).json({ message: "File moved successfully", file });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error moving file" });
    }
};

const moveFolder = async (req, res) => {
    const { folderId, newParentFolderId } = req.body;

    try {
        const folder = await documentService.moveFolder(folderId, newParentFolderId);
        res.status(200).json({ message: "Folder moved successfully", folder });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error moving folder" });
    }
}

module.exports = {
    uploadFile,
    createFolder,
    listContents,
    listFolders,
    listEverything,
    downloadFile,
    deleteFile,
    deleteFolder,
    renameFolder,
    renameFile,
    previewFile,
    moveFile,
    moveFolder,
};