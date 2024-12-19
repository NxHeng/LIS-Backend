const notificationSettingService = require('../services/notificationSettingService');

// Get all notification settings
const getNotificationSettings = async (req, res) => {
    try {
        const settings = await notificationSettingService.getAllSettings();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a specific notification setting
const updateNotificationSetting = async (req, res) => {
    const { type, isEnabled, sendEmail } = req.body;
    try {
        const updatedSetting = await notificationSettingService.updateSetting(type, {
            isEnabled,
            sendEmail,
        });
        res.status(200).json(updatedSetting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const initializeNotificationSettings = async (req, res) => {
    try {
        // Pass user-provided settings if available
        const settings = req.body.settings;

        const createdSettings = await notificationSettingService.initializeNotificationSettings(settings);

        res.status(201).json({
            message: 'Notification settings initialized successfully',
            data: createdSettings,
        });
    } catch (error) {
        if (error.message === 'Notification settings already initialized.') {
            return res.status(400).json({ message: error.message });
        }

        console.error('Error initializing notification settings:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { initializeNotificationSettings };


module.exports = {
    getNotificationSettings,
    updateNotificationSetting,
    initializeNotificationSettings,
};
