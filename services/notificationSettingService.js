const NotificationSettingModel = require('../models/NotificationSettingModel');

// Fetch all settings
const getAllSettings = async () => {
    return await NotificationSettingModel.find();
};

// Update a specific setting
const updateSetting = async (type, updates) => {
    return await NotificationSettingModel.findOneAndUpdate(
        { type },
        updates,
        { new: true, upsert: true }
    );
};

// Check if a notification type should be sent
const shouldSendNotification = async (type) => {
    const setting = await NotificationSettingModel.findOne({ type });

    if (!setting) {
        throw new Error('Notification setting not found.');
    }

    return setting?.isEnabled ?? false;
};

// Check if email should be sent for a notification type
const shouldSendEmail = async (type) => {
    const setting = await NotificationSettingModel.findOne({ type });

    if (!setting) {
        throw new Error('Notification setting not found.');
    }

    return setting?.sendEmail ?? false;
};

const initializeNotificationSettings = async (settings) => {
    const defaultSettings = [
        { type: 'new_case', name: 'New Case', isEnabled: true, sendEmail: true },
        { type: 'status_change', name: 'Status Change', isEnabled: true, sendEmail: false },
        { type: 'detail_update', name: 'Detail Update', isEnabled: true, sendEmail: false },
        { type: 'deadline', name: 'Deadline', isEnabled: true, sendEmail: false },
        { type: 'reminder', name: 'Reminder', isEnabled: true, sendEmail: false },
    ];

    // Check if settings already exist
    const existingSettings = await NotificationSettingModel.find();
    if (existingSettings.length > 0) {
        throw new Error('Notification settings already initialized.');
    }

    // Use provided settings or fallback to defaults
    const finalSettings = settings || defaultSettings;

    // Insert settings into the database
    return await NotificationSettingModel.insertMany(finalSettings);
};

module.exports = {
    getAllSettings,
    updateSetting,
    shouldSendNotification,
    shouldSendEmail,
    initializeNotificationSettings,
};
