const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

// Configure Multer to upload files to the local filesystem
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const { folderPath } = req.body; // Get folder path from request body
//         const uploadPath = path.join(__dirname, '../uploads', folderPath || ''); // Dynamic folder path

//         // Check if the directory exists, if not, create it
//         if (!fs.existsSync(uploadPath)) {
//             fs.mkdirSync(uploadPath, { recursive: true }); // Create nested directories
//         }
//         cb(null, uploadPath); // Set upload destination
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + '-' + file.originalname); // Name file with timestamp to avoid conflicts
//     }
// });

// // Exporting middleware with Multer configuration
// const upload = multer({ storage });

// module.exports = upload;

// Configure Google Cloud Storage client
const storage = new Storage({
    // keyFilename: path.resolve(__dirname, '../', process.env.GOOGLE_KEY_FILENAME), 
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    projectId: process.env.GOOGLE_PROJECT_ID, 
});

const bucketName = process.env.BUCKET_NAME; 
const bucket = storage.bucket(bucketName);

// Multer memory storage to hold the file temporarily
const multerMemoryStorage = multer.memoryStorage();

// Multer middleware configuration
const upload = multer({ storage: multerMemoryStorage });

// Middleware to handle Google Cloud Storage upload
async function uploadToGCS(req, res, next) {

    // if no file skip
    if (!req.file) {
        return next();
    }

    try {
        // const { folderPath } = req.body; 
        const uniqueId = uuidv4();
        const fileName = `${uniqueId}-${req.file.originalname}`;

        console.log('Uploading file to GCS...');
        console.log('File Details:', req.file);
        // console.log('Folder Path:', folderPath);

        const blob = bucket.file(fileName);
        const blobStream = blob.createWriteStream({
            resumable: true,
            contentType: req.file.mimetype,
        });

        blobStream.on('error', (err) => {
            console.error('Error uploading file:', err);
            next(err);
        });

        blobStream.on('finish', () => {
            console.log('File uploaded successfully to GCS.');
            // Construct the public URL for the uploaded file
            req.file.cloudStorageObject = fileName;
            req.file.cloudStoragePublicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
            next();
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error('Error in uploadToGCS:', error);
        next(error);
    }
}

module.exports = {
    single: (fieldName) => [upload.single(fieldName), uploadToGCS],
};