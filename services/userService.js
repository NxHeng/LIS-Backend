const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
const TokenBlacklist = require('../models/tokenBlacklist');

const createUser = async (username, email, password) => {
    const newUser = new UserModel({ username, email, password });
    return newUser.save();
};

const authenticateUser = async (email, password) => {
    const user = await UserModel.findOne({ email });
    if (!user) {
        return { success: false, message: 'User not found' };
    }

    if (user.role === 'pending' || user.role === 'rejected') {
        if (user.role === 'pending') {
            return { success: false, message: 'Account is pending approval' };
        } else {
            return { success: false, message: 'Account has been rejected' };
        }
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return { success: false, message: 'Invalid password' };
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return { success: true, token, user };
};


const getUserDetails = async (userId) => {
    const user = await UserModel.findById(userId).select('-password');
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};

const blacklistToken = async (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) {
            throw new Error('Invalid token: Token does not contain expiration claim');
        }

        const expiresAt = new Date(decoded.exp * 1000); // Convert seconds to milliseconds
        if (isNaN(expiresAt.getTime())) {
            throw new Error('Invalid token: Failed to convert token expiration to a valid date');
        }

        const blacklistedToken = new TokenBlacklist({ token, expiresAt });
        await blacklistedToken.save();
        console.log('Token blacklisted successfully');
    } catch (error) {
        console.error('Error blacklisting token:', error.message);
        throw error; // Re-throw the error to be handled by the caller
    }
};


const changePassword = async (userId, oldPassword, newPassword) => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const match = await user.comparePassword(oldPassword);
    if (!match) {
        throw new Error('Old password does not match');
    }

    // Set the new password
    user.password = newPassword;
    // Save the user object, the pre('save') middleware will hash the new password
    await user.save();

    return user;
};

// get list of users with id and name
const getUserList = async () => {
    return UserModel.find({}, { _id: 1, username: 1, email: 1, role: 1 });
};

const updateRole = async (userId, role) => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.role = role;
    await user.save();

    return user;
};

const deleteUser = async (userId) => {
    try {
        const user = await UserModel.findByIdAndDelete(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    catch (error) {
        throw error;
    }
}

module.exports = {
    createUser,
    authenticateUser,
    getUserDetails,
    blacklistToken,
    changePassword,
    getUserList,
    updateRole,
    deleteUser
};
