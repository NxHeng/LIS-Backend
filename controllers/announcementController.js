const announcementService = require('../services/announcementService');
const notificationService = require('../services/notificationService');
const UserModel = require('../models/UserModel');
const path = require('path');
const fs = require('fs');

// Get all announcements
const getAnnouncements = async (req, res) => {
    try {
        const announcements = await announcementService.getAnnouncements();
        res.status(200).json(announcements);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get a single announcement
const getAnnouncement = async (req, res) => {
    const id = req.params.id;
    try {
        const announcement = await announcementService.getAnnouncement(id);
        res.status(200).json(announcement);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const file = req.file;
        const announcement = await announcementService.createAnnouncement(req.body, file);

        // Notify solicitor and clerk
        const { title } = announcement;
        // Fetch users with roles solicitor, clerk, or admin
        const usersNotified = await UserModel.find({ role: { $in: ['solicitor', 'clerk', 'admin'] } }).select('_id');

        // Extract user IDs from the result
        const userIds = usersNotified.map(user => user._id);

        await notificationService.createAndEmitAnnouncement(req.io, {
            type: 'announcement',
            message: title,
            announcementId: announcement,
            usersNotified: userIds, // Pass user IDs
        });
        res.status(201).json(announcement);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const updateAnnouncement = async (req, res) => {
    const { id } = req.params;
    const announcementData = req.body;
    try {
        if (!id) {
            return res.status(400).send({ message: "Missing announcement ID" });
        }
        const updatedAnnouncement = await announcementService.updateAnnouncement(id, announcementData);
        res.status(200).json(updatedAnnouncement);
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).send({ message: error.message });
    }
}

const deleteAnnouncement = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) {
            return res.status(400).send({ message: "Missing announcement ID" });
        }
        await announcementService.deleteAnnouncement(id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).send({ message: error.message });
    }
}

const fetchAttachment = async (req, res) => {
    const { URI } = req.params;

    // Use __dirname to get the absolute path of the current directory
    const filePath = path.join(__dirname, '../uploads', URI);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) {
                // Handle error (e.g., file not found)
                res.status(500).send('File download failed');
            }
        });
    } else {
        // If the file doesn't exist, return an error
        res.status(404).send('File not found');
    }
}

const deleteAttachment = async (req, res) => {
    const { URI } = req.params;
    try {
        console.log(URI);
        await announcementService.deleteAttachment(URI);
        res.status(204).send();
    } catch (error) {
        res.status(500).send(error.message);
    }
}


module.exports = {
    getAnnouncements,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    fetchAttachment,
    deleteAttachment,
};
