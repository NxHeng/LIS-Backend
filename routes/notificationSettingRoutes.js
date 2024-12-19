const express = require('express');
const notificationSettingController = require('../controllers/notificationSettingController');

const router = express.Router();

// Route to fetch all settings
router.get('/fetchSettings', notificationSettingController.getNotificationSettings);

// Route to update a specific setting
router.patch('/updateSetting', notificationSettingController.updateNotificationSetting);

router.post('/initialize', notificationSettingController.initializeNotificationSettings);


module.exports = router;
