const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const linkSchema = new Schema({
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true }, // Reference to the case
});

module.exports = mongoose.model('TemporaryLink', linkSchema);
