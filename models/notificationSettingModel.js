const mongoose = require('mongoose');

const NotificationSettingsSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }, // e.g., 'new_case', 'status_change', etc.
  name: { type: String, required: true },               // e.g., 'New Case', 'Status Change', etc.
  isEnabled: { type: Boolean, default: true },         // Determines if notification is active
  sendEmail: { type: Boolean, default: false },        // Whether the notification should send an email
});

module.exports = mongoose.model('NotificationSetting', NotificationSettingsSchema);
