const mongoose = require('mongoose');
const AnnouncementModel = require('../models/announcementModel');
const fs = require('fs');
const path = require('path');

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

const createAnnouncement = async (body, file) => {
    try {
        const {
            title,
            description,
        } = body;

        const newAnnouncement = new AnnouncementModel({
            title,
            description,
            fileURI: file ? file.filename : null,
            fileName: file ? file.originalname : null,
        });

        console.log(newAnnouncement);

        const savedAnnouncement = await newAnnouncement.save();
        return savedAnnouncement;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Update an announcement
const updateAnnouncement = async (id, updateData, file) => {
    // Check id format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Announcement not found');
    }
    // Find announcement by id and update title, description, fileURI, and fileName
    const announcement = await AnnouncementModel.findByIdAndUpdate(id,
        {
            ...updateData,
            fileURI: file ? file.filename : null,
            fileName: file ? file.originalname : null
        },
        { new: true }
    );

    if (!announcement) {
        throw new Error('Announcement not found');
    }
    return announcement;
};

// Delete an announcement
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

const deleteAttachment = async (fileURI) => {
    try {
        // Resolve the full path to the file
        const filePath = path.join(__dirname, '..', 'uploads', fileURI); // Ensure './uploads' matches your file storage directory
        console.log(`Attempting to delete: ${filePath}`);

        // Use the resolved file path in fs.unlink
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Error deleting attachment ${filePath}:`, err);
            } else {
                console.log(`Deleted attachment ${filePath}`);
            }
        });

        return { message: 'Attachment deleted successfully!' };
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = {
    getAnnouncements,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    deleteAttachment,
};
