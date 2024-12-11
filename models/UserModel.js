const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: false,
        default: null
    },
    ic: {
        type: String,
        required: false,
        default: null

    },
    role: {
        type: String,
        // enum: ['solicitor', 'clerk', 'admin', 'pending', 'rejected', 'client', 'client-pending', 'client-rejected'],
        enum: ['solicitor', 'clerk', 'admin', 'client'],
        default: 'pending',
        required: true,
    },
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    },
});

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Check if the model is already compiled to avoid recompilation
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = UserModel;
