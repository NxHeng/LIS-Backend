const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer to upload files to the local filesystem
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { folderPath } = req.body; // Get folder path from request body
        const uploadPath = path.join(__dirname, '../uploads', folderPath || ''); // Dynamic folder path

        // Check if the directory exists, if not, create it
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true }); // Create nested directories
        }
        cb(null, uploadPath); // Set upload destination
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Name file with timestamp to avoid conflicts
    }
});

// Exporting middleware with Multer configuration
const upload = multer({ storage });

module.exports = upload;
