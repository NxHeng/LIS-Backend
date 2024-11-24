const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const TokenBlacklist = require('../models/tokenBlacklist');

const createStaff = async (username, email, password) => {
    const newUser = new UserModel({ username, email, password });
    return newUser.save();
};

const createClient = async (username, email, password, phone, ic) => {
    const newUser = new UserModel({ username, email, password, phone, ic });
    newUser.role = 'client-pending';
    return newUser.save();
};

const authenticateUser = async (email, password) => {
    const user = await UserModel.findOne({ email });
    if (!user) {
        return { success: false, message: 'User not found' };
    }

    if (user.role === 'pending' || user.role === 'client-pending' || user.role === 'rejected') {
        if (user.role === 'pending' || user.role === 'client-pending') {
            return { success: false, message: 'Account is pending for approval' };
        } else {
            return { success: false, message: 'Account has been rejected' };
        }
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return { success: false, message: 'Invalid password' };
    }

    const token = jwt.sign(
        {
            _id: user._id,
            role: user.role,
            username: user.username
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '24h'
        });
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    return UserModel.find({}, { _id: 1, username: 1, email: 1, role: 1, phone: 1, ic: 1 });
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

const generatePasswordResetToken = async (email) => {
    const user = await UserModel.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    return resetToken;
}

const sendPasswordResetEmail = async (email, resetToken) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request (Legal Information System)',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Legal Information System</h1>
                    <p style="margin: 0;">Password Reset Request</p>
                </div>
                <div style="padding: 20px; line-height: 1.6; color: #333;">
                    <p>Hello,</p>
                    <p>
                        You are receiving this email because you (or someone else) have requested to reset your account password. If this request was made by you, please click the button below to reset your password:
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
                            Reset Password
                        </a>
                    </div>
                    <p>If the button above does not work, please copy and paste the following link into your browser:</p>
                    <p style="word-break: break-all; color: #4CAF50;">${resetUrl}</p>
                    <p>
                        If you did not request this, please ignore this email. Your password will remain unchanged, and no action is needed.
                    </p>
                    <p>Thank you,<br>The Legal Information System Team</p>
                </div>
                <div style="background-color: #f4f4f4; color: #666; padding: 10px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">© ${new Date().getFullYear()} Legal Information System. All Rights Reserved.</p>
                </div>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email: ", error);
        } else {
            console.log("Email sent: ", info.response);
        }
    });
}

const resetPassword = async (resetToken, newPassword) => {
    const user = await UserModel.findOne({
        resetPasswordToken: resetToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new Error('Invalid or expired token');
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();
}

module.exports = {
    createStaff,
    createClient,
    authenticateUser,
    getUserDetails,
    blacklistToken,
    changePassword,
    getUserList,
    updateRole,
    deleteUser,
    generatePasswordResetToken,
    sendPasswordResetEmail,
    resetPassword
};
