// /services/fileService.js
const File = require('../models/fileModel');
const Folder = require('../models/folderModel');
const path = require('path');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKET_NAME);

// Service to handle file upload
// const uploadFile = async (file, folderId, uploadedBy, caseId) => {
//     if (!file) {
//         throw new Error('No file uploaded.');
//     }

//     let folder;
//     if (folderId) {
//         folder = await Folder.findById(folderId);
//         if (!folder || folder.caseId.toString() !== caseId.toString()) {
//             throw new Error('Folder not found or does not belong to this case.');
//         }
//     } else {
//         // Handle root folder case
//         folder = { folderPath: 'root' }; // Adjust this path as needed
//     }

//     const parsedPath = path.parse(file.originalname);
//     const fileNameWithoutExtension = parsedPath.name;
//     const filePath = path.join(folder.folderPath, file.originalname);

    // const newFile = new File({
    //     fileURI: file.filename,
    //     fileName: fileNameWithoutExtension,
    //     filePath: filePath,
    //     fileType: file.mimetype,
    //     fileSize: file.size,
    //     folderId: folderId || null, // Set to null if no folderId is provided
    //     uploadedBy: uploadedBy,
    //     caseId: caseId
    // });

//     await newFile.save();
//     return newFile;
// };

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

    // Use the cloudStorageObject (file name) from the middleware for the URI
    const fileURI = `gs://${process.env.BUCKET_NAME}/${file.cloudStorageObject}`;

    try {
        // Save file metadata to the database
        const newFile = new File({
            fileURI: fileURI, // Google Cloud Storage URI (same as fileName used in middleware)
            fileName: fileNameWithoutExtension,
            filePath: filePath,
            fileType: file.mimetype,
            fileSize: file.size,
            folderId: folderId || null, // Set to null if no folderId is provided
            uploadedBy: uploadedBy,
            caseId: caseId,
        });

        await newFile.save();
        return newFile;
    } catch (error) {
        throw new Error(`Error saving file metadata to database: ${error.message}`);
    }
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
// const downloadFile = async (fileId) => {
//     try {
//         const file = await File.findById(fileId);
//         if (!file) {
//             throw new Error('File not found.');
//         }
//         return file;
//     } catch (error) {
//         throw new Error(`Error downloading file: ${error.message}`);
//     }
// };
const downloadFile = async (fileId) => {
    try {
        const file = await File.findById(fileId);
        if (!file) {
            throw new Error('File not found.');
        }

        const fileName = file.fileName;  // This is the user-friendly filename stored in MongoDB
        const fileURI = file.fileURI;    // This is the file's URI in Google Cloud Storage
        console.log('File URI:', fileURI);

        if (fileURI.startsWith('gs://')) {
            const bucketFile = bucket.file(fileURI.replace(`gs://${process.env.BUCKET_NAME}/`, ''));
            
            // Generate signed URL for the cloud file
            const [url] = await bucketFile.getSignedUrl({
                action: 'read',
                expires: Date.now() + 1000 * 60 * 60, // 1-hour expiration
            });

            // Return the URL with the original file name
            return { url, fileName };
        }

        // If the file is stored locally
        const filePath = path.join(__dirname, '..', 'uploads', fileURI);
        return { filePath, fileName };
    } catch (error) {
        throw new Error(`Error downloading file: ${error.message}`);
    }
};


// Service to delete a file
// const deleteFile = async (fileId) => {
//     try {
//         const file = await File.findById(fileId);
//         if (!file) {
//             throw new Error('File not found.');
//         }

//         // Construct the file path
//         const fileURI = path.join(__dirname, '..', 'uploads', file.fileURI);

//         // Delete the file from the filesystem
//         fs.unlink(fileURI, (err) => {
//             if (err) {
//                 console.error(`Error deleting file ${fileURI}:`, err);
//             } else {
//                 console.log(`Deleted file ${fileURI}`);
//             }
//         });

//         // Delete the file record from the database
//         await file.deleteOne();

//         return { message: 'File deleted successfully!' };
//     } catch (error) {
//         throw new Error(`Error deleting file: ${error.message}`);
//     }
// };

const deleteFile = async (fileId) => {
    try {
        // Find the file in the database
        const file = await File.findById(fileId);
        if (!file) {
            throw new Error('File not found.');
        }

        // Determine whether to delete from cloud storage or local filesystem
        if (file.fileURI.startsWith('gs://')) {
            // Remove 'gs://<bucket-name>/' prefix to get the file path relative to the bucket
            const filePathInStorage = file.fileURI.replace(`gs://${process.env.BUCKET_NAME}/`, '');

            // Delete the file from Google Cloud Storage
            await bucket.file(filePathInStorage).delete();
            console.log(`File deleted from Google Cloud Storage: gs://${process.env.BUCKET_NAME}/${filePathInStorage}`);
        } else {
            // Delete the file from the local filesystem (if using local storage instead of cloud storage)
            const localFilePath = path.join(__dirname, '..', 'uploads', file.fileURI);
            fs.unlink(localFilePath, (err) => {
                if (err) {
                    console.error(`Error deleting file ${localFilePath}:`, err);
                } else {
                    console.log(`Deleted file ${localFilePath}`);
                }
            });
        }

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

// const deleteFolderContents = async (folderId, caseId) => {
//     try {
//         const folder = await Folder.findById(folderId);
//         if (!folder || folder.caseId.toString() !== caseId.toString()) {
//             throw new Error('Folder not found or does not belong to this case.');
//         }

//         // Delete all files in the folder
//         const files = await File.find({ folderId: folderId, caseId: caseId });
//         for (const file of files) {
//             const fileURI = path.join(__dirname, '..', 'uploads', file.fileURI);
//             fs.unlink(fileURI, (err) => {
//                 if (err) {
//                     console.error(`Error deleting file ${fileURI}:`, err);
//                 } else {
//                     console.log(`Deleted file ${fileURI}`);
//                 }
//             });
//         }
//         await File.deleteMany({ folderId: folderId, caseId: caseId });

//         // Find all subfolders
//         const subfolders = await Folder.find({ parentFolderId: folderId, caseId: caseId });

//         // Recursively delete contents of each subfolder
//         for (const subfolder of subfolders) {
//             await deleteFolderContents(subfolder._id, caseId);
//             await subfolder.deleteOne();
//         }

//         return { message: 'Folder contents deleted successfully!' };
//     } catch (error) {
//         throw new Error(`Error deleting folder contents: ${error.message}`);
//     }
// };
const deleteFolderContents = async (folderId, caseId) => {
    try {
        const folder = await Folder.findById(folderId);
        if (!folder || folder.caseId.toString() !== caseId.toString()) {
            throw new Error('Folder not found or does not belong to this case.');
        }

        // Delete all files in the folder
        const files = await File.find({ folderId: folderId, caseId: caseId });

        for (const file of files) {
            // Ensure fileURI is stored correctly (relative path, without 'gs://')
            let fileURI = file.fileURI;
            if (fileURI.startsWith('gs://')) {
                // Extract the file path relative to the bucket
                fileURI = fileURI.replace(`gs://${process.env.BUCKET_NAME}/`, '');
                
                // Delete the file from Google Cloud Storage
                await bucket.file(fileURI).delete();
                console.log(`Deleted file from Google Cloud Storage: gs://${process.env.BUCKET_NAME}/${fileURI}`);
            } else {
                // If it's not a cloud file, assume it's a local file
                const localFilePath = path.join(__dirname, '..', 'uploads', fileURI);
                fs.unlink(localFilePath, (err) => {
                    if (err) {
                        console.error(`Error deleting file ${localFilePath}:`, err);
                    } else {
                        console.log(`Deleted file ${localFilePath}`);
                    }
                });
            }
        }

        // Delete the files from the database after deletion from storage
        await File.deleteMany({ folderId: folderId, caseId: caseId });

        // Find all subfolders and recursively delete their contents
        const subfolders = await Folder.find({ parentFolderId: folderId, caseId: caseId });
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

// const previewFile = async (fileId) => {
//     try {
//         const file = await File.findById(fileId);
//         if (!file) {
//             throw new Error('File not found.');
//         }
//         return file;
//     }
//     catch (error) {
//         throw new Error(`Error previewing file: ${error.message}`);
//     }
// }

const previewFile = async (fileId) => {
    try {
        // Fetch file metadata from the database (using your File model)
        const file = await File.findById(fileId);
        if (!file) {
            throw new Error('File not found.');
        }

        // Handle Google Cloud Storage or local file paths
        let filePath;
        let fileURI;

        if (file.fileURI.startsWith('gs://')) {
            // If file is stored in Google Cloud Storage, return the signed URL
            fileURI = file.fileURI.replace(`gs://${process.env.BUCKET_NAME}/`, '');
            
            // Generate a signed URL for temporary access to the file
            const [url] = await bucket.file(fileURI).getSignedUrl({
                action: 'read',
                expires: '03-09-2491', // Set expiration far in the future
            });

            return { type: 'cloud', url };
        } else {
            // If the file is stored locally, construct the local file path
            filePath = path.join(__dirname, '..', 'uploads', file.fileURI);

            // Check if the local file exists
            if (fs.existsSync(filePath)) {
                return { type: 'local', path: filePath };
            } else {
                throw new Error('Local file not found.');
            }
        }
    } catch (error) {
        throw new Error(`Error previewing file: ${error.message}`);
    }
};

const fetchFileFromStorage = async (fileId) => {
    try {
        const file = await File.findById(fileId);
        if (!file) {
            throw new Error('File not found.');
        }

        if (!file.fileURI.startsWith('gs://')) {
            throw new Error('File is not stored in Google Cloud Storage.');
        }
        const bucketFile = bucket.file(file.fileURI.replace(`gs://${process.env.BUCKET_NAME}/`, ''));

        // Generate a signed URL
        const [url] = await bucketFile.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60, // 1 hour expiration
        });

        console.log('Generated signed URL:', url); // Log the signed URL
        return { url, fileName: file.fileName };
    } catch (error) {
        console.error('Error fetching file from storage:', error);
        throw new Error('Error fetching file from storage');
    }
};

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
    fetchFileFromStorage,
};