// /services/fileService.js
const File = require('../models/fileModel');
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
        folder = { folderPath: 'root' }; // Adjust this path as needed
    }

    const parsedPath = path.parse(file.originalname);
    const fileNameWithoutExtension = parsedPath.name;
    const filePath = path.join(folder.folderPath, file.originalname);

    const newFile = new File({
        fileURI: file.filename,
        fileName: fileNameWithoutExtension,
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
        console.log(parentFolder);
        if (!parentFolder || parentFolder.caseId.toString() !== caseId.toString()) {
            throw new Error('Parent folder not found or does not belong to this case.');
        }
        // console.log('File name:', file.filename);
        folderPath = path.join(parentFolder.folderPath, folderName);
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
    if (!caseId) {
        throw new Error('Case ID is required.');
    }

    let folder;
    let files;
    let folders;

    if (folderId) {
        folder = await Folder.findById(folderId).populate('caseId')
        if (!folder || folder.caseId._id.toString() !== caseId.toString()) {
            throw new Error('Folder not found or does not belong to this case.');
        }

        files = await File.find({ folderId: folderId, caseId: caseId }).populate('caseId').populate('uploadedBy');
        folders = await Folder.find({ parentFolderId: folderId, caseId: caseId }).populate('caseId');
    } else {
        // Handle root folder case
        files = await File.find({ folderId: null, caseId: caseId }).populate('caseId').populate('uploadedBy');
        folders = await Folder.find({ parentFolderId: null, caseId: caseId }).populate('caseId');
    }

    return { folder, files, folders };
};


const listFolders = async (folderId, caseId) => {
    if (!caseId) {
        throw new Error('Case ID is required.');
    }

    let folder;
    let folders;

    if (folderId) {
        folder = await Folder.findById(folderId);
        if (!folder || folder.caseId.toString() !== caseId.toString()) {
            throw new Error('Folder not found or does not belong to this case.');
        }

        folders = await Folder.find({ parentFolderId: folderId, caseId: caseId });
    } else {
        // Handle root folder case
        folders = await Folder.find({ parentFolderId: null, caseId: caseId });
    }

    return { folder, folders };
};

const listEverything = async (caseId) => {
    if (!caseId) {
        throw new Error('Case ID is required.');
    }

    // Find all folders and files under the given caseId
    const folders = await Folder.find({ caseId: caseId }).populate('caseId');
    const files = await File.find({ caseId: caseId }).populate('caseId').populate('uploadedBy');

    return { folders, files };
};

// Service to download a file
const downloadFile = async (fileId) => {
    try {
        const file = await File.findById(fileId);
        if (!file) {
            throw new Error('File not found.');
        }
        return file;
    } catch (error) {
        throw new Error(`Error downloading file: ${error.message}`);
    }
};


// Service to delete a file
const deleteFile = async (fileId) => {
    try {
        const file = await File.findById(fileId);
        if (!file) {
            throw new Error('File not found.');
        }

        // Construct the file path
        const fileURI = path.join(__dirname, '..', 'uploads', file.fileURI);

        // Delete the file from the filesystem
        fs.unlink(fileURI, (err) => {
            if (err) {
                console.error(`Error deleting file ${fileURI}:`, err);
            } else {
                console.log(`Deleted file ${fileURI}`);
            }
        });

        // Delete the file record from the database
        await file.deleteOne();

        return { message: 'File deleted successfully!' };
    } catch (error) {
        throw new Error(`Error deleting file: ${error.message}`);
    }
};


const deleteFolder = async (folderId, caseId) => {
    try {
        await deleteFolderContents(folderId, caseId);
        const folder = await Folder.findById(folderId);
        if (!folder) {
            throw new Error('Folder not found.');
        }
        await folder.deleteOne();
        return { message: 'Folder deleted successfully!' };
    } catch (error) {
        throw new Error(`Error deleting folder: ${error.message}`);
    }
};

const deleteFolderContents = async (folderId, caseId) => {
    try {
        const folder = await Folder.findById(folderId);
        if (!folder || folder.caseId.toString() !== caseId.toString()) {
            throw new Error('Folder not found or does not belong to this case.');
        }

        // Delete all files in the folder
        const files = await File.find({ folderId: folderId, caseId: caseId });
        for (const file of files) {
            const fileURI = path.join(__dirname, '..', 'uploads', file.fileURI);
            fs.unlink(fileURI, (err) => {
                if (err) {
                    console.error(`Error deleting file ${fileURI}:`, err);
                } else {
                    console.log(`Deleted file ${fileURI}`);
                }
            });
        }
        await File.deleteMany({ folderId: folderId, caseId: caseId });

        // Find all subfolders
        const subfolders = await Folder.find({ parentFolderId: folderId, caseId: caseId });

        // Recursively delete contents of each subfolder
        for (const subfolder of subfolders) {
            await deleteFolderContents(subfolder._id, caseId);
            await subfolder.deleteOne();
        }

        return { message: 'Folder contents deleted successfully!' };
    } catch (error) {
        throw new Error(`Error deleting folder contents: ${error.message}`);
    }
};




const renameFolder = async (folderId, folderName) => {
    try {
        const folder = await Folder.findById(folderId);
        if (!folder || folder.caseId.toString() !== caseId.toString()) {
            throw new Error('Folder not found or does not belong to this case.');
        }
        folder.folderName = folderName;
        folder.save();
        return { message: 'Folder renamed successfully!' };
    } catch (error) {
        throw new Error(`Error renaming folder: ${error.message}`);
    }
};

const renameFile = async (fileId, fileName) => {
    try {
        const file = await File.findById(fileId);
        if (!file || file.caseId.toString() !== caseId.toString()) {
            throw new Error('File not found or does not belong to this case.');
        }
        file.fileName = fileName;
        file.save();
        return { message: 'File renamed successfully!' };
    }
    catch (error) {
        throw new Error(`Error renaming file: ${error.message}`);
    }
}

const previewFile = async (fileId) => {
    try {
        const file = await File.findById(fileId);
        if (!file) {
            throw new Error('File not found.');
        }
        return file;
    }
    catch (error) {
        throw new Error(`Error previewing file: ${error.message}`);
    }
}

const moveFile = async (fileId, newFolderId) => {
    // Find the file by its ID
    const file = await File.findById(fileId);

    // Update the file's folder ID (set to null if moving to root)
    file.folderId = newFolderId || null;

    // Optionally, update folderPath based on the new folder's path
    if (newFolderId) {
        const newFolder = await Folder.findById(newFolderId);
        file.filePath = `${newFolder.folderPath}\\${file.fileName}`;
    } else {
        file.filePath = `root\\${file.fileName}`; // For root folder
    }

    // Save the updated file
    await file.save();

    return file;
};

const moveFolder = async (folderId, newParentFolderId) => {
    // Find the folder by its ID
    const folder = await Folder.findById(folderId);

    // Update the folder's parent folder ID (set to null if moving to root)
    folder.parentFolderId = newParentFolderId || null;

    // Optionally, update folderPath based on the new parent folder's path
    if (newParentFolderId) {
        const newParentFolder = await Folder.findById(newParentFolderId);
        folder.folderPath = `${newParentFolder.folderPath}\\${folder.folderName}`;
    } else {
        folder.folderPath = `root\\${folder.folderName}`; // For root folder
    }

    // Save the updated folder
    await folder.save();

    // Recursively update paths for all subfolders and files
    await updateFolderContents(folder._id, folder.folderPath);

    return folder;
};

const updateFolderContents = async (folderId, newFolderPath) => {
    // Find all subfolders within the folder
    const subfolders = await Folder.find({ parentFolderId: folderId });

    // Update each subfolder's path and recursively update its contents
    for (const subfolder of subfolders) {
        subfolder.folderPath = `${newFolderPath}\\${subfolder.folderName}`;
        await subfolder.save();
        await updateFolderContents(subfolder._id, subfolder.folderPath);
    }

    // Find all files within the folder
    const files = await File.find({ folderId: folderId });

    // Update each file's path
    for (const file of files) {
        file.filePath = `${newFolderPath}\\${file.fileName}`;
        await file.save();
    }
};


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