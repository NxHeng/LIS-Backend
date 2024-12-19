const mongoose = require('mongoose');
const AnnouncementModel = require('../models/announcementModel');
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKET_NAME);

// Get all announcements
const getAnnouncements = async () => {
    try {
        const announcements = await AnnouncementModel.find({}).sort({ createdAt: -1 });
        return announcements;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Get a single announcement
const getAnnouncement = async (id) => {
    // Check id format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Announcement not found');
    }
    // Find announcement by id
    const announcement = await AnnouncementModel.findById(id);
    if (!announcement) {
        throw new Error('Announcement not found');
    }
    return announcement;
};

// const createAnnouncement = async (body, file) => {
//     try {
//         const {
//             title,
//             description,
//         } = body;

//         const newAnnouncement = new AnnouncementModel({
//             title,
//             description,
//             fileURI: file ? file.filename : null,
//             fileName: file ? file.originalname : null,
//         });

//         console.log(newAnnouncement);

//         const savedAnnouncement = await newAnnouncement.save();
//         return savedAnnouncement;
//     } catch (error) {
//         throw new Error(error.message);
//     }
// }



// Update an announcement
const createAnnouncement = async (body, file) => {
    try {
        const { title, description } = body;
        let fileURI = null;

        if (file) {
            // Use the URL set by the middleware
            fileURI = `gs://${process.env.BUCKET_NAME}/${file.cloudStorageObject}`;
        }

        const newAnnouncement = new AnnouncementModel({
            title,
            description,
            fileURI: fileURI,
            fileName: file ? file.originalname : null,
        });

        const savedAnnouncement = await newAnnouncement.save();
        return savedAnnouncement;
    } catch (error) {
        throw new Error(error.message);
    }
};


// const updateAnnouncement = async (id, updateData, file) => {
//     // Check id format
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         throw new Error('Announcement not found');
//     }
//     // Find announcement by id and update title, description, fileURI, and fileName
//     const announcement = await AnnouncementModel.findByIdAndUpdate(id,
//         {
//             ...updateData,
//             fileURI: file ? file.filename : null,
//             fileName: file ? file.originalname : null
//         },
//         { new: true }
//     );

//     if (!announcement) {
//         throw new Error('Announcement not found');
//     }
//     return announcement;
// };

// Delete an announcement
const updateAnnouncement = async (id, updateData, file) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Announcement not found');
        }

        let fileURI = null;

        if (file) {
            fileURI = `gs://${process.env.BUCKET_NAME}/${file.cloudStorageObject}`; 
        }

        const updatedAnnouncement = await AnnouncementModel.findByIdAndUpdate(
            id,
            {
                ...updateData,
                fileURI: fileURI || undefined,  // Update the fileURI if file exists
                fileName: file ? file.originalname : undefined,
            },
            { new: true }
        );

        if (!updatedAnnouncement) {
            throw new Error('Announcement not found');
        }

        return updatedAnnouncement;
    } catch (error) {
        throw new Error(error.message);
    }
};

const deleteAnnouncement = async (id) => {
    // Check id format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Announcement not found');
    }
    // Find announcement by id and delete attachment
    const result = await AnnouncementModel.findById(id);
    if (!result) {
        throw new Error('Announcement not found');
    }
    if (result.fileURI) {
        await deleteAttachment(result.fileURI);
    }
    // Find announcement by id and delete
    const announcement = await AnnouncementModel.findByIdAndDelete(id);
    if (!announcement) {
        throw new Error('Announcement not found');
    }
};

// const deleteAttachment = async (fileURI) => {
//     try {
//         // Resolve the full path to the file
//         const filePath = path.join(__dirname, '..', 'uploads', fileURI); // Ensure './uploads' matches your file storage directory
//         console.log(`Attempting to delete: ${filePath}`);

//         // Use the resolved file path in fs.unlink
//         fs.unlink(filePath, (err) => {
//             if (err) {
//                 console.error(`Error deleting attachment ${filePath}:`, err);
//             } else {
//                 console.log(`Deleted attachment ${filePath}`);
//             }
//         });

//         return { message: 'Attachment deleted successfully!' };
//     } catch (error) {
//         throw new Error(error.message);
//     }
// };
const deleteAttachment = async (fileURI) => {
    try {
        // Extract the file name from the file URI
        const fileName = fileURI.replace(`gs://${process.env.BUCKET_NAME}/`, '');
        console.log(`Deleting file ${fileName} from cloud storage...`);
        // Delete the file from the cloud storage bucket
        await bucket.file(fileName).delete();
        console.log(`File ${fileName} deleted from cloud storage.`);

        return { message: 'Attachment deleted successfully!' };
    } catch (error) {
        console.error('Error deleting attachment from cloud storage:', error);
        throw new Error(error.message);
    }
};

const fetchAttachmentFromStorage = async (announcementId) => {
    try {
            const announcement = await AnnouncementModel.findById(announcementId);
            if (!announcement) {
                throw new Error('Attachment not found.');
            }
    
            if (!announcement.fileURI.startsWith('gs://')) {
                throw new Error('Attachment is not stored in Google Cloud Storage.');
            }
            const bucketFile = bucket.file(announcement.fileURI.replace(`gs://${process.env.BUCKET_NAME}/`, ''));
    
            // Generate a signed URL
            const [url] = await bucketFile.getSignedUrl({
                action: 'read',
                expires: Date.now() + 1000 * 60 * 60, // 1 hour expiration
            });
    
            console.log('Generated signed URL:', url); // Log the signed URL
            return { url, fileName: announcement.fileName };
        } catch (error) {
            console.error('Error fetching attachment from storage:', error);
            throw new Error('Error fetching attachment from storage');
        }
}


module.exports = {
    getAnnouncements,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    deleteAttachment,
    fetchAttachmentFromStorage,
};
