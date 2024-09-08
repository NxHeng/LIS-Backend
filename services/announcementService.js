const mongoose = require('mongoose');
const AnnouncementModel = require('../models/announcementModel');

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

const createAnnouncement = async (body) => {
    try {
        const {
            title,
            description,
        } = body;

        const newAnnouncement = new AnnouncementModel({
            title,
            description,
        });

        const savedAnnouncement = await newAnnouncement.save();
        return savedAnnouncement;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Update an announcement
const updateAnnouncement = async (id, updateData) => {
    // Check id format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Announcement not found');
    }
    // Find announcement by id and update
    const announcement = await AnnouncementModel.findOneAndUpdate({ _id: id }, updateData, { new: true });
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
    // Find announcement by id and delete
    const announcement = await AnnouncementModel.findByIdAndDelete(id);
    if (!announcement) {
        throw new Error('Announcement not found');
    }
};

module.exports = {
    getAnnouncements,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
};
